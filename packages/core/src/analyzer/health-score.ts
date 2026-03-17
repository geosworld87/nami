import type { NamiGraph } from "../graph/model.js";
import type { CoverageResult } from "./coverage.js";
import type { Suggestion } from "./suggestions.js";

export type HealthGrade = "healthy" | "warning" | "critical";

export interface EntityHealthScore {
  entityId: string;
  name: string;
  module: string;
  score: number;
  grade: HealthGrade;
  breakdown: {
    coveragePenalty: number;
    complexityPenalty: number;
    couplingPenalty: number;
    issuesPenalty: number;
  };
}

export interface ModuleHealthScore {
  module: string;
  score: number;
  grade: HealthGrade;
  entityCount: number;
}

export interface HealthScoreResult {
  overall: number;
  overallGrade: HealthGrade;
  entities: EntityHealthScore[];
  modules: ModuleHealthScore[];
}

function gradeFromScore(score: number): HealthGrade {
  if (score > 70) return "healthy";
  if (score >= 40) return "warning";
  return "critical";
}

function getModule(filePath: string): string {
  const parts = filePath.split("/");
  const start = parts[0] === "Sources" ? 1 : 0;
  return parts[start] ?? "root";
}

export function computeHealthScore(
  graph: NamiGraph,
  coverage: CoverageResult,
  suggestions: Suggestion[],
): HealthScoreResult {
  // Build a set of covered source files
  const coveredSources = new Set(coverage.coveredFiles.map((c) => c.source));

  // Build fan-in / fan-out maps (excluding structural edges)
  const fanIn = new Map<string, number>();
  const fanOut = new Map<string, number>();
  for (const edge of graph.edges) {
    if (edge.kind === "declares" || edge.kind === "contains") continue;
    fanIn.set(edge.target, (fanIn.get(edge.target) ?? 0) + 1);
    fanOut.set(edge.source, (fanOut.get(edge.source) ?? 0) + 1);
  }

  // Build entity → suggestions map
  const entitySuggestions = new Map<string, Suggestion[]>();
  for (const s of suggestions) {
    for (const entityId of s.affectedEntities) {
      if (!entitySuggestions.has(entityId)) entitySuggestions.set(entityId, []);
      entitySuggestions.get(entityId)!.push(s);
    }
  }

  // Compute per-entity health scores (only non-file, non-module entities)
  const entities: EntityHealthScore[] = [];

  for (const node of graph.nodes) {
    if (node.kind === "file" || node.kind === "module") continue;

    const module = getModule(node.filePath);

    // --- Coverage penalty ---
    // Check if the file containing this entity is covered
    const isCovered = coveredSources.has(node.filePath);
    const coveragePenalty = isCovered ? 0 : 100;

    // --- Complexity penalty ---
    const loc = node.metadata.linesOfCode ?? 0;
    const methods = (node.metadata.methodCount as number) ?? 0;
    const props = (node.metadata.propertyCount as number) ?? 0;

    const locPenalty = Math.min(50, Math.max(0, ((loc - 200) / 200) * 50));
    const methodPenalty = Math.min(30, Math.max(0, ((methods - 10) / 10) * 30));
    const propPenalty = Math.min(20, Math.max(0, ((props - 15) / 15) * 20));
    const complexityPenalty = Math.min(100, locPenalty + methodPenalty + propPenalty);

    // --- Coupling penalty ---
    const inCount = fanIn.get(node.id) ?? 0;
    const outCount = fanOut.get(node.id) ?? 0;
    const fanInPenalty = Math.min(50, Math.max(0, ((inCount - 10) / 10) * 50));
    const fanOutPenalty = Math.min(50, Math.max(0, ((outCount - 10) / 10) * 50));
    const couplingPenalty = Math.min(100, fanInPenalty + fanOutPenalty);

    // --- Issues penalty ---
    const nodeSuggestions = entitySuggestions.get(node.id) ?? [];
    let issuesPenalty = 0;
    for (const s of nodeSuggestions) {
      if (s.severity === "critical") issuesPenalty += 40;
      else if (s.severity === "warning") issuesPenalty += 25;
      else issuesPenalty += 10;
    }
    issuesPenalty = Math.min(100, issuesPenalty);

    // --- Composite score ---
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            (coveragePenalty * 0.3 +
              complexityPenalty * 0.3 +
              couplingPenalty * 0.2 +
              issuesPenalty * 0.2),
        ),
      ),
    );

    entities.push({
      entityId: node.id,
      name: node.name,
      module,
      score,
      grade: gradeFromScore(score),
      breakdown: {
        coveragePenalty: Math.round(coveragePenalty),
        complexityPenalty: Math.round(complexityPenalty),
        couplingPenalty: Math.round(couplingPenalty),
        issuesPenalty: Math.round(issuesPenalty),
      },
    });
  }

  // --- Module scores ---
  const moduleMap = new Map<string, { total: number; count: number }>();
  for (const e of entities) {
    const entry = moduleMap.get(e.module) ?? { total: 0, count: 0 };
    entry.total += e.score;
    entry.count++;
    moduleMap.set(e.module, entry);
  }

  const modules: ModuleHealthScore[] = [];
  for (const [mod, { total, count }] of moduleMap) {
    const score = count > 0 ? Math.round(total / count) : 100;
    modules.push({ module: mod, score, grade: gradeFromScore(score), entityCount: count });
  }
  modules.sort((a, b) => a.score - b.score);

  // --- Overall score ---
  const overall =
    modules.length > 0
      ? Math.round(modules.reduce((sum, m) => sum + m.score, 0) / modules.length)
      : 100;

  return {
    overall,
    overallGrade: gradeFromScore(overall),
    entities,
    modules,
  };
}
