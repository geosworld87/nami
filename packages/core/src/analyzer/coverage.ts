import type { NamiGraph } from "../graph/model.js";

export interface ModuleCoverage {
  covered: number;
  total: number;
  percentage: number;
}

export interface CoverageResult {
  coveredFiles: Array<{ source: string; testFiles: string[] }>;
  uncoveredFiles: string[];
  coveragePercentage: number;
  byModule: Record<string, ModuleCoverage>;
}

export function analyzeCoverage(graph: NamiGraph): CoverageResult {
  // Separate source and test files
  const sourceFiles: string[] = [];
  const testFiles: string[] = [];

  for (const node of graph.nodes) {
    if (node.kind !== "file") continue;
    if (isTestFile(node.filePath)) {
      testFiles.push(node.filePath);
    } else {
      sourceFiles.push(node.filePath);
    }
  }

  // Map test files to source files using naming conventions
  const coverageMap = new Map<string, string[]>();

  for (const testFile of testFiles) {
    const baseName = extractBaseName(testFile);
    for (const sourceFile of sourceFiles) {
      if (matchesSource(baseName, sourceFile)) {
        if (!coverageMap.has(sourceFile)) coverageMap.set(sourceFile, []);
        coverageMap.get(sourceFile)!.push(testFile);
      }
    }
  }

  // Build results
  const coveredFiles: CoverageResult["coveredFiles"] = [];
  const uncoveredFiles: string[] = [];

  for (const source of sourceFiles) {
    const tests = coverageMap.get(source);
    if (tests && tests.length > 0) {
      coveredFiles.push({ source, testFiles: tests });
    } else {
      uncoveredFiles.push(source);
    }
  }

  // By module (first directory in path)
  const byModule: Record<string, ModuleCoverage> = {};
  for (const source of sourceFiles) {
    const module = getModule(source);
    if (!byModule[module]) byModule[module] = { covered: 0, total: 0, percentage: 0 };
    byModule[module].total++;
    if (coverageMap.has(source)) byModule[module].covered++;
  }
  for (const mod of Object.values(byModule)) {
    mod.percentage = mod.total > 0 ? Math.round((mod.covered / mod.total) * 100) : 0;
  }

  const totalSource = sourceFiles.length;
  const totalCovered = coveredFiles.length;

  return {
    coveredFiles,
    uncoveredFiles,
    coveragePercentage: totalSource > 0 ? Math.round((totalCovered / totalSource) * 100) : 0,
    byModule,
  };
}

function isTestFile(filePath: string): boolean {
  const name = filePath.split("/").pop() ?? "";
  return (
    name.includes("Test") ||
    name.includes("Spec") ||
    filePath.includes("Tests/") ||
    filePath.includes("__tests__/") ||
    filePath.includes("test/")
  );
}

function extractBaseName(testFile: string): string {
  const fileName = testFile.split("/").pop() ?? "";
  return fileName
    .replace(/Tests?\.\w+$/, "")
    .replace(/Spec\.\w+$/, "")
    .replace(/\.\w+$/, "");
}

function matchesSource(testBaseName: string, sourceFile: string): boolean {
  const sourceFileName = sourceFile.split("/").pop() ?? "";
  const sourceBaseName = sourceFileName.replace(/\.\w+$/, "");
  return sourceBaseName === testBaseName;
}

function getModule(filePath: string): string {
  const parts = filePath.split("/");
  // Skip "Sources/" prefix if present
  const start = parts[0] === "Sources" ? 1 : 0;
  return parts[start] ?? "root";
}
