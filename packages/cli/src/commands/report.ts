import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import {
  deserialize,
  analyzeCoverage,
  generateSuggestions,
  computeMetrics,
} from "@nami/core";

interface ReportOptions {
  graph: string;
}

export function reportCommand(options: ReportOptions): void {
  const graphPath = resolve(options.graph);
  if (!existsSync(graphPath)) {
    console.error(`Error: Graph file not found: ${graphPath}`);
    console.error(`Run 'nami scan' first to generate the graph.`);
    process.exit(1);
  }

  const graph = deserialize(readFileSync(graphPath, "utf-8"));
  const coverage = analyzeCoverage(graph);
  const suggestions = generateSuggestions(graph);
  const metrics = computeMetrics(graph);

  const repoName = graph.rootPath.split("/").pop() ?? "unknown";

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Nami Report: ${repoName}`);
  console.log(`${"═".repeat(60)}\n`);

  // Overview
  console.log(`Scanned: ${graph.stats.totalFiles} files, ${metrics.totalEntities} entities, ${metrics.totalRelationships} relationships`);
  console.log(`Languages: ${Object.entries(graph.stats.languageBreakdown).map(([l, c]) => `${l} (${c})`).join(", ")}`);
  console.log(`Modules: ${metrics.moduleCount}`);
  console.log();

  // Entity breakdown
  console.log(`Entity Breakdown:`);
  for (const [kind, count] of Object.entries(metrics.entityBreakdown)) {
    console.log(`  ${kind}: ${count}`);
  }
  console.log();

  // Coverage
  console.log(`Test Coverage: ${coverage.coveragePercentage}%`);
  for (const [mod, cov] of Object.entries(coverage.byModule)) {
    const bar = makeBar(cov.percentage);
    console.log(`  ${mod.padEnd(20)} ${bar} ${cov.percentage}% (${cov.covered}/${cov.total})`);
  }
  console.log();

  // Coupling
  if (metrics.maxFanIn) {
    console.log(`Most depended-on: ${metrics.maxFanIn.name} (${metrics.maxFanIn.count} dependents)`);
  }
  if (metrics.maxFanOut) {
    console.log(`Most dependencies: ${metrics.maxFanOut.name} (${metrics.maxFanOut.count} dependencies)`);
  }
  console.log(`Avg fan-in: ${metrics.avgFanIn}, Avg fan-out: ${metrics.avgFanOut}`);
  console.log();

  // Issues
  if (suggestions.length > 0) {
    console.log(`Issues Found:`);
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const sorted = [...suggestions].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );
    for (const s of sorted) {
      const tag = s.severity === "critical" ? "CRITICAL" : s.severity === "warning" ? "WARNING" : "INFO";
      console.log(`  [${tag}] ${s.title}`);
      console.log(`          ${s.description}`);
    }
  } else {
    console.log(`No issues found. Clean architecture!`);
  }

  console.log(`\n${"═".repeat(60)}\n`);
}

function makeBar(percentage: number, width = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}
