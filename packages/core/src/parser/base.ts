import type { GraphNode, GraphEdge } from "../graph/model.js";

export interface ParseResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface LanguageParser {
  readonly language: string;
  readonly extensions: string[];
  parseFile(filePath: string, content: string, repoRoot: string): ParseResult;
}
