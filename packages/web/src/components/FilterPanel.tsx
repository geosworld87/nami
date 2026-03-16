interface FilterPanelProps {
  visibleKinds: Set<string>;
  visibleEdgeKinds: Set<string>;
  onToggleKind: (kind: string) => void;
  onToggleEdgeKind: (kind: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const NODE_KINDS = ["class", "struct", "enum", "protocol", "extension", "function"];
const EDGE_KINDS = [
  "inherits",
  "conforms_to",
  "calls",
  "references",
  "imports",
  "delegates_to",
  "observes",
  "publishes",
  "subscribes",
  "injects",
];

const KIND_COLORS: Record<string, string> = {
  class: "#4A90D9",
  struct: "#50C878",
  enum: "#FFB347",
  protocol: "#7B68EE",
  extension: "#DDA0DD",
  function: "#87CEEB",
  inherits: "#FF6B6B",
  conforms_to: "#7B68EE",
  calls: "#999",
  references: "#CCC",
  imports: "#DDD",
  delegates_to: "#FF9800",
  observes: "#4CAF50",
  publishes: "#2196F3",
  subscribes: "#00BCD4",
  injects: "#9C27B0",
};

export function FilterPanel({
  visibleKinds,
  visibleEdgeKinds,
  onToggleKind,
  onToggleEdgeKind,
  searchQuery,
  onSearchChange,
}: FilterPanelProps) {
  return (
    <div style={{
      position: "absolute",
      left: 12,
      top: 12,
      background: "#16213e",
      color: "#e0e0e0",
      padding: 16,
      borderRadius: 8,
      fontFamily: "system-ui, sans-serif",
      fontSize: 12,
      maxHeight: "calc(100vh - 24px)",
      overflowY: "auto",
      width: 200,
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}>
      <input
        type="text"
        placeholder="Search entities..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: 12,
          background: "#0f3460",
          border: "1px solid #333",
          borderRadius: 4,
          color: "#fff",
          fontSize: 12,
          boxSizing: "border-box",
        }}
      />

      <h4 style={{ margin: "0 0 8px 0", color: "#888", fontSize: 11 }}>ENTITY TYPES</h4>
      {NODE_KINDS.map((kind) => (
        <label key={kind} style={{ display: "flex", alignItems: "center", marginBottom: 4, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={visibleKinds.has(kind)}
            onChange={() => onToggleKind(kind)}
            style={{ marginRight: 6 }}
          />
          <span style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 2,
            background: KIND_COLORS[kind] ?? "#666",
            marginRight: 6,
          }} />
          {kind}
        </label>
      ))}

      <h4 style={{ margin: "12px 0 8px 0", color: "#888", fontSize: 11 }}>RELATIONSHIP TYPES</h4>
      {EDGE_KINDS.map((kind) => (
        <label key={kind} style={{ display: "flex", alignItems: "center", marginBottom: 4, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={visibleEdgeKinds.has(kind)}
            onChange={() => onToggleEdgeKind(kind)}
            style={{ marginRight: 6 }}
          />
          <span style={{
            display: "inline-block",
            width: 12,
            height: 2,
            background: KIND_COLORS[kind] ?? "#666",
            marginRight: 6,
          }} />
          {kind.replace("_", " ")}
        </label>
      ))}
    </div>
  );
}
