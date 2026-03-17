import type { GraphNode } from "../api/client.js";
import type { HierarchyDatum, SizeMetric } from "../types/bubble.js";
import { computeSize } from "./bubble-sizing.js";

/**
 * Build a hierarchical tree from a flat list of graph nodes.
 *
 * Structure:
 *   Root
 *   ├── Module (directory)
 *   │   ├── File
 *   │   │   ├── Entity (class, struct, enum, ...)
 *   │   │   └── Entity
 *   │   └── File
 *   └── Module
 *
 * Files are grouped by their directory path.
 * Entities (non-file nodes) are attached to their parent file via filePath match.
 */
export function buildHierarchy(
  nodes: GraphNode[],
  visibleKinds: Set<string>,
  sizeMetric: SizeMetric = "loc",
  repoName: string = "Root",
): HierarchyDatum {
  const fileNodes = nodes.filter((n) => n.kind === "file");
  const entityNodes = nodes.filter(
    (n) => n.kind !== "file" && n.kind !== "module" && visibleKinds.has(n.kind),
  );

  // Group files by directory
  const moduleMap = new Map<string, GraphNode[]>();
  for (const file of fileNodes) {
    const parts = file.filePath.split("/");
    const dir = parts.slice(0, -1).join("/") || "(root)";
    let list = moduleMap.get(dir);
    if (!list) {
      list = [];
      moduleMap.set(dir, list);
    }
    list.push(file);
  }

  // Group entities by filePath
  const entitiesByFile = new Map<string, GraphNode[]>();
  for (const entity of entityNodes) {
    let list = entitiesByFile.get(entity.filePath);
    if (!list) {
      list = [];
      entitiesByFile.set(entity.filePath, list);
    }
    list.push(entity);
  }

  // Build tree
  const moduleChildren: HierarchyDatum[] = [];

  for (const [dir, files] of moduleMap) {
    const fileChildren: HierarchyDatum[] = [];

    for (const file of files) {
      const entities = entitiesByFile.get(file.filePath) ?? [];

      if (entities.length === 0) {
        // File with no entities — show as leaf
        fileChildren.push({
          id: file.id,
          name: file.name,
          kind: "file",
          filePath: file.filePath,
          value: computeSize(file.metadata, sizeMetric),
          metadata: file.metadata,
        });
      } else {
        // File with entities — entities are children
        const entityChildren: HierarchyDatum[] = entities.map((e) => ({
          id: e.id,
          name: e.name,
          kind: "entity" as const,
          nodeKind: e.kind,
          filePath: e.filePath,
          value: computeSize(e.metadata, sizeMetric),
          metadata: e.metadata,
        }));

        fileChildren.push({
          id: file.id,
          name: file.name,
          kind: "file",
          filePath: file.filePath,
          value: 0, // sum propagated by d3
          children: entityChildren,
          metadata: file.metadata,
        });
      }
    }

    // Extract short module name from path
    const dirParts = dir.split("/");
    const moduleName = dirParts[dirParts.length - 1] || dir;

    moduleChildren.push({
      id: `module::${dir}`,
      name: moduleName,
      kind: "module",
      value: 0, // sum propagated by d3
      children: fileChildren,
    });
  }

  return {
    id: "root",
    name: "Root",
    kind: "root",
    value: 0,
    children: [
      {
        id: "repo",
        name: repoName,
        kind: "module",
        value: 0,
        children: moduleChildren,
      },
    ],
  };
}
