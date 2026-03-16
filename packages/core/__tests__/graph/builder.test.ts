import { describe, it, expect } from "vitest";
import { GraphBuilder } from "../../src/graph/builder.js";
import type { GraphNode } from "../../src/graph/model.js";

function makeNode(id: string, kind: GraphNode["kind"] = "class"): GraphNode {
  return {
    id,
    kind,
    name: id.split("::").pop()!,
    filePath: "test.swift",
    startLine: 0,
    endLine: 10,
    metadata: { linesOfCode: 10 },
  };
}

describe("GraphBuilder", () => {
  it("builds an empty graph", () => {
    const builder = new GraphBuilder("/tmp/repo");
    const graph = builder.build();
    expect(graph.version).toBe("1.0.0");
    expect(graph.rootPath).toBe("/tmp/repo");
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it("adds nodes and edges", () => {
    const builder = new GraphBuilder("/tmp/repo");
    builder.addNode(makeNode("A"));
    builder.addNode(makeNode("B"));
    builder.addEdge("A", "B", "inherits");
    const graph = builder.build();
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].id).toBe("A--inherits-->B");
  });

  it("deduplicates nodes by id", () => {
    const builder = new GraphBuilder("/tmp/repo");
    builder.addNode(makeNode("A"));
    builder.addNode(makeNode("A"));
    expect(builder.build().nodes).toHaveLength(1);
  });

  it("deduplicates edges by composite id", () => {
    const builder = new GraphBuilder("/tmp/repo");
    builder.addEdge("A", "B", "calls");
    builder.addEdge("A", "B", "calls");
    expect(builder.build().edges).toHaveLength(1);
  });

  it("allows different edge kinds between same nodes", () => {
    const builder = new GraphBuilder("/tmp/repo");
    builder.addEdge("A", "B", "inherits");
    builder.addEdge("A", "B", "calls");
    expect(builder.build().edges).toHaveLength(2);
  });

  it("tracks files and language breakdown", () => {
    const builder = new GraphBuilder("/tmp/repo");
    builder.trackFile("swift");
    builder.trackFile("swift");
    builder.trackFile("typescript");
    const graph = builder.build();
    expect(graph.stats.totalFiles).toBe(3);
    expect(graph.stats.languageBreakdown).toEqual({ swift: 2, typescript: 1 });
  });

  it("has correct stats", () => {
    const builder = new GraphBuilder("/tmp/repo");
    builder.addNode(makeNode("A"));
    builder.addNode(makeNode("B"));
    builder.addEdge("A", "B", "calls");
    const graph = builder.build();
    expect(graph.stats.totalNodes).toBe(2);
    expect(graph.stats.totalEdges).toBe(1);
    expect(graph.stats.scanDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("hasNode and getNode work", () => {
    const builder = new GraphBuilder("/tmp/repo");
    const node = makeNode("A");
    builder.addNode(node);
    expect(builder.hasNode("A")).toBe(true);
    expect(builder.hasNode("B")).toBe(false);
    expect(builder.getNode("A")).toEqual(node);
    expect(builder.getNode("B")).toBeUndefined();
  });
});
