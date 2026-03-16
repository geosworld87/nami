export const SERVER_VERSION = "0.1.0";

import express from "express";
import cors from "cors";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  deserialize,
  analyzeBlastRadius,
  analyzeCoverage,
  generateSuggestions,
  computeMetrics,
} from "@nami/core";
import type { NamiGraph } from "@nami/core";

export interface ServerOptions {
  graphPath: string;
  port: number;
  staticDir?: string;
}

export function createServer(options: ServerOptions) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Serve static web UI if available
  if (options.staticDir && existsSync(options.staticDir)) {
    app.use(express.static(options.staticDir));
  }

  function loadGraph(): NamiGraph {
    const content = readFileSync(resolve(options.graphPath), "utf-8");
    return deserialize(content);
  }

  // GET /api/graph — full graph data
  app.get("/api/graph", (_req, res) => {
    try {
      const graph = loadGraph();
      res.json(graph);
    } catch (err) {
      res.status(500).json({ error: "Failed to load graph" });
    }
  });

  // GET /api/blast/:entityId — blast radius for an entity
  app.get("/api/blast/:entityId", (req, res) => {
    try {
      const graph = loadGraph();
      const entityId = decodeURIComponent(req.params.entityId);
      const maxDepth = req.query.maxDepth ? parseInt(req.query.maxDepth as string, 10) : undefined;

      // Find by ID or name
      const node = graph.nodes.find(
        (n) => n.id === entityId || n.name === entityId,
      );
      if (!node) {
        res.status(404).json({ error: `Entity '${entityId}' not found` });
        return;
      }

      const result = analyzeBlastRadius(graph, node.id, { maxDepth });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to analyze blast radius" });
    }
  });

  // GET /api/metrics — coverage, suggestions, metrics
  app.get("/api/metrics", (_req, res) => {
    try {
      const graph = loadGraph();
      res.json({
        coverage: analyzeCoverage(graph),
        suggestions: generateSuggestions(graph),
        metrics: computeMetrics(graph),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to compute metrics" });
    }
  });

  // Fallback to index.html for SPA routing
  if (options.staticDir && existsSync(options.staticDir)) {
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(resolve(options.staticDir!, "index.html"));
    });
  }

  return app;
}

export function startServer(options: ServerOptions): void {
  const app = createServer(options);
  app.listen(options.port, () => {
    console.log(`Nami server running at http://localhost:${options.port}`);
    console.log(`  Graph: ${resolve(options.graphPath)}`);
    console.log(`  API: http://localhost:${options.port}/api/graph`);
  });
}
