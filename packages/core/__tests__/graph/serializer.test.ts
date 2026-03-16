import { describe, it, expect } from "vitest";
import { serialize, deserialize } from "../../src/graph/serializer.js";
import type { NamiGraph } from "../../src/graph/model.js";

function makeGraph(): NamiGraph {
  return {
    version: "1.0.0",
    scannedAt: "2026-01-01T00:00:00.000Z",
    rootPath: "/tmp/repo",
    nodes: [
      {
        id: "User",
        kind: "struct",
        name: "User",
        filePath: "Models/User.swift",
        startLine: 1,
        endLine: 10,
        metadata: { linesOfCode: 10 },
      },
    ],
    edges: [
      {
        id: "A--imports-->B",
        source: "A",
        target: "B",
        kind: "imports",
        metadata: {},
      },
    ],
    stats: {
      totalFiles: 1,
      totalNodes: 1,
      totalEdges: 1,
      languageBreakdown: { swift: 1 },
      scanDurationMs: 42,
    },
  };
}

describe("serializer", () => {
  it("round-trips a graph", () => {
    const graph = makeGraph();
    const json = serialize(graph);
    const restored = deserialize(json);
    expect(restored).toEqual(graph);
  });

  it("serialize produces valid JSON", () => {
    const json = serialize(makeGraph());
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("deserialize rejects invalid JSON", () => {
    expect(() => deserialize("not json")).toThrow();
  });

  it("deserialize rejects invalid graph", () => {
    expect(() => deserialize('{"version":"2.0.0"}')).toThrow();
  });
});
