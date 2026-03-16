import { useState, useCallback } from "react";
import { useGraph } from "./hooks/useGraph.js";
import { GraphView } from "./components/GraphView.js";
import { NodeDetail } from "./components/NodeDetail.js";
import { FilterPanel } from "./components/FilterPanel.js";
import { MetricsPanel } from "./components/MetricsPanel.js";
import type { GraphNode, BlastRadiusResult } from "./api/client.js";

const ALL_NODE_KINDS = new Set(["class", "struct", "enum", "protocol", "extension", "function"]);
const ALL_EDGE_KINDS = new Set([
  "inherits", "conforms_to", "calls", "references", "imports",
  "delegates_to", "observes", "publishes", "subscribes", "injects",
]);

export function App() {
  const { graph, metrics, loading, error } = useGraph();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [visibleKinds, setVisibleKinds] = useState(ALL_NODE_KINDS);
  const [visibleEdgeKinds, setVisibleEdgeKinds] = useState(ALL_EDGE_KINDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string> | undefined>();
  const [metricsVisible, setMetricsVisible] = useState(false);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
    if (!node) {
      setHighlightedNodes(undefined);
    }
  }, []);

  const handleBlastRadius = useCallback((result: BlastRadiusResult) => {
    const ids = new Set<string>();
    ids.add(result.rootEntity);
    for (const affected of result.affectedNodes) {
      ids.add(affected.node.id);
    }
    setHighlightedNodes(ids);
  }, []);

  const toggleKind = useCallback((kind: string) => {
    setVisibleKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  const toggleEdgeKind = useCallback((kind: string) => {
    setVisibleEdgeKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#1a1a2e",
        color: "#e0e0e0",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Nami</h1>
          <p>Loading architecture graph...</p>
        </div>
      </div>
    );
  }

  if (error || !graph) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#1a1a2e",
        color: "#FF6B6B",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Nami</h1>
          <p>Failed to load graph: {error}</p>
          <p style={{ color: "#888" }}>Make sure the server is running with `nami serve`</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <GraphView
        graph={graph}
        onNodeSelect={handleNodeSelect}
        highlightedNodes={highlightedNodes}
        visibleKinds={visibleKinds}
        visibleEdgeKinds={visibleEdgeKinds}
        searchQuery={searchQuery}
      />

      <FilterPanel
        visibleKinds={visibleKinds}
        visibleEdgeKinds={visibleEdgeKinds}
        onToggleKind={toggleKind}
        onToggleEdgeKind={toggleEdgeKind}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {selectedNode && (
        <NodeDetail
          node={selectedNode}
          graph={graph}
          onBlastRadius={handleBlastRadius}
          onClose={() => handleNodeSelect(null)}
        />
      )}

      {metrics && (
        <MetricsPanel
          metrics={metrics}
          visible={metricsVisible}
          onToggle={() => setMetricsVisible((v) => !v)}
        />
      )}

      {/* Header */}
      <div style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#16213e",
        color: "#fff",
        padding: "6px 20px",
        borderRadius: 8,
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}>
        <strong>Nami</strong>
        <span style={{ color: "#888", marginLeft: 8 }}>
          {graph.stats.totalNodes} entities | {graph.stats.totalEdges} relationships |{" "}
          {Object.entries(graph.stats.languageBreakdown).map(([l, c]) => `${l}: ${c}`).join(", ")}
        </span>
      </div>
    </div>
  );
}
