import { describe, it, expect } from "vitest";
import { GraphNodeSchema, GraphEdgeSchema, NamiGraphSchema } from "../../src/graph/model.js";

describe("GraphNodeSchema", () => {
  it("validates a correct node", () => {
    const node = {
      id: "Models/User.swift::User",
      kind: "struct",
      name: "User",
      filePath: "Models/User.swift",
      startLine: 3,
      endLine: 12,
      metadata: { linesOfCode: 10 },
    };
    expect(GraphNodeSchema.parse(node)).toEqual(node);
  });

  it("rejects invalid kind", () => {
    const node = {
      id: "test",
      kind: "invalid_kind",
      name: "Foo",
      filePath: "foo.swift",
      startLine: 0,
      endLine: 0,
      metadata: { linesOfCode: 0 },
    };
    expect(() => GraphNodeSchema.parse(node)).toThrow();
  });

  it("accepts optional metadata fields", () => {
    const node = {
      id: "test",
      kind: "class",
      name: "Foo",
      filePath: "foo.swift",
      startLine: 0,
      endLine: 50,
      metadata: {
        linesOfCode: 50,
        methodCount: 5,
        propertyCount: 3,
        isPublic: true,
      },
    };
    const parsed = GraphNodeSchema.parse(node);
    expect(parsed.metadata.methodCount).toBe(5);
    expect(parsed.metadata.isPublic).toBe(true);
  });
});

describe("GraphEdgeSchema", () => {
  it("validates a correct edge", () => {
    const edge = {
      id: "A--inherits-->B",
      source: "A",
      target: "B",
      kind: "inherits",
      metadata: { line: 5 },
    };
    expect(GraphEdgeSchema.parse(edge)).toEqual(edge);
  });

  it("rejects invalid edge kind", () => {
    expect(() =>
      GraphEdgeSchema.parse({
        id: "x",
        source: "A",
        target: "B",
        kind: "bad_kind",
        metadata: {},
      }),
    ).toThrow();
  });
});

describe("NamiGraphSchema", () => {
  it("validates a minimal graph", () => {
    const graph = {
      version: "1.0.0" as const,
      scannedAt: new Date().toISOString(),
      rootPath: "/tmp/repo",
      nodes: [],
      edges: [],
      stats: {
        totalFiles: 0,
        totalNodes: 0,
        totalEdges: 0,
        languageBreakdown: {},
        scanDurationMs: 0,
      },
    };
    expect(NamiGraphSchema.parse(graph)).toEqual(graph);
  });

  it("rejects wrong version", () => {
    expect(() =>
      NamiGraphSchema.parse({
        version: "2.0.0",
        scannedAt: new Date().toISOString(),
        rootPath: "/tmp",
        nodes: [],
        edges: [],
        stats: {
          totalFiles: 0,
          totalNodes: 0,
          totalEdges: 0,
          languageBreakdown: {},
          scanDurationMs: 0,
        },
      }),
    ).toThrow();
  });
});
