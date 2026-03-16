import type { GraphNode, GraphEdge, NodeKind, EdgeKind } from "../../graph/model.js";

// Helper to create a node ID
export function makeNodeId(filePath: string, name: string): string {
  return `${filePath}::${name}`;
}

// Helper to create a file-level node
export function makeFileNode(filePath: string, content: string): GraphNode {
  const lines = content.split("\n");
  return {
    id: filePath,
    kind: "file",
    name: filePath.split("/").pop()!,
    filePath,
    startLine: 0,
    endLine: lines.length,
    metadata: {
      linesOfCode: lines.filter((l) => l.trim().length > 0).length,
      isTestFile: filePath.includes("Test") || filePath.includes("__tests__"),
    },
  };
}

// Determine node kind from the first child keyword of class_declaration
export function getKindFromKeyword(keyword: string): NodeKind {
  switch (keyword) {
    case "class":
      return "class";
    case "struct":
      return "struct";
    case "enum":
      return "enum";
    case "extension":
      return "extension";
    default:
      return "class";
  }
}

// Detect delegate pattern from property name/type
export function isDelegateProperty(
  propName: string,
  typeName: string,
): boolean {
  return (
    propName === "delegate" ||
    propName.endsWith("Delegate") ||
    typeName.endsWith("Delegate") ||
    typeName.endsWith("Delegate?")
  );
}

// Extract NotificationCenter patterns from a call expression text
export function extractNotificationPattern(
  callText: string,
): "publishes" | "observes" | null {
  if (
    callText.includes("NotificationCenter") &&
    callText.includes(".post(")
  ) {
    return "publishes";
  }
  if (
    callText.includes("NotificationCenter") &&
    callText.includes(".addObserver(")
  ) {
    return "observes";
  }
  return null;
}

// Extract Combine @Published detection
export function hasPublishedAttribute(modifiersText: string): boolean {
  return modifiersText.includes("@Published");
}

// Extract .sink pattern for Combine subscriptions
export function hasSinkSubscription(text: string): boolean {
  return text.includes(".sink") || text.includes(".receive(on:");
}

// Detect if a type name looks like a protocol (heuristic)
export function looksLikeProtocol(typeName: string): boolean {
  return typeName.endsWith("Protocol") || typeName.endsWith("Delegate");
}
