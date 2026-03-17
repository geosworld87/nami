import { describe, it, expect } from "vitest";
import { buildHierarchy } from "../src/utils/hierarchy-builder.js";
import type { GraphNode } from "../src/api/client.js";

function makeNode(overrides: Partial<GraphNode> & { id: string; name: string; kind: string; filePath: string }): GraphNode {
  return {
    startLine: 1,
    endLine: 10,
    metadata: {},
    ...overrides,
  };
}

describe("buildHierarchy", () => {
  const visibleKinds = new Set(["class", "struct", "enum", "protocol", "function"]);

  /** Helper: get the repo node (root → repo → modules) */
  function getRepo(tree: ReturnType<typeof buildHierarchy>) {
    expect(tree.kind).toBe("root");
    expect(tree.children).toHaveLength(1);
    return tree.children![0];
  }

  it("wraps modules in a repo node named after repoName", () => {
    const nodes: GraphNode[] = [
      makeNode({ id: "f1", name: "User.swift", kind: "file", filePath: "Models/User.swift", metadata: { linesOfCode: 100 } }),
    ];

    const tree = buildHierarchy(nodes, visibleKinds, "loc", "swift-ios");
    const repo = getRepo(tree);
    expect(repo.name).toBe("swift-ios");
    expect(repo.id).toBe("repo");
  });

  it("groups files by directory into modules", () => {
    const nodes: GraphNode[] = [
      makeNode({ id: "f1", name: "User.swift", kind: "file", filePath: "Models/User.swift", metadata: { linesOfCode: 100 } }),
      makeNode({ id: "f2", name: "Auth.swift", kind: "file", filePath: "Services/Auth.swift", metadata: { linesOfCode: 200 } }),
    ];

    const tree = buildHierarchy(nodes, visibleKinds);
    const repo = getRepo(tree);
    expect(repo.children).toHaveLength(2);

    const moduleNames = repo.children!.map((c) => c.name).sort();
    expect(moduleNames).toEqual(["Models", "Services"]);
  });

  it("attaches entities as children of their file", () => {
    const nodes: GraphNode[] = [
      makeNode({ id: "f1", name: "User.swift", kind: "file", filePath: "Models/User.swift", metadata: { linesOfCode: 100 } }),
      makeNode({ id: "e1", name: "User", kind: "class", filePath: "Models/User.swift", metadata: { linesOfCode: 80, methodCount: 5 } }),
      makeNode({ id: "e2", name: "UserRole", kind: "enum", filePath: "Models/User.swift", metadata: { linesOfCode: 20 } }),
    ];

    const tree = buildHierarchy(nodes, visibleKinds);
    const repo = getRepo(tree);

    const modelsModule = repo.children!.find((c) => c.name === "Models")!;
    expect(modelsModule.children).toHaveLength(1);

    const file = modelsModule.children![0];
    expect(file.name).toBe("User.swift");
    expect(file.children).toHaveLength(2);

    const entityNames = file.children!.map((c) => c.name).sort();
    expect(entityNames).toEqual(["User", "UserRole"]);
  });

  it("uses linesOfCode as value in loc mode", () => {
    const nodes: GraphNode[] = [
      makeNode({ id: "f1", name: "A.swift", kind: "file", filePath: "Src/A.swift", metadata: { linesOfCode: 50 } }),
      makeNode({ id: "e1", name: "A", kind: "class", filePath: "Src/A.swift", metadata: { linesOfCode: 42, methodCount: 3 } }),
    ];

    const tree = buildHierarchy(nodes, visibleKinds, "loc");
    const repo = getRepo(tree);
    const entity = repo.children![0].children![0].children![0];
    expect(entity.value).toBe(42);
  });

  it("uses methods+props as value in methods mode", () => {
    const nodes: GraphNode[] = [
      makeNode({ id: "f1", name: "A.swift", kind: "file", filePath: "Src/A.swift", metadata: { linesOfCode: 50 } }),
      makeNode({ id: "e1", name: "A", kind: "class", filePath: "Src/A.swift", metadata: { linesOfCode: 42, methodCount: 3, propertyCount: 5 } }),
    ];

    const tree = buildHierarchy(nodes, visibleKinds, "methods");
    const repo = getRepo(tree);
    const entity = repo.children![0].children![0].children![0];
    expect(entity.value).toBe(8); // 3 + 5
  });

  it("filters entities by visibleKinds", () => {
    const nodes: GraphNode[] = [
      makeNode({ id: "f1", name: "A.swift", kind: "file", filePath: "Src/A.swift", metadata: { linesOfCode: 50 } }),
      makeNode({ id: "e1", name: "A", kind: "class", filePath: "Src/A.swift", metadata: { linesOfCode: 42 } }),
      makeNode({ id: "e2", name: "B", kind: "extension", filePath: "Src/A.swift", metadata: { linesOfCode: 10 } }),
    ];

    // extension is not in visibleKinds
    const tree = buildHierarchy(nodes, visibleKinds);
    const repo = getRepo(tree);
    const file = repo.children![0].children![0];
    expect(file.children).toHaveLength(1);
    expect(file.children![0].name).toBe("A");
  });

  it("files without entities become leaf nodes", () => {
    const nodes: GraphNode[] = [
      makeNode({ id: "f1", name: "Config.swift", kind: "file", filePath: "Util/Config.swift", metadata: { linesOfCode: 30 } }),
    ];

    const tree = buildHierarchy(nodes, visibleKinds);
    const repo = getRepo(tree);
    const file = repo.children![0].children![0];
    expect(file.children).toBeUndefined();
    expect(file.value).toBe(30);
  });
});
