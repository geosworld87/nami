const API_BASE = "/api";

export interface GraphNode {
  id: string;
  kind: string;
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: string;
  metadata: Record<string, unknown>;
}

export interface NamiGraph {
  version: string;
  scannedAt: string;
  rootPath: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalFiles: number;
    totalNodes: number;
    totalEdges: number;
    languageBreakdown: Record<string, number>;
    scanDurationMs: number;
  };
}

export interface BlastRadiusResult {
  rootEntity: string;
  affectedNodes: Array<{
    node: GraphNode;
    distance: number;
    path: string[];
    relationship: string;
  }>;
  totalAffected: number;
  maxDepth: number;
}

export type HealthGrade = "healthy" | "warning" | "critical";

export interface EntityHealthScore {
  entityId: string;
  name: string;
  module: string;
  score: number;
  grade: HealthGrade;
  breakdown: {
    coveragePenalty: number;
    complexityPenalty: number;
    couplingPenalty: number;
    issuesPenalty: number;
  };
}

export interface ModuleHealthScore {
  module: string;
  score: number;
  grade: HealthGrade;
  entityCount: number;
}

export interface HealthScoreResult {
  overall: number;
  overallGrade: HealthGrade;
  entities: EntityHealthScore[];
  modules: ModuleHealthScore[];
}

export interface MetricsResponse {
  coverage: {
    coveragePercentage: number;
    coveredFiles: Array<{ source: string; testFiles: string[] }>;
    uncoveredFiles: string[];
    byModule: Record<string, { covered: number; total: number; percentage: number }>;
  };
  suggestions: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    affectedEntities: string[];
    category: string;
  }>;
  metrics: {
    totalEntities: number;
    totalRelationships: number;
    avgFanIn: number;
    avgFanOut: number;
    maxFanIn: { entity: string; name: string; count: number } | null;
    maxFanOut: { entity: string; name: string; count: number } | null;
    moduleCount: number;
    entityBreakdown: Record<string, number>;
    edgeBreakdown: Record<string, number>;
  };
  health?: HealthScoreResult;
}

export interface RepoInfo {
  repoName: string;
  version: string | null;
  branch: string | null;
  lastCommit: { sha: string; date: string; author: string } | null;
  contributors: Array<{ name: string; commits: number }>;
}

export async function fetchRepoInfo(): Promise<RepoInfo> {
  const res = await fetch(`${API_BASE}/repo-info`);
  if (!res.ok) throw new Error("Failed to fetch repo info");
  return res.json();
}

export async function fetchGraph(): Promise<NamiGraph> {
  const res = await fetch(`${API_BASE}/graph`);
  if (!res.ok) throw new Error("Failed to fetch graph");
  return res.json();
}

export async function fetchBlastRadius(entityId: string): Promise<BlastRadiusResult> {
  const res = await fetch(`${API_BASE}/blast/${encodeURIComponent(entityId)}`);
  if (!res.ok) throw new Error("Failed to fetch blast radius");
  return res.json();
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}
