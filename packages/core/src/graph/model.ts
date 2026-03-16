import { z } from "zod";

// ─── Node Types ──────────────────────────────────────────────

export const NodeKind = z.enum([
  "file",
  "class",
  "struct",
  "enum",
  "protocol",
  "extension",
  "function",
  "property",
  "module",
]);
export type NodeKind = z.infer<typeof NodeKind>;

// ─── Edge Types ──────────────────────────────────────────────

export const EdgeKind = z.enum([
  "imports",
  "declares",
  "inherits",
  "conforms_to",
  "calls",
  "references",
  "delegates_to",
  "observes",
  "publishes",
  "subscribes",
  "injects",
  "contains",
  "test_covers",
]);
export type EdgeKind = z.infer<typeof EdgeKind>;

// ─── Graph Node ──────────────────────────────────────────────

export const GraphNodeSchema = z.object({
  id: z.string(),
  kind: NodeKind,
  name: z.string(),
  filePath: z.string(),
  startLine: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
  metadata: z.object({
    linesOfCode: z.number().int().nonnegative(),
    methodCount: z.number().int().nonnegative().optional(),
    propertyCount: z.number().int().nonnegative().optional(),
    isPublic: z.boolean().optional(),
    isTestFile: z.boolean().optional(),
  }).passthrough(),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

// ─── Graph Edge ──────────────────────────────────────────────

export const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  kind: EdgeKind,
  metadata: z.object({
    line: z.number().int().nonnegative().optional(),
  }).passthrough(),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

// ─── NamiGraph ───────────────────────────────────────────────

export const NamiGraphSchema = z.object({
  version: z.literal("1.0.0"),
  scannedAt: z.string().datetime(),
  rootPath: z.string(),
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  stats: z.object({
    totalFiles: z.number().int().nonnegative(),
    totalNodes: z.number().int().nonnegative(),
    totalEdges: z.number().int().nonnegative(),
    languageBreakdown: z.record(z.string(), z.number().int().nonnegative()),
    scanDurationMs: z.number().nonnegative(),
  }),
});
export type NamiGraph = z.infer<typeof NamiGraphSchema>;
