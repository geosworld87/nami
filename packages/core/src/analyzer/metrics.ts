import type { NamiGraph } from "../graph/model.js";

export interface MetricsResult {
  totalEntities: number;
  totalRelationships: number;
  avgFanIn: number;
  avgFanOut: number;
  maxFanIn: { entity: string; name: string; count: number } | null;
  maxFanOut: { entity: string; name: string; count: number } | null;
  moduleCount: number;
  entityBreakdown: Record<string, number>;
  edgeBreakdown: Record<string, number>;
}

export function computeMetrics(graph: NamiGraph): MetricsResult {
  const fanIn = new Map<string, number>();
  const fanOut = new Map<string, number>();

  for (const edge of graph.edges) {
    if (edge.kind === "declares" || edge.kind === "contains") continue;
    fanIn.set(edge.target, (fanIn.get(edge.target) ?? 0) + 1);
    fanOut.set(edge.source, (fanOut.get(edge.source) ?? 0) + 1);
  }

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // Non-file entities for fan metrics
  const entities = graph.nodes.filter((n) => n.kind !== "file");
  const entityCount = entities.length;

  let maxFanInEntry: MetricsResult["maxFanIn"] = null;
  let maxFanOutEntry: MetricsResult["maxFanOut"] = null;
  let totalFanIn = 0;
  let totalFanOut = 0;

  for (const node of entities) {
    const inCount = fanIn.get(node.id) ?? 0;
    const outCount = fanOut.get(node.id) ?? 0;
    totalFanIn += inCount;
    totalFanOut += outCount;

    if (!maxFanInEntry || inCount > maxFanInEntry.count) {
      maxFanInEntry = { entity: node.id, name: node.name, count: inCount };
    }
    if (!maxFanOutEntry || outCount > maxFanOutEntry.count) {
      maxFanOutEntry = { entity: node.id, name: node.name, count: outCount };
    }
  }

  // Entity breakdown by kind
  const entityBreakdown: Record<string, number> = {};
  for (const node of graph.nodes) {
    entityBreakdown[node.kind] = (entityBreakdown[node.kind] ?? 0) + 1;
  }

  // Edge breakdown by kind
  const edgeBreakdown: Record<string, number> = {};
  for (const edge of graph.edges) {
    edgeBreakdown[edge.kind] = (edgeBreakdown[edge.kind] ?? 0) + 1;
  }

  // Module count (unique first-level directories)
  const modules = new Set<string>();
  for (const node of graph.nodes) {
    if (node.kind === "file") {
      const parts = node.filePath.split("/");
      const start = parts[0] === "Sources" ? 1 : 0;
      if (parts[start]) modules.add(parts[start]);
    }
  }

  return {
    totalEntities: entityCount,
    totalRelationships: graph.edges.length,
    avgFanIn: entityCount > 0 ? Math.round((totalFanIn / entityCount) * 10) / 10 : 0,
    avgFanOut: entityCount > 0 ? Math.round((totalFanOut / entityCount) * 10) / 10 : 0,
    maxFanIn: maxFanInEntry,
    maxFanOut: maxFanOutEntry,
    moduleCount: modules.size,
    entityBreakdown,
    edgeBreakdown,
  };
}
