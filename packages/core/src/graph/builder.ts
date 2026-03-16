import type { GraphNode, GraphEdge, NamiGraph, EdgeKind } from "./model.js";

export class GraphBuilder {
  private nodes = new Map<string, GraphNode>();
  private edges: GraphEdge[] = [];
  private edgeIds = new Set<string>();
  private rootPath: string;
  private startTime: number;
  private fileCount = 0;
  private languageBreakdown = new Map<string, number>();

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.startTime = Date.now();
  }

  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) return;
    this.nodes.set(node.id, node);
  }

  addEdge(source: string, target: string, kind: EdgeKind, metadata: GraphEdge["metadata"] = {}): void {
    const id = `${source}--${kind}-->${target}`;
    if (this.edgeIds.has(id)) return;
    this.edgeIds.add(id);
    this.edges.push({ id, source, target, kind, metadata });
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  trackFile(language: string): void {
    this.fileCount++;
    this.languageBreakdown.set(
      language,
      (this.languageBreakdown.get(language) ?? 0) + 1,
    );
  }

  build(): NamiGraph {
    return {
      version: "1.0.0",
      scannedAt: new Date().toISOString(),
      rootPath: this.rootPath,
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      stats: {
        totalFiles: this.fileCount,
        totalNodes: this.nodes.size,
        totalEdges: this.edges.length,
        languageBreakdown: Object.fromEntries(this.languageBreakdown),
        scanDurationMs: Date.now() - this.startTime,
      },
    };
  }
}
