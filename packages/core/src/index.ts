export const VERSION = "0.1.0";

// Graph model
export {
  NodeKind,
  EdgeKind,
  GraphNodeSchema,
  GraphEdgeSchema,
  NamiGraphSchema,
} from "./graph/model.js";
export type { GraphNode, GraphEdge, NamiGraph } from "./graph/model.js";

// Graph builder
export { GraphBuilder } from "./graph/builder.js";

// Serialization
export { serialize, deserialize } from "./graph/serializer.js";

// Parser
export type { LanguageParser, ParseResult } from "./parser/base.js";
export { ParserRegistry } from "./parser/registry.js";
export { SwiftParser } from "./parser/swift/index.js";

// Scanner
export { scan } from "./scanner/index.js";
export type { ScanOptions } from "./scanner/index.js";

// Analyzers
export { analyzeBlastRadius } from "./analyzer/blast-radius.js";
export type { BlastRadiusResult, BlastRadiusOptions, AffectedNode } from "./analyzer/blast-radius.js";
export { analyzeCoverage } from "./analyzer/coverage.js";
export type { CoverageResult, ModuleCoverage } from "./analyzer/coverage.js";
export { generateSuggestions } from "./analyzer/suggestions.js";
export type { Suggestion, SuggestionSeverity, SuggestionCategory } from "./analyzer/suggestions.js";
export { computeMetrics } from "./analyzer/metrics.js";
export type { MetricsResult } from "./analyzer/metrics.js";
