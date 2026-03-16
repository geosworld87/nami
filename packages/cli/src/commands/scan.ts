import { resolve } from "node:path";
import { writeFileSync, existsSync } from "node:fs";
import {
  scan,
  serialize,
  ParserRegistry,
  SwiftParser,
} from "@nami/core";

interface ScanOptions {
  output: string;
  verbose?: boolean;
}

export function scanCommand(path: string, options: ScanOptions): void {
  const repoPath = resolve(path);

  if (!existsSync(repoPath)) {
    console.error(`Error: Path does not exist: ${repoPath}`);
    process.exit(1);
  }

  console.log(`Scanning ${repoPath}...`);

  // Set up parser registry
  const registry = new ParserRegistry();
  registry.register(new SwiftParser());

  let fileCount = 0;
  const graph = scan(repoPath, registry, {
    onFile: (filePath) => {
      fileCount++;
      if (options.verbose) {
        console.log(`  [${fileCount}] ${filePath}`);
      }
    },
  });

  // Write output
  const outputPath = resolve(options.output);
  writeFileSync(outputPath, serialize(graph));

  console.log(`\nScan complete!`);
  console.log(`  Files scanned: ${graph.stats.totalFiles}`);
  console.log(`  Entities found: ${graph.stats.totalNodes}`);
  console.log(`  Relationships: ${graph.stats.totalEdges}`);
  console.log(`  Languages: ${Object.entries(graph.stats.languageBreakdown).map(([l, c]) => `${l} (${c})`).join(", ")}`);
  console.log(`  Duration: ${graph.stats.scanDurationMs}ms`);
  console.log(`  Output: ${outputPath}`);
}
