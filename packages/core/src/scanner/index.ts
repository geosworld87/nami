import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { GraphBuilder } from "../graph/builder.js";
import type { NamiGraph } from "../graph/model.js";
import type { ParserRegistry } from "../parser/registry.js";
import { FileFilter } from "./file-filter.js";

export interface ScanOptions {
  onFile?: (filePath: string) => void;
}

export function scan(
  repoRoot: string,
  registry: ParserRegistry,
  options: ScanOptions = {},
): NamiGraph {
  const builder = new GraphBuilder(repoRoot);
  const filter = new FileFilter(repoRoot);

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relative(repoRoot, fullPath);

      if (filter.shouldIgnore(relPath)) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const parser = registry.getParser(entry.name);
        if (!parser) continue;

        options.onFile?.(relPath);
        builder.trackFile(parser.language);

        const content = readFileSync(fullPath, "utf-8");
        const result = parser.parseFile(relPath, content, repoRoot);

        for (const node of result.nodes) {
          builder.addNode(node);
        }
        for (const edge of result.edges) {
          builder.addEdge(edge.source, edge.target, edge.kind, edge.metadata);
        }
      }
    }
  }

  walk(repoRoot);
  return builder.build();
}
