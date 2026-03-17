import { useState, useCallback, useMemo } from "react";
import { useGraph } from "./hooks/useGraph.js";
import { BubbleView } from "./components/BubbleView.js";
import { DetailPanel } from "./components/DetailPanel.js";
import { FilterPanel } from "./components/FilterPanel.js";
import { MetricsPanel } from "./components/MetricsPanel.js";
import type { PackedBubble, SizeMetric } from "./types/bubble.js";
import type { ColorMode } from "./components/FilterPanel.js";

const ALL_NODE_KINDS = new Set(["class", "struct", "enum", "protocol", "extension", "function"]);

export function App() {
  const { graph, metrics, repoInfo, loading, error } = useGraph();
  const [selectedBubble, setSelectedBubble] = useState<PackedBubble | null>(null);
  const [visibleKinds, setVisibleKinds] = useState(ALL_NODE_KINDS);
  const [sizeMetric, setSizeMetric] = useState<SizeMetric>("loc");
  const [searchQuery, setSearchQuery] = useState("");
  const [metricsVisible, setMetricsVisible] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("kind");

  // Build health score lookup map: bubbleId → score
  const healthScores = useMemo(() => {
    const map = new Map<string, number>();
    if (!metrics?.health) return map;
    for (const e of metrics.health.entities) {
      map.set(e.entityId, e.score);
    }
    for (const m of metrics.health.modules) {
      map.set(m.module, m.score);
    }
    return map;
  }, [metrics]);

  const handleBubbleSelect = useCallback((bubble: PackedBubble | null) => {
    setSelectedBubble(bubble);
  }, []);

  const toggleKind = useCallback((kind: string) => {
    setVisibleKinds((prev) => {
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
        fontFamily: "'Inter', system-ui, sans-serif",
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
        fontFamily: "'Inter', system-ui, sans-serif",
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
      <BubbleView
        graph={graph}
        visibleKinds={visibleKinds}
        sizeMetric={sizeMetric}
        onBubbleSelect={handleBubbleSelect}
        searchQuery={searchQuery}
        colorMode={colorMode}
        healthScores={healthScores}
      />

      <FilterPanel
        visibleKinds={visibleKinds}
        onToggleKind={toggleKind}
        sizeMetric={sizeMetric}
        onSizeMetricChange={setSizeMetric}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
      />

      <DetailPanel
        bubble={selectedBubble}
        graph={graph}
        metrics={metrics ?? undefined}
        repoInfo={repoInfo}
        onDeselect={() => handleBubbleSelect(null)}
      />

      {metrics && (
        <MetricsPanel
          metrics={metrics}
          visible={metricsVisible}
          onToggle={() => setMetricsVisible((v) => !v)}
        />
      )}

      {/* Status bar */}
      <div
        className="nami-glass"
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#fff",
          padding: "6px 20px",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 12,
          zIndex: 10,
        }}
      >
        <strong>Nami</strong>
        <span style={{ color: "#888", marginLeft: 8 }}>
          {graph.stats.totalNodes} entities | {graph.stats.totalEdges} relationships |{" "}
          {Object.entries(graph.stats.languageBreakdown).map(([l, c]) => `${l}: ${c}`).join(", ")}
        </span>
      </div>
    </div>
  );
}
