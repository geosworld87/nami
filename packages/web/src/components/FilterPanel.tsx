import type { SizeMetric } from "../types/bubble.js";

export type ColorMode = "kind" | "health";

interface FilterPanelProps {
  visibleKinds: Set<string>;
  onToggleKind: (kind: string) => void;
  sizeMetric: SizeMetric;
  onSizeMetricChange: (metric: SizeMetric) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
}

const NODE_KINDS = ["class", "struct", "enum", "protocol", "extension", "function"];

const KIND_COLORS: Record<string, string> = {
  class: "#4A90D9",
  struct: "#50C878",
  enum: "#FFB347",
  protocol: "#7B68EE",
  extension: "#DDA0DD",
  function: "#87CEEB",
};

export function FilterPanel({
  visibleKinds,
  onToggleKind,
  sizeMetric,
  onSizeMetricChange,
  searchQuery,
  onSearchChange,
  colorMode,
  onColorModeChange,
}: FilterPanelProps) {
  return (
    <div
      className="nami-glass"
      style={{
        position: "absolute",
        left: 12,
        top: 12,
        color: "#e0e0e0",
        padding: 16,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12,
        maxHeight: "calc(100vh - 24px)",
        overflowY: "auto",
        width: 200,
        zIndex: 20,
      }}
    >
      <input
        type="text"
        placeholder="Search entities..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: 12,
          background: "var(--nami-surface)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          color: "#fff",
          fontSize: 12,
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <h4 style={{ margin: "0 0 8px 0", color: "#888", fontSize: 11, letterSpacing: "0.05em" }}>
        ENTITY TYPES
      </h4>
      {NODE_KINDS.map((kind) => (
        <label
          key={kind}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 4,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={visibleKinds.has(kind)}
            onChange={() => onToggleKind(kind)}
            style={{ marginRight: 6 }}
          />
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: KIND_COLORS[kind] ?? "#666",
              marginRight: 6,
              boxShadow: `0 0 6px ${KIND_COLORS[kind] ?? "#666"}40`,
            }}
          />
          {kind}
        </label>
      ))}

      <h4 style={{ margin: "16px 0 8px 0", color: "#888", fontSize: 11, letterSpacing: "0.05em" }}>
        SIZE BY
      </h4>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={() => onSizeMetricChange("loc")}
          style={{
            flex: 1,
            padding: "6px 0",
            background: sizeMetric === "loc" ? "#4A90D9" : "var(--nami-surface)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "inherit",
            transition: "background 200ms",
          }}
        >
          Lines of Code
        </button>
        <button
          onClick={() => onSizeMetricChange("methods")}
          style={{
            flex: 1,
            padding: "6px 0",
            background: sizeMetric === "methods" ? "#4A90D9" : "var(--nami-surface)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "inherit",
            transition: "background 200ms",
          }}
        >
          Methods
        </button>
      </div>

      <h4 style={{ margin: "16px 0 8px 0", color: "#888", fontSize: 11, letterSpacing: "0.05em" }}>
        COLOR BY
      </h4>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={() => onColorModeChange("kind")}
          style={{
            flex: 1,
            padding: "6px 0",
            background: colorMode === "kind" ? "#4A90D9" : "var(--nami-surface)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "inherit",
            transition: "background 200ms",
          }}
        >
          Kind
        </button>
        <button
          onClick={() => onColorModeChange("health")}
          style={{
            flex: 1,
            padding: "6px 0",
            background: colorMode === "health" ? "#50C878" : "var(--nami-surface)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "inherit",
            transition: "background 200ms",
          }}
        >
          Health
        </button>
      </div>
    </div>
  );
}
