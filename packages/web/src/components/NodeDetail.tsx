import { useState } from "react";
import type { GraphNode, NamiGraph, BlastRadiusResult } from "../api/client.js";
import { fetchBlastRadius } from "../api/client.js";

interface NodeDetailProps {
  node: GraphNode;
  graph: NamiGraph;
  onBlastRadius: (result: BlastRadiusResult) => void;
  onClose: () => void;
}

export function NodeDetail({ node, graph, onBlastRadius, onClose }: NodeDetailProps) {
  const [loadingBlast, setLoadingBlast] = useState(false);

  const incoming = graph.edges.filter(
    (e) => e.target === node.id || e.target === node.name,
  );
  const outgoing = graph.edges.filter(
    (e) => e.source === node.id || e.source.endsWith(`::${node.name}`),
  );

  const handleBlastRadius = async () => {
    setLoadingBlast(true);
    try {
      const result = await fetchBlastRadius(node.id);
      onBlastRadius(result);
    } catch {
      // ignore
    }
    setLoadingBlast(false);
  };

  return (
    <div
      className="nami-glass"
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 360,
        color: "#e0e0e0",
        padding: 20,
        overflowY: "auto",
        borderRadius: 0,
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
        zIndex: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#fff" }}>{node.name}</h2>
        <button onClick={onClose} style={{
          background: "none",
          border: "none",
          color: "#888",
          fontSize: 20,
          cursor: "pointer",
        }}>x</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Badge kind={node.kind} />
        <div style={{ marginTop: 8, color: "#888" }}>{node.filePath}</div>
        <div style={{ color: "#888" }}>Lines {node.startLine}-{node.endLine}</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, color: "#aaa", marginBottom: 8 }}>Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Stat label="Lines of Code" value={node.metadata.linesOfCode as number} />
          {node.metadata.methodCount !== undefined && (
            <Stat label="Methods" value={node.metadata.methodCount as number} />
          )}
          {node.metadata.propertyCount !== undefined && (
            <Stat label="Properties" value={node.metadata.propertyCount as number} />
          )}
          <Stat label="Incoming" value={incoming.length} />
          <Stat label="Outgoing" value={outgoing.length} />
        </div>
      </div>

      <button
        onClick={handleBlastRadius}
        disabled={loadingBlast}
        style={{
          width: "100%",
          padding: "10px",
          background: "#FF4444",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: "bold",
          marginBottom: 16,
          opacity: loadingBlast ? 0.6 : 1,
        }}
      >
        {loadingBlast ? "Analyzing..." : "Show Blast Radius"}
      </button>

      {incoming.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: "#aaa", marginBottom: 8 }}>
            Depends on this ({incoming.length})
          </h3>
          {incoming.slice(0, 15).map((e) => (
            <div key={e.id} style={{ marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: "#4A90D9" }}>{prettify(e.source)}</span>
              <span style={{ color: "#666" }}> via </span>
              <span style={{ color: "#FFB347" }}>{e.kind}</span>
            </div>
          ))}
          {incoming.length > 15 && (
            <div style={{ color: "#666", fontSize: 12 }}>...and {incoming.length - 15} more</div>
          )}
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, color: "#aaa", marginBottom: 8 }}>
            This depends on ({outgoing.length})
          </h3>
          {outgoing.slice(0, 15).map((e) => (
            <div key={e.id} style={{ marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: "#4A90D9" }}>{prettify(e.target)}</span>
              <span style={{ color: "#666" }}> via </span>
              <span style={{ color: "#FFB347" }}>{e.kind}</span>
            </div>
          ))}
          {outgoing.length > 15 && (
            <div style={{ color: "#666", fontSize: 12 }}>...and {outgoing.length - 15} more</div>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ kind }: { kind: string }) {
  const colors: Record<string, string> = {
    class: "#4A90D9",
    struct: "#50C878",
    enum: "#FFB347",
    protocol: "#7B68EE",
    extension: "#DDA0DD",
    function: "#87CEEB",
  };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      background: colors[kind] ?? "#666",
      color: "#fff",
      fontSize: 11,
      fontWeight: "bold",
    }}>
      {kind}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: "var(--nami-surface)",
      borderRadius: 6,
      padding: "8px 12px",
    }}>
      <div style={{ fontSize: 18, fontWeight: "bold", color: "#fff" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
    </div>
  );
}

function prettify(id: string): string {
  const parts = id.split("::");
  return parts[parts.length - 1];
}
