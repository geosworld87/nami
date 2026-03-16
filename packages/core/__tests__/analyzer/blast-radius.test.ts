import { describe, it, expect } from "vitest";
import { analyzeBlastRadius } from "../../src/analyzer/blast-radius.js";
import type { NamiGraph } from "../../src/graph/model.js";

function makeGraph(edges: Array<{ source: string; target: string; kind: string }>): NamiGraph {
  const nodeIds = new Set<string>();
  for (const e of edges) {
    nodeIds.add(e.source);
    nodeIds.add(e.target);
  }
  return {
    version: "1.0.0",
    scannedAt: new Date().toISOString(),
    rootPath: "/tmp",
    nodes: Array.from(nodeIds).map((id) => ({
      id,
      kind: "class" as const,
      name: id,
      filePath: `${id}.swift`,
      startLine: 0,
      endLine: 10,
      metadata: { linesOfCode: 10 },
    })),
    edges: edges.map((e) => ({
      id: `${e.source}--${e.kind}-->${e.target}`,
      source: e.source,
      target: e.target,
      kind: e.kind as any,
      metadata: {},
    })),
    stats: { totalFiles: 0, totalNodes: nodeIds.size, totalEdges: edges.length, languageBreakdown: {}, scanDurationMs: 0 },
  };
}

describe("analyzeBlastRadius", () => {
  it("finds direct dependents", () => {
    const graph = makeGraph([
      { source: "A", target: "B", kind: "calls" },
      { source: "C", target: "B", kind: "calls" },
    ]);
    const result = analyzeBlastRadius(graph, "B");
    expect(result.totalAffected).toBe(2);
    expect(result.affectedNodes.map((n) => n.node.id).sort()).toEqual(["A", "C"]);
    expect(result.affectedNodes[0].distance).toBe(1);
  });

  it("follows transitive dependencies", () => {
    const graph = makeGraph([
      { source: "A", target: "B", kind: "calls" },
      { source: "B", target: "C", kind: "calls" },
    ]);
    const result = analyzeBlastRadius(graph, "C");
    expect(result.totalAffected).toBe(2);
    const distances = result.affectedNodes.map((n) => ({ id: n.node.id, d: n.distance }));
    expect(distances).toEqual([
      { id: "B", d: 1 },
      { id: "A", d: 2 },
    ]);
  });

  it("handles no dependents", () => {
    const graph = makeGraph([
      { source: "A", target: "B", kind: "calls" },
    ]);
    const result = analyzeBlastRadius(graph, "A");
    expect(result.totalAffected).toBe(0);
  });

  it("respects maxDepth", () => {
    const graph = makeGraph([
      { source: "A", target: "B", kind: "calls" },
      { source: "B", target: "C", kind: "calls" },
      { source: "C", target: "D", kind: "calls" },
    ]);
    const result = analyzeBlastRadius(graph, "D", { maxDepth: 1 });
    expect(result.totalAffected).toBe(1);
    expect(result.affectedNodes[0].node.id).toBe("C");
  });

  it("handles cycles without infinite loop", () => {
    const graph = makeGraph([
      { source: "A", target: "B", kind: "calls" },
      { source: "B", target: "A", kind: "calls" },
    ]);
    const result = analyzeBlastRadius(graph, "A");
    expect(result.totalAffected).toBe(1);
    expect(result.affectedNodes[0].node.id).toBe("B");
  });

  it("includes path information", () => {
    const graph = makeGraph([
      { source: "A", target: "B", kind: "calls" },
      { source: "B", target: "C", kind: "calls" },
    ]);
    const result = analyzeBlastRadius(graph, "C");
    const nodeA = result.affectedNodes.find((n) => n.node.id === "A");
    expect(nodeA!.path).toEqual(["C", "B", "A"]);
  });
});
