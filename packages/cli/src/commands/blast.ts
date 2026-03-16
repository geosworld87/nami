import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { deserialize, analyzeBlastRadius } from "@nami/core";

interface BlastOptions {
  graph: string;
  depth?: string;
}

export function blastCommand(entity: string, options: BlastOptions): void {
  const graphPath = resolve(options.graph);
  if (!existsSync(graphPath)) {
    console.error(`Error: Graph file not found: ${graphPath}`);
    console.error(`Run 'nami scan' first to generate the graph.`);
    process.exit(1);
  }

  const graph = deserialize(readFileSync(graphPath, "utf-8"));
  const maxDepth = options.depth ? parseInt(options.depth, 10) : undefined;

  // Find entity by name or ID
  const node = graph.nodes.find(
    (n) => n.id === entity || n.name === entity,
  );
  if (!node) {
    console.error(`Error: Entity '${entity}' not found in graph.`);
    console.error(`Available entities:`);
    for (const n of graph.nodes.filter((n) => n.kind !== "file").slice(0, 20)) {
      console.error(`  - ${n.name} (${n.kind})`);
    }
    process.exit(1);
  }

  const result = analyzeBlastRadius(graph, node.id, { maxDepth });

  console.log(`\nBlast Radius: ${node.name} (${node.kind})`);
  console.log(`${"─".repeat(50)}`);
  console.log(`Total affected: ${result.totalAffected} entities`);
  console.log(`Max depth: ${result.maxDepth} hops\n`);

  if (result.affectedNodes.length === 0) {
    console.log("No other entities depend on this one.");
    return;
  }

  // Group by distance
  const byDistance = new Map<number, typeof result.affectedNodes>();
  for (const affected of result.affectedNodes) {
    if (!byDistance.has(affected.distance)) byDistance.set(affected.distance, []);
    byDistance.get(affected.distance)!.push(affected);
  }

  for (const [distance, nodes] of byDistance) {
    const label = distance === 1 ? "Direct impact" : `${distance} hops away`;
    console.log(`  ${label}:`);
    for (const affected of nodes) {
      console.log(`    - ${affected.node.name} (${affected.node.kind}) via ${affected.relationship}`);
    }
  }
}
