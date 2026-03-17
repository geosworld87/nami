import { useState, useEffect } from "react";
import { fetchGraph, fetchMetrics, fetchRepoInfo } from "../api/client.js";
import type { NamiGraph, MetricsResponse, RepoInfo } from "../api/client.js";

export function useGraph() {
  const [graph, setGraph] = useState<NamiGraph | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchGraph(), fetchMetrics()])
      .then(([g, m]) => {
        setGraph(g);
        setMetrics(m);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Repo info is non-critical — fetch separately so it doesn't block the app
    fetchRepoInfo()
      .then(setRepoInfo)
      .catch(() => { /* server may not support this endpoint yet */ });
  }, []);

  return { graph, metrics, repoInfo, loading, error };
}
