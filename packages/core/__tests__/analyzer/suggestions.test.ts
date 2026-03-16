import { describe, it, expect } from "vitest";
import { generateSuggestions } from "../../src/analyzer/suggestions.js";
import type { NamiGraph, GraphNode, GraphEdge } from "../../src/graph/model.js";

function makeGraph(
  nodes: Partial<GraphNode>[],
  edges: Partial<GraphEdge>[] = [],
): NamiGraph {
  return {
    version: "1.0.0",
    scannedAt: new Date().toISOString(),
    rootPath: "/tmp",
    nodes: nodes.map((n) => ({
      id: n.id ?? "unknown",
      kind: n.kind ?? "class",
      name: n.name ?? n.id ?? "unknown",
      filePath: n.filePath ?? "test.swift",
      startLine: 0,
      endLine: 100,
      metadata: { linesOfCode: 100, ...n.metadata },
    })),
    edges: edges.map((e) => ({
      id: e.id ?? `${e.source}--${e.kind}-->${e.target}`,
      source: e.source ?? "",
      target: e.target ?? "",
      kind: e.kind ?? "calls",
      metadata: {},
    })),
    stats: {
      totalFiles: 0,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      languageBreakdown: {},
      scanDurationMs: 0,
    },
  };
}

describe("generateSuggestions", () => {
  it("detects circular dependencies", () => {
    const graph = makeGraph(
      [{ id: "A" }, { id: "B" }],
      [
        { source: "A", target: "B", kind: "references" },
        { source: "B", target: "A", kind: "references" },
      ],
    );
    const suggestions = generateSuggestions(graph);
    const circular = suggestions.filter((s) => s.category === "circular-dependency");
    expect(circular).toHaveLength(1);
    expect(circular[0].severity).toBe("critical");
  });

  it("detects god classes by method count", () => {
    const graph = makeGraph([
      {
        id: "AppState",
        kind: "class",
        name: "AppState",
        metadata: { linesOfCode: 100, methodCount: 15, propertyCount: 5 },
      },
    ]);
    const suggestions = generateSuggestions(graph);
    const godClass = suggestions.find((s) => s.category === "god-class");
    expect(godClass).toBeDefined();
    expect(godClass!.title).toContain("AppState");
  });

  it("detects god classes by LOC", () => {
    const graph = makeGraph([
      {
        id: "BigClass",
        kind: "class",
        name: "BigClass",
        metadata: { linesOfCode: 300, methodCount: 5, propertyCount: 5 },
      },
    ]);
    const suggestions = generateSuggestions(graph);
    const godClass = suggestions.find((s) => s.category === "god-class");
    expect(godClass).toBeDefined();
  });

  it("does not flag small classes", () => {
    const graph = makeGraph([
      {
        id: "SmallClass",
        kind: "class",
        name: "SmallClass",
        metadata: { linesOfCode: 50, methodCount: 3, propertyCount: 2 },
      },
    ]);
    const suggestions = generateSuggestions(graph);
    const godClass = suggestions.find((s) => s.category === "god-class");
    expect(godClass).toBeUndefined();
  });

  it("detects high coupling (fan-in)", () => {
    const edges: Partial<GraphEdge>[] = [];
    const nodes: Partial<GraphNode>[] = [{ id: "Core", kind: "class", name: "Core" }];
    for (let i = 0; i < 12; i++) {
      const id = `Dep${i}`;
      nodes.push({ id, kind: "class", name: id });
      edges.push({ source: id, target: "Core", kind: "calls" });
    }
    const graph = makeGraph(nodes, edges);
    const suggestions = generateSuggestions(graph);
    const highFanIn = suggestions.find(
      (s) => s.category === "high-coupling" && s.title.includes("fan-in"),
    );
    expect(highFanIn).toBeDefined();
  });
});
