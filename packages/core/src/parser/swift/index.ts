import Parser from "tree-sitter";
import Swift from "tree-sitter-swift";
import type { LanguageParser, ParseResult } from "../base.js";
import type { GraphNode, GraphEdge, NodeKind, EdgeKind } from "../../graph/model.js";
import {
  makeNodeId,
  makeFileNode,
  getKindFromKeyword,
  isDelegateProperty,
  extractNotificationPattern,
  hasPublishedAttribute,
} from "./extractors.js";

export class SwiftParser implements LanguageParser {
  readonly language = "swift";
  readonly extensions = [".swift"];
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Swift as unknown as Parser.Language);
  }

  parseFile(filePath: string, content: string, _repoRoot: string): ParseResult {
    const tree = this.parser.parse(content);
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Always add the file node
    const fileNode = makeFileNode(filePath, content);
    nodes.push(fileNode);

    // Walk the AST
    this.visitNode(tree.rootNode, filePath, nodes, edges);

    return { nodes, edges };
  }

  private visitNode(
    node: Parser.SyntaxNode,
    filePath: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): void {
    switch (node.type) {
      case "import_declaration":
        this.extractImport(node, filePath, edges);
        break;
      case "class_declaration":
        this.extractTypeDeclaration(node, filePath, nodes, edges);
        break;
      case "protocol_declaration":
        this.extractProtocol(node, filePath, nodes, edges);
        break;
      case "function_declaration":
        // Top-level functions only (not inside class/struct)
        if (node.parent?.type === "source_file") {
          this.extractFunction(node, filePath, nodes, edges);
        }
        break;
    }

    // Recurse into children (but not into class/protocol bodies — those are handled above)
    if (node.type !== "class_body" && node.type !== "protocol_body" && node.type !== "enum_class_body") {
      for (let i = 0; i < node.childCount; i++) {
        this.visitNode(node.child(i)!, filePath, nodes, edges);
      }
    }
  }

  private extractImport(
    node: Parser.SyntaxNode,
    filePath: string,
    edges: GraphEdge[],
  ): void {
    const identNode = node.childForFieldName("identifier") ?? findChild(node, "identifier");
    if (!identNode) return;
    const moduleName = identNode.text;
    edges.push(makeEdge(filePath, moduleName, "imports", node.startPosition.row));
  }

  private extractTypeDeclaration(
    node: Parser.SyntaxNode,
    filePath: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): void {
    // Determine kind from keyword (first child: class, struct, enum, extension)
    const firstChild = node.child(0);
    if (!firstChild) return;
    const keyword = firstChild.type;
    const kind = getKindFromKeyword(keyword);

    // Get name
    let name: string;
    if (kind === "extension") {
      // Extension: name comes from user_type node
      const userType = findChild(node, "user_type");
      name = userType?.text ?? "UnknownExtension";
    } else {
      const nameNode = node.childForFieldName("name");
      name = nameNode?.text ?? "Unknown";
    }

    const nodeId = makeNodeId(filePath, name);

    // Count methods and properties in body
    const body = findChild(node, "class_body") ?? findChild(node, "enum_class_body");
    let methodCount = 0;
    let propertyCount = 0;
    const bodyChildren: Parser.SyntaxNode[] = [];

    if (body) {
      for (let i = 0; i < body.childCount; i++) {
        const child = body.child(i)!;
        bodyChildren.push(child);
        if (child.type === "function_declaration" || child.type === "init_declaration") {
          methodCount++;
        } else if (child.type === "property_declaration") {
          propertyCount++;
        }
      }
    }

    // Create the type node
    const graphNode: GraphNode = {
      id: nodeId,
      kind,
      name,
      filePath,
      startLine: node.startPosition.row,
      endLine: node.endPosition.row,
      metadata: {
        linesOfCode: node.endPosition.row - node.startPosition.row + 1,
        methodCount,
        propertyCount,
        isPublic: node.text.includes("public "),
      },
    };
    nodes.push(graphNode);

    // File "declares" this type
    edges.push(makeEdge(filePath, nodeId, "declares", node.startPosition.row));

    // Extract inheritance/conformance
    this.extractInheritance(node, nodeId, filePath, edges);

    // Extract body contents
    if (body) {
      this.extractBodyContents(body, nodeId, filePath, nodes, edges);
    }
  }

  private extractProtocol(
    node: Parser.SyntaxNode,
    filePath: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): void {
    const nameNode = node.childForFieldName("name");
    const name = nameNode?.text ?? "Unknown";
    const nodeId = makeNodeId(filePath, name);

    const body = findChild(node, "protocol_body");
    let methodCount = 0;
    let propertyCount = 0;
    if (body) {
      for (let i = 0; i < body.childCount; i++) {
        const child = body.child(i)!;
        if (child.type === "protocol_function_declaration") methodCount++;
        if (child.type === "protocol_property_declaration" || child.type === "property_declaration") propertyCount++;
      }
    }

    nodes.push({
      id: nodeId,
      kind: "protocol",
      name,
      filePath,
      startLine: node.startPosition.row,
      endLine: node.endPosition.row,
      metadata: {
        linesOfCode: node.endPosition.row - node.startPosition.row + 1,
        methodCount,
        propertyCount,
      },
    });

    edges.push(makeEdge(filePath, nodeId, "declares", node.startPosition.row));

    // Protocol can also inherit from other protocols
    this.extractInheritance(node, nodeId, filePath, edges);
  }

  private extractFunction(
    node: Parser.SyntaxNode,
    filePath: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): void {
    const nameNode = node.childForFieldName("name");
    const name = nameNode?.text ?? "unknown";
    const nodeId = makeNodeId(filePath, name);

    nodes.push({
      id: nodeId,
      kind: "function",
      name,
      filePath,
      startLine: node.startPosition.row,
      endLine: node.endPosition.row,
      metadata: {
        linesOfCode: node.endPosition.row - node.startPosition.row + 1,
      },
    });

    edges.push(makeEdge(filePath, nodeId, "declares", node.startPosition.row));
  }

  private extractInheritance(
    node: Parser.SyntaxNode,
    typeId: string,
    filePath: string,
    edges: GraphEdge[],
  ): void {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i)!;
      if (child.type === "inheritance_specifier") {
        const inheritsFrom = child.childForFieldName("inherits_from");
        if (inheritsFrom) {
          const parentName = inheritsFrom.text;
          // Heuristic: if it ends with Protocol/Delegate or starts lowercase, it's conformance
          // Otherwise, the first one is usually inheritance for classes
          const edgeKind: EdgeKind = parentName.endsWith("Protocol") || parentName.endsWith("Delegate")
            ? "conforms_to"
            : "conforms_to"; // For MVP, treat all as conforms_to — we can't distinguish without type info
          edges.push(makeEdge(typeId, parentName, edgeKind, child.startPosition.row));
        }
      }
    }
  }

  private extractBodyContents(
    body: Parser.SyntaxNode,
    parentId: string,
    filePath: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): void {
    for (let i = 0; i < body.childCount; i++) {
      const child = body.child(i)!;

      if (child.type === "property_declaration") {
        this.extractProperty(child, parentId, filePath, edges);
      } else if (child.type === "function_declaration") {
        this.extractMethodCalls(child, parentId, filePath, edges);
      } else if (child.type === "init_declaration") {
        this.extractInitDependencies(child, parentId, filePath, edges);
      }
    }
  }

  private extractProperty(
    node: Parser.SyntaxNode,
    parentId: string,
    filePath: string,
    edges: GraphEdge[],
  ): void {
    // Get property name
    const pattern = findChild(node, "pattern");
    const propNameNode = pattern?.childForFieldName("bound_identifier");
    const propName = propNameNode?.text ?? "";

    // Get type annotation
    const typeAnnotation = findChild(node, "type_annotation");
    const typeName = typeAnnotation ? extractTypeName(typeAnnotation) : "";

    // Detect delegate pattern
    if (propName && typeName && isDelegateProperty(propName, typeName)) {
      const cleanType = typeName.replace("?", "").replace("!", "");
      edges.push(makeEdge(parentId, cleanType, "delegates_to", node.startPosition.row));
    }

    // Detect @Published (Combine)
    const modifiers = findChild(node, "modifiers");
    if (modifiers && hasPublishedAttribute(modifiers.text)) {
      edges.push(makeEdge(parentId, `${propName}@Published`, "publishes", node.startPosition.row));
    }

    // Type reference
    if (typeName) {
      const cleanType = typeName.replace("?", "").replace("!", "").replace("[", "").replace("]", "");
      if (cleanType && cleanType[0] === cleanType[0].toUpperCase() && cleanType !== "String" && cleanType !== "Int" && cleanType !== "Bool" && cleanType !== "Double" && cleanType !== "Float" && cleanType !== "Date" && cleanType !== "URL" && cleanType !== "Data" && cleanType !== "Any" && cleanType !== "Void") {
        edges.push(makeEdge(parentId, cleanType, "references", node.startPosition.row));
      }
    }
  }

  private extractMethodCalls(
    node: Parser.SyntaxNode,
    parentId: string,
    filePath: string,
    edges: GraphEdge[],
  ): void {
    // Walk function body for call expressions
    const body = findChild(node, "function_body");
    if (!body) return;

    walkTree(body, (child) => {
      if (child.type === "call_expression") {
        const callText = child.text;

        // Detect NotificationCenter patterns
        const notifPattern = extractNotificationPattern(callText);
        if (notifPattern) {
          // Try to extract the notification name
          const nameMatch = callText.match(/\.(\w+)/g);
          const notifName = nameMatch?.[2] ?? "unknown_notification";
          edges.push(makeEdge(parentId, notifName, notifPattern, child.startPosition.row));
        }

        // Detect method calls on known objects: x.method()
        const navExpr = findChild(child, "navigation_expression");
        if (navExpr) {
          const target = navExpr.child(0);
          const suffix = findChild(navExpr, "navigation_suffix");
          if (target && suffix) {
            const targetName = target.text;
            const methodName = suffix.text.replace(".", "");
            // Only track calls to non-self, non-super targets
            if (targetName !== "self" && targetName !== "super" && targetName[0] === targetName[0].toLowerCase()) {
              edges.push(makeEdge(parentId, targetName, "calls", child.startPosition.row));
            }
          }
        }
      }
    });
  }

  private extractInitDependencies(
    node: Parser.SyntaxNode,
    parentId: string,
    filePath: string,
    edges: GraphEdge[],
  ): void {
    // Look for parameters with Protocol/Service types -> DI
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i)!;
      if (child.type === "parameter") {
        const typeNode = findChild(child, "user_type");
        if (typeNode) {
          const typeName = typeNode.text;
          edges.push(makeEdge(parentId, typeName, "injects", node.startPosition.row));
        }
      }
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function findChild(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode | null {
  for (let i = 0; i < node.childCount; i++) {
    if (node.child(i)!.type === type) return node.child(i)!;
  }
  return null;
}

function walkTree(node: Parser.SyntaxNode, visitor: (node: Parser.SyntaxNode) => void): void {
  visitor(node);
  for (let i = 0; i < node.childCount; i++) {
    walkTree(node.child(i)!, visitor);
  }
}

function extractTypeName(typeAnnotation: Parser.SyntaxNode): string {
  // Type annotation has format: `: TypeName` or `: TypeName?` etc
  // Look for the actual type inside
  const nameNode = typeAnnotation.childForFieldName("name");
  if (nameNode) return nameNode.text;
  // Fallback: get text after the colon
  const text = typeAnnotation.text.replace(/^:\s*/, "");
  return text;
}

function makeEdge(
  source: string,
  target: string,
  kind: EdgeKind,
  line: number,
): GraphEdge {
  return {
    id: `${source}--${kind}-->${target}`,
    source,
    target,
    kind,
    metadata: { line },
  };
}
