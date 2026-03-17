import type { HierarchyDatum } from "../types/bubble.js";

interface BreadcrumbNavProps {
  breadcrumb: HierarchyDatum[];
  onNavigate: (index: number) => void;
  rootName?: string;
}

export function BreadcrumbNav({ breadcrumb, onNavigate, rootName = "Root" }: BreadcrumbNavProps) {
  if (breadcrumb.length === 0) return null;

  return (
    <nav
      className="nami-glass"
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 16px",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
        color: "#e0e0e0",
        zIndex: 20,
      }}
    >
      <button
        onClick={() => onNavigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "#4A90D9",
          cursor: "pointer",
          padding: "2px 4px",
          fontSize: 13,
          fontFamily: "inherit",
        }}
      >
        {rootName}
      </button>

      {breadcrumb.map((node, i) => (
        <span key={node.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#555" }}>/</span>
          {i < breadcrumb.length - 1 ? (
            <button
              onClick={() => onNavigate(i)}
              style={{
                background: "none",
                border: "none",
                color: "#4A90D9",
                cursor: "pointer",
                padding: "2px 4px",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              {node.name}
            </button>
          ) : (
            <span style={{ color: "#fff", fontWeight: 600 }}>{node.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
