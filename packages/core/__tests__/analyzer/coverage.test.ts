import { describe, it, expect } from "vitest";
import { analyzeCoverage } from "../../src/analyzer/coverage.js";
import type { NamiGraph } from "../../src/graph/model.js";

function makeFileGraph(files: string[]): NamiGraph {
  return {
    version: "1.0.0",
    scannedAt: new Date().toISOString(),
    rootPath: "/tmp",
    nodes: files.map((f) => ({
      id: f,
      kind: "file" as const,
      name: f.split("/").pop()!,
      filePath: f,
      startLine: 0,
      endLine: 10,
      metadata: { linesOfCode: 10 },
    })),
    edges: [],
    stats: {
      totalFiles: files.length,
      totalNodes: files.length,
      totalEdges: 0,
      languageBreakdown: {},
      scanDurationMs: 0,
    },
  };
}

describe("analyzeCoverage", () => {
  it("maps test files to source files by naming convention", () => {
    const graph = makeFileGraph([
      "Sources/Services/AuthService.swift",
      "Sources/Services/UserService.swift",
      "Sources/Services/PostService.swift",
      "Tests/Services/AuthServiceTests.swift",
      "Tests/Services/UserServiceTests.swift",
    ]);
    const result = analyzeCoverage(graph);
    expect(result.coveredFiles).toHaveLength(2);
    expect(result.uncoveredFiles).toContain("Sources/Services/PostService.swift");
    expect(result.coveragePercentage).toBe(67); // 2/3
  });

  it("returns 0% coverage when no tests", () => {
    const graph = makeFileGraph([
      "Sources/Models/User.swift",
      "Sources/Models/Post.swift",
    ]);
    const result = analyzeCoverage(graph);
    expect(result.coveragePercentage).toBe(0);
    expect(result.uncoveredFiles).toHaveLength(2);
  });

  it("computes per-module coverage", () => {
    const graph = makeFileGraph([
      "Sources/Services/AuthService.swift",
      "Sources/Services/UserService.swift",
      "Sources/Models/User.swift",
      "Tests/Services/AuthServiceTests.swift",
    ]);
    const result = analyzeCoverage(graph);
    expect(result.byModule["Services"]).toEqual({
      covered: 1,
      total: 2,
      percentage: 50,
    });
    expect(result.byModule["Models"]).toEqual({
      covered: 0,
      total: 1,
      percentage: 0,
    });
  });

  it("handles empty graph", () => {
    const graph = makeFileGraph([]);
    const result = analyzeCoverage(graph);
    expect(result.coveragePercentage).toBe(0);
    expect(result.coveredFiles).toHaveLength(0);
  });
});
