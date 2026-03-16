import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import {
  scan,
  ParserRegistry,
  SwiftParser,
  analyzeBlastRadius,
  analyzeCoverage,
  generateSuggestions,
  computeMetrics,
  serialize,
  deserialize,
} from "../src/index.js";

const FIXTURE_PATH = resolve(import.meta.dirname, "../../../fixtures/swift-ios");

describe("end-to-end integration", () => {
  const registry = new ParserRegistry();
  registry.register(new SwiftParser());

  it("scans fixture repo and produces valid graph", () => {
    const graph = scan(FIXTURE_PATH, registry);

    expect(graph.version).toBe("1.0.0");
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.stats.totalFiles).toBeGreaterThan(0);
    expect(graph.stats.languageBreakdown.swift).toBeGreaterThan(0);
  });

  it("serializes and deserializes round-trip", () => {
    const graph = scan(FIXTURE_PATH, registry);
    const json = serialize(graph);
    const restored = deserialize(json);

    expect(restored.nodes.length).toBe(graph.nodes.length);
    expect(restored.edges.length).toBe(graph.edges.length);
    expect(restored.stats).toEqual(graph.stats);
  });

  it("blast radius finds dependents for key entities", () => {
    const graph = scan(FIXTURE_PATH, registry);
    const nm = graph.nodes.find((n) => n.name === "NetworkManager");
    expect(nm).toBeDefined();

    const result = analyzeBlastRadius(graph, nm!.id);
    expect(result.affectedNodes.length).toBeGreaterThan(0);
    expect(result.maxDepth).toBeGreaterThanOrEqual(1);
  });

  it("coverage detects tested and untested modules", () => {
    const graph = scan(FIXTURE_PATH, registry);
    const coverage = analyzeCoverage(graph);

    expect(coverage.coveragePercentage).toBeGreaterThan(0);
    expect(coverage.coveragePercentage).toBeLessThan(100);

    // Services module should have some coverage (AuthService, UserService tested)
    const servicesCov = coverage.byModule.Services;
    expect(servicesCov).toBeDefined();
    expect(servicesCov.percentage).toBeGreaterThan(0);
  });

  it("suggestions detect known code smells in fixture", () => {
    const graph = scan(FIXTURE_PATH, registry);
    const suggestions = generateSuggestions(graph);

    expect(suggestions.length).toBeGreaterThan(0);

    // AppState is intentionally a god class
    const godClassSuggestion = suggestions.find(
      (s) => s.title.includes("AppState") && s.category === "god-class",
    );
    expect(godClassSuggestion).toBeDefined();
  });

  it("metrics provides aggregate stats", () => {
    const graph = scan(FIXTURE_PATH, registry);
    const metrics = computeMetrics(graph);

    expect(metrics.totalEntities).toBeGreaterThan(0);
    expect(metrics.totalRelationships).toBeGreaterThan(0);
    expect(metrics.moduleCount).toBeGreaterThan(0);
    expect(metrics.avgFanOut).toBeGreaterThan(0);
  });
});
