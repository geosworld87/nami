import type { NamiGraph } from "../graph/model.js";

export type SuggestionSeverity = "info" | "warning" | "critical";
export type SuggestionCategory =
  | "circular-dependency"
  | "god-class"
  | "low-coverage"
  | "high-coupling"
  | "unused-code"
  | "missing-abstraction";

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  severity: SuggestionSeverity;
  affectedEntities: string[];
  category: SuggestionCategory;
}

export function generateSuggestions(graph: NamiGraph): Suggestion[] {
  const suggestions: Suggestion[] = [];

  suggestions.push(...detectCircularDependencies(graph));
  suggestions.push(...detectGodClasses(graph));
  suggestions.push(...detectHighCoupling(graph));

  return suggestions;
}

// ─── Circular Dependencies (Tarjan's SCC) ───────────────────

function detectCircularDependencies(graph: NamiGraph): Suggestion[] {
  const sccs = findStronglyConnectedComponents(graph);
  return sccs.map((scc, i) => ({
    id: `circular-dep-${i}`,
    title: `Circular dependency: ${scc.map(prettifyId).join(" <-> ")}`,
    description: `These entities form a dependency cycle. Consider breaking the cycle with a protocol or event-based communication.`,
    severity: "critical" as const,
    affectedEntities: scc,
    category: "circular-dependency" as const,
  }));
}

function findStronglyConnectedComponents(graph: NamiGraph): string[][] {
  // Tarjan's algorithm
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const result: string[][] = [];

  // Build adjacency list (only meaningful edge types)
  const adj = new Map<string, string[]>();
  const meaningfulKinds = new Set([
    "imports", "inherits", "conforms_to", "calls",
    "references", "delegates_to", "injects",
  ]);

  for (const edge of graph.edges) {
    if (!meaningfulKinds.has(edge.kind)) continue;
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push(edge.target);
  }

  function strongconnect(v: string): void {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) ?? []) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      // Only report non-trivial SCCs (more than 1 node)
      if (scc.length > 1) result.push(scc);
    }
  }

  // Run on all nodes
  const allNodes = new Set<string>();
  for (const edge of graph.edges) {
    if (meaningfulKinds.has(edge.kind)) {
      allNodes.add(edge.source);
      allNodes.add(edge.target);
    }
  }
  for (const v of allNodes) {
    if (!indices.has(v)) strongconnect(v);
  }

  return result;
}

// ─── God Classes ─────────────────────────────────────────────

function detectGodClasses(graph: NamiGraph): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const METHOD_THRESHOLD = 10;
  const PROPERTY_THRESHOLD = 15;
  const LOC_THRESHOLD = 200;

  for (const node of graph.nodes) {
    if (node.kind !== "class" && node.kind !== "struct") continue;

    const methods = node.metadata.methodCount ?? 0;
    const props = node.metadata.propertyCount ?? 0;
    const loc = node.metadata.linesOfCode;
    const reasons: string[] = [];

    if (methods > METHOD_THRESHOLD) reasons.push(`${methods} methods (>${METHOD_THRESHOLD})`);
    if (props > PROPERTY_THRESHOLD) reasons.push(`${props} properties (>${PROPERTY_THRESHOLD})`);
    if (loc > LOC_THRESHOLD) reasons.push(`${loc} lines (>${LOC_THRESHOLD})`);

    if (reasons.length > 0) {
      suggestions.push({
        id: `god-class-${node.id}`,
        title: `God class: ${node.name}`,
        description: `${node.name} is too large: ${reasons.join(", ")}. Consider splitting into smaller, focused classes.`,
        severity: reasons.length >= 2 ? "warning" : "info",
        affectedEntities: [node.id],
        category: "god-class",
      });
    }
  }

  return suggestions;
}

// ─── High Coupling ───────────────────────────────────────────

function detectHighCoupling(graph: NamiGraph): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const FAN_THRESHOLD = 10;

  // Count incoming (fan-in) and outgoing (fan-out) edges per node
  const fanIn = new Map<string, number>();
  const fanOut = new Map<string, number>();

  for (const edge of graph.edges) {
    if (edge.kind === "declares" || edge.kind === "contains") continue;
    fanIn.set(edge.target, (fanIn.get(edge.target) ?? 0) + 1);
    fanOut.set(edge.source, (fanOut.get(edge.source) ?? 0) + 1);
  }

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const [nodeId, count] of fanIn) {
    if (count >= FAN_THRESHOLD) {
      const node = nodeMap.get(nodeId);
      if (node && node.kind !== "file") {
        suggestions.push({
          id: `high-fan-in-${nodeId}`,
          title: `High fan-in: ${node?.name ?? nodeId}`,
          description: `${count} other entities depend on this. Changes here have wide impact.`,
          severity: "info",
          affectedEntities: [nodeId],
          category: "high-coupling",
        });
      }
    }
  }

  for (const [nodeId, count] of fanOut) {
    if (count >= FAN_THRESHOLD) {
      const node = nodeMap.get(nodeId);
      if (node && node.kind !== "file") {
        suggestions.push({
          id: `high-fan-out-${nodeId}`,
          title: `High fan-out: ${node?.name ?? nodeId}`,
          description: `This entity depends on ${count} others. Consider reducing dependencies.`,
          severity: "info",
          affectedEntities: [nodeId],
          category: "high-coupling",
        });
      }
    }
  }

  return suggestions;
}

// ─── Helpers ─────────────────────────────────────────────────

function prettifyId(id: string): string {
  const parts = id.split("::");
  return parts[parts.length - 1];
}
