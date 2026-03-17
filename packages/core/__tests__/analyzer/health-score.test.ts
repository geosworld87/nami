import { describe, it, expect } from "vitest";
import { computeHealthScore } from "../../src/analyzer/health-score.js";
import type { NamiGraph, GraphNode, GraphEdge } from "../../src/graph/model.js";
import type { CoverageResult } from "../../src/analyzer/coverage.js";
import type { Suggestion } from "../../src/analyzer/suggestions.js";

function makeNode(
  id: string,
  kind: GraphNode["kind"],
  filePath: string,
  overrides: Partial<GraphNode["metadata"]> = {},
): GraphNode {
  return {
    id,
    kind,
    name: id.split("::").pop()!,
    filePath,
    startLine: 0,
    endLine: 50,
    metadata: { linesOfCode: 50, methodCount: 3, propertyCount: 2, ...overrides },
  };
}

function makeEdge(source: string, target: string, kind: GraphEdge["kind"]): GraphEdge {
  return { id: `${source}--${kind}-->${target}`, source, target, kind, metadata: {} };
}

function makeGraph(nodes: GraphNode[], edges: GraphEdge[]): NamiGraph {
  return {
    version: "1.0.0",
    scannedAt: new Date().toISOString(),
    rootPath: "/tmp",
    nodes,
    edges,
    stats: {
      totalFiles: nodes.filter((n) => n.kind === "file").length,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      languageBreakdown: {},
      scanDurationMs: 0,
    },
  };
}

function makeCoverage(coveredFiles: string[]): CoverageResult {
  return {
    coveredFiles: coveredFiles.map((f) => ({ source: f, testFiles: [`Tests/${f}`] })),
    uncoveredFiles: [],
    coveragePercentage: 100,
    byModule: {},
  };
}

describe("computeHealthScore", () => {
  it("gives a high score to a simple covered entity", () => {
    const nodes = [
      makeNode("f1", "file", "Sources/Models/User.swift"),
      makeNode("Sources/Models/User.swift::User", "struct", "Sources/Models/User.swift", {
        linesOfCode: 30,
        methodCount: 2,
        propertyCount: 3,
      }),
    ];
    const graph = makeGraph(nodes, []);
    const coverage = makeCoverage(["Sources/Models/User.swift"]);

    const result = computeHealthScore(graph, coverage, []);
    const entity = result.entities.find((e) => e.entityId === "Sources/Models/User.swift::User");

    expect(entity).toBeDefined();
    expect(entity!.score).toBeGreaterThan(90);
    expect(entity!.grade).toBe("healthy");
  });

  it("gives a low score to an uncovered god class with issues", () => {
    const nodes = [
      makeNode("f1", "file", "Sources/Models/AppState.swift"),
      makeNode("Sources/Models/AppState.swift::AppState", "class", "Sources/Models/AppState.swift", {
        linesOfCode: 500,
        methodCount: 25,
        propertyCount: 30,
      }),
    ];
    const edges: GraphEdge[] = [];
    // Add many incoming edges to create coupling
    for (let i = 0; i < 15; i++) {
      edges.push(
        makeEdge(`dep-${i}`, "Sources/Models/AppState.swift::AppState", "references"),
      );
    }
    const graph = makeGraph(nodes, edges);
    const coverage = makeCoverage([]); // uncovered
    const suggestions: Suggestion[] = [
      {
        id: "god-1",
        title: "God class",
        description: "Too large",
        severity: "warning",
        affectedEntities: ["Sources/Models/AppState.swift::AppState"],
        category: "god-class",
      },
    ];

    const result = computeHealthScore(graph, coverage, suggestions);
    const entity = result.entities.find(
      (e) => e.entityId === "Sources/Models/AppState.swift::AppState",
    );

    expect(entity).toBeDefined();
    expect(entity!.score).toBeLessThan(40);
    expect(entity!.grade).toBe("critical");
  });

  it("computes module scores as averages", () => {
    const nodes = [
      makeNode("f1", "file", "Sources/Models/User.swift"),
      makeNode("f2", "file", "Sources/Models/Post.swift"),
      makeNode("Sources/Models/User.swift::User", "struct", "Sources/Models/User.swift"),
      makeNode("Sources/Models/Post.swift::Post", "struct", "Sources/Models/Post.swift"),
    ];
    const graph = makeGraph(nodes, []);
    const coverage = makeCoverage(["Sources/Models/User.swift", "Sources/Models/Post.swift"]);

    const result = computeHealthScore(graph, coverage, []);
    const modelsModule = result.modules.find((m) => m.module === "Models");

    expect(modelsModule).toBeDefined();
    expect(modelsModule!.entityCount).toBe(2);
    expect(modelsModule!.score).toBeGreaterThan(90);
    expect(modelsModule!.grade).toBe("healthy");
  });

  it("computes overall score as average of modules", () => {
    const nodes = [
      makeNode("f1", "file", "Sources/Models/User.swift"),
      makeNode("f2", "file", "Sources/Views/LoginView.swift"),
      makeNode("Sources/Models/User.swift::User", "struct", "Sources/Models/User.swift"),
      makeNode("Sources/Views/LoginView.swift::LoginView", "struct", "Sources/Views/LoginView.swift"),
    ];
    const graph = makeGraph(nodes, []);
    // Only Models is covered
    const coverage = makeCoverage(["Sources/Models/User.swift"]);

    const result = computeHealthScore(graph, coverage, []);
    expect(result.modules).toHaveLength(2);
    // Overall is average of modules
    expect(result.overall).toBe(
      Math.round(result.modules.reduce((s, m) => s + m.score, 0) / result.modules.length),
    );
    expect(result.overallGrade).toBeDefined();
  });

  it("handles empty graph", () => {
    const graph = makeGraph([], []);
    const coverage = makeCoverage([]);

    const result = computeHealthScore(graph, coverage, []);
    expect(result.entities).toHaveLength(0);
    expect(result.modules).toHaveLength(0);
    expect(result.overall).toBe(100);
  });

  it("clamps score between 0 and 100", () => {
    const nodes = [
      makeNode("f1", "file", "Sources/Bad/Huge.swift"),
      makeNode("Sources/Bad/Huge.swift::Huge", "class", "Sources/Bad/Huge.swift", {
        linesOfCode: 2000,
        methodCount: 100,
        propertyCount: 100,
      }),
    ];
    const edges: GraphEdge[] = [];
    for (let i = 0; i < 30; i++) {
      edges.push(makeEdge(`dep-${i}`, "Sources/Bad/Huge.swift::Huge", "references"));
      edges.push(makeEdge("Sources/Bad/Huge.swift::Huge", `target-${i}`, "calls"));
    }
    const graph = makeGraph(nodes, edges);
    const coverage = makeCoverage([]);
    const suggestions: Suggestion[] = [
      {
        id: "s1",
        title: "Critical",
        description: "Bad",
        severity: "critical",
        affectedEntities: ["Sources/Bad/Huge.swift::Huge"],
        category: "god-class",
      },
      {
        id: "s2",
        title: "Warning",
        description: "Bad",
        severity: "warning",
        affectedEntities: ["Sources/Bad/Huge.swift::Huge"],
        category: "high-coupling",
      },
    ];

    const result = computeHealthScore(graph, coverage, suggestions);
    const entity = result.entities[0];

    expect(entity.score).toBeGreaterThanOrEqual(0);
    expect(entity.score).toBeLessThanOrEqual(100);
  });
});
