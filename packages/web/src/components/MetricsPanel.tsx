import type { MetricsResponse } from "../api/client.js";

interface MetricsPanelProps {
  metrics: MetricsResponse;
  visible: boolean;
  onToggle: () => void;
}

export function MetricsPanel({ metrics, visible, onToggle }: MetricsPanelProps) {
  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          background: "#16213e",
          color: "#e0e0e0",
          border: "1px solid #333",
          borderRadius: 8,
          padding: "8px 16px",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        {visible ? "Hide Metrics" : "Show Metrics"}
      </button>

      {visible && (
        <div style={{
          position: "absolute",
          right: 12,
          bottom: 52,
          width: 340,
          maxHeight: "60vh",
          overflowY: "auto",
          background: "#16213e",
          color: "#e0e0e0",
          padding: 16,
          borderRadius: 8,
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#fff" }}>
            Test Coverage: {metrics.coverage.coveragePercentage}%
          </h3>

          {Object.entries(metrics.coverage.byModule).map(([mod, cov]) => (
            <div key={mod} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>{mod}</span>
                <span style={{ color: cov.percentage > 50 ? "#50C878" : cov.percentage > 0 ? "#FFB347" : "#FF6B6B" }}>
                  {cov.percentage}%
                </span>
              </div>
              <div style={{ height: 4, background: "#333", borderRadius: 2 }}>
                <div style={{
                  height: "100%",
                  width: `${cov.percentage}%`,
                  background: cov.percentage > 50 ? "#50C878" : cov.percentage > 0 ? "#FFB347" : "#FF6B6B",
                  borderRadius: 2,
                }} />
              </div>
            </div>
          ))}

          {metrics.suggestions.length > 0 && (
            <>
              <h3 style={{ margin: "16px 0 8px 0", fontSize: 14, color: "#fff" }}>
                Issues ({metrics.suggestions.length})
              </h3>
              {metrics.suggestions.map((s) => (
                <div key={s.id} style={{
                  marginBottom: 8,
                  padding: 8,
                  background: "#0f3460",
                  borderRadius: 4,
                  borderLeft: `3px solid ${s.severity === "critical" ? "#FF4444" : s.severity === "warning" ? "#FFB347" : "#4A90D9"}`,
                }}>
                  <div style={{ fontWeight: "bold", marginBottom: 2 }}>
                    <SeverityBadge severity={s.severity} /> {s.title}
                  </div>
                  <div style={{ color: "#888", fontSize: 11 }}>{s.description}</div>
                </div>
              ))}
            </>
          )}

          <h3 style={{ margin: "16px 0 8px 0", fontSize: 14, color: "#fff" }}>Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <MiniStat label="Entities" value={metrics.metrics.totalEntities} />
            <MiniStat label="Relationships" value={metrics.metrics.totalRelationships} />
            <MiniStat label="Modules" value={metrics.metrics.moduleCount} />
            <MiniStat label="Avg Fan-out" value={metrics.metrics.avgFanOut} />
          </div>
        </div>
      )}
    </>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "#FF4444",
    warning: "#FFB347",
    info: "#4A90D9",
  };
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 4px",
      borderRadius: 2,
      background: colors[severity] ?? "#666",
      color: "#fff",
      fontSize: 9,
      fontWeight: "bold",
    }}>
      {severity.toUpperCase()}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#0f3460", borderRadius: 4, padding: "6px 10px" }}>
      <div style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
    </div>
  );
}
