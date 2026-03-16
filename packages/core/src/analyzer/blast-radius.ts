import type { NamiGraph, GraphNode, EdgeKind } from "../graph/model.js";

export interface AffectedNode {
  node: GraphNode;
  distance: number;
  path: string[];
  relationship: EdgeKind;
}

export interface BlastRadiusResult {
  rootEntity: string;
  affectedNodes: AffectedNode[];
  totalAffected: number;
  maxDepth: number;
}

export interface BlastRadiusOptions {
  maxDepth?: number;
  edgeKinds?: EdgeKind[];
}

export function analyzeBlastRadius(
  graph: NamiGraph,
  entityId: string,
  options: BlastRadiusOptions = {},
): BlastRadiusResult {
  const { maxDepth = Infinity, edgeKinds } = options;
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // Build name-to-IDs mapping so we can resolve short names (e.g., "NetworkManager")
  // to full node IDs (e.g., "Sources/Services/NetworkManager.swift::NetworkManager")
  const nameToIds = new Map<string, string[]>();
  for (const node of graph.nodes) {
    if (!nameToIds.has(node.name)) nameToIds.set(node.name, []);
    nameToIds.get(node.name)!.push(node.id);
  }

  // Resolve an edge endpoint to known node IDs
  function resolveId(id: string): string[] {
    if (nodeMap.has(id)) return [id];
    return nameToIds.get(id) ?? [];
  }

  // Build adjacency list: who depends on each node (incoming edges)
  // Also resolve short names to full IDs
  const dependents = new Map<string, Array<{ source: string; kind: EdgeKind }>>();

  for (const edge of graph.edges) {
    if (edgeKinds && !edgeKinds.includes(edge.kind)) continue;
    const targetIds = resolveId(edge.target);
    const sourceIds = resolveId(edge.source);

    for (const targetId of targetIds) {
      if (!dependents.has(targetId)) dependents.set(targetId, []);
      for (const sourceId of sourceIds) {
        dependents.get(targetId)!.push({ source: sourceId, kind: edge.kind });
      }
    }
  }

  // BFS from the root entity
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; distance: number; path: string[] }> = [];
  const affected: AffectedNode[] = [];

  visited.add(entityId);
  queue.push({ nodeId: entityId, distance: 0, path: [entityId] });

  while (queue.length > 0) {
    const { nodeId, distance, path } = queue.shift()!;
    if (distance >= maxDepth) continue;

    const deps = dependents.get(nodeId) ?? [];
    for (const dep of deps) {
      if (visited.has(dep.source)) continue;
      visited.add(dep.source);

      const newPath = [...path, dep.source];
      const node = nodeMap.get(dep.source);
      if (node) {
        affected.push({
          node,
          distance: distance + 1,
          path: newPath,
          relationship: dep.kind,
        });
      }
      queue.push({ nodeId: dep.source, distance: distance + 1, path: newPath });
    }
  }

  // Sort by distance
  affected.sort((a, b) => a.distance - b.distance);

  return {
    rootEntity: entityId,
    affectedNodes: affected,
    totalAffected: affected.length,
    maxDepth: affected.length > 0 ? affected[affected.length - 1].distance : 0,
  };
}
