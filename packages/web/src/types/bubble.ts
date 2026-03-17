export interface HierarchyDatum {
  id: string;
  name: string;
  kind: "root" | "module" | "file" | "entity";
  /** Original node kind from the graph (class, struct, enum, etc.) */
  nodeKind?: string;
  filePath?: string;
  value: number;
  children?: HierarchyDatum[];
  /** Original graph node metadata */
  metadata?: Record<string, unknown>;
}

export interface PackedBubble {
  id: string;
  name: string;
  kind: "root" | "module" | "file" | "entity";
  nodeKind?: string;
  filePath?: string;
  x: number;
  y: number;
  r: number;
  depth: number;
  value: number;
  hasChildren: boolean;
  metadata?: Record<string, unknown>;
}

export type ZoomLevel = 0 | 1 | 2 | 3;

export interface ZoomState {
  level: ZoomLevel;
  focusNode: HierarchyDatum | null;
  breadcrumb: HierarchyDatum[];
}

export type SizeMetric = "loc" | "methods";
