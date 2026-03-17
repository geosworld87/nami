export const SERVER_VERSION = "0.1.0";

import express from "express";
import cors from "cors";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";
import {
  deserialize,
  analyzeBlastRadius,
  analyzeCoverage,
  generateSuggestions,
  computeMetrics,
  computeHealthScore,
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

  // GET /api/metrics — coverage, suggestions, metrics, health
  app.get("/api/metrics", (_req, res) => {
    try {
      const graph = loadGraph();
      const coverage = analyzeCoverage(graph);
      const suggestions = generateSuggestions(graph);
      res.json({
        coverage,
        suggestions,
        metrics: computeMetrics(graph),
        health: computeHealthScore(graph, coverage, suggestions),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to compute metrics" });
    }
  });

  // GET /api/repo-info — git activity & version for the scanned repo
  app.get("/api/repo-info", (_req, res) => {
    try {
      const graph = loadGraph();
      const repoPath = graph.rootPath;
      const gitOpts = { cwd: repoPath, encoding: "utf-8" as const, timeout: 5000 };

      let branch: string | null = null;
      try {
        branch = execSync("git rev-parse --abbrev-ref HEAD", gitOpts).trim();
      } catch { /* not a git repo */ }

      let lastCommit: { sha: string; date: string; author: string } | null = null;
      try {
        const log = execSync("git log -1 --format=%H|%ai|%an", gitOpts).trim();
        const parts = log.split("|");
        if (parts.length >= 3) {
          lastCommit = { sha: parts[0].slice(0, 8), date: parts[1], author: parts.slice(2).join("|") };
        }
      } catch { /* no commits */ }

      let contributors: Array<{ name: string; commits: number }> = [];
      try {
        const shortlog = execSync("git shortlog -sn --no-merges HEAD", gitOpts).trim();
        contributors = shortlog
          .split("\n")
          .filter(Boolean)
          .slice(0, 5)
          .map((line) => {
            const match = line.trim().match(/^(\d+)\s+(.+)$/);
            return match ? { commits: parseInt(match[1], 10), name: match[2] } : null;
          })
          .filter((c): c is { name: string; commits: number } => c !== null);
      } catch { /* no git */ }

      let version: string | null = null;
      // Try package.json
      try {
        const pkg = JSON.parse(readFileSync(join(repoPath, "package.json"), "utf-8"));
        if (pkg.version) version = pkg.version;
      } catch { /* no package.json */ }
      // Try .version file
      if (!version) {
        try {
          version = readFileSync(join(repoPath, ".version"), "utf-8").trim();
        } catch { /* no .version file */ }
      }

      const repoName = repoPath.replace(/\/+$/, "").split("/").pop() ?? "unknown";

      res.json({ repoName, version, branch, lastCommit, contributors });
    } catch (err) {
      res.status(500).json({ error: "Failed to get repo info" });
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
