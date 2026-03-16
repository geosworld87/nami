import { useState, useEffect } from "react";
import { fetchGraph, fetchMetrics } from "../api/client.js";
import type { NamiGraph, MetricsResponse } from "../api/client.js";

export function useGraph() {
  const [graph, setGraph] = useState<NamiGraph | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
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
  }, []);

  return { graph, metrics, loading, error };
}
