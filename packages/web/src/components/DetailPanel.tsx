import { useState, useMemo } from "react";
import type { NamiGraph, MetricsResponse, RepoInfo } from "../api/client.js";
import type { PackedBubble } from "../types/bubble.js";
import { healthScoreColor } from "../utils/health-colors.js";

interface DetailPanelProps {
  bubble: PackedBubble | null;
  graph: NamiGraph;
  metrics?: MetricsResponse;
  repoInfo?: RepoInfo | null;
  onDeselect: () => void;
}

export function DetailPanel({ bubble, graph, metrics, repoInfo, onDeselect }: DetailPanelProps) {
  const context = useBubbleContext(bubble, graph, metrics);

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
      {/* ─── Header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#fff", lineHeight: 1.2 }}>
          {context.name}
        </h2>
        {bubble && (
          <button onClick={onDeselect} style={{
            background: "none", border: "none", color: "#888",
            fontSize: 20, cursor: "pointer", padding: "0 0 0 8px", lineHeight: 1,
          }}>x</button>
        )}
      </div>

      {/* Module + version */}
      <div style={{ color: "#888", fontSize: 12, marginBottom: 16 }}>
        <span>{context.moduleName}</span>
        {repoInfo?.version && (
          <span style={{ marginLeft: 8, color: "#4A90D9" }}>v{repoInfo.version}</span>
        )}
      </div>

      {/* ─── Activity ─── */}
      <Collapsible title="Activity" defaultOpen>
        {repoInfo?.branch ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <InfoRow label="Branch" value={repoInfo.branch} />
            {repoInfo.lastCommit && (
              <>
                <InfoRow
                  label="Last commit"
                  value={
                    <span>
                      <code style={{ color: "#FFB347", fontSize: 11 }}>{repoInfo.lastCommit.sha}</code>
                      <span style={{ color: "#666", marginLeft: 6 }}>{formatDate(repoInfo.lastCommit.date)}</span>
                    </span>
                  }
                />
                <InfoRow label="Author" value={repoInfo.lastCommit.author} />
              </>
            )}
            {repoInfo.contributors.length > 0 && (
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>Top contributors</div>
                {repoInfo.contributors.map((c) => (
                  <div key={c.name} style={{
                    display: "flex", justifyContent: "space-between",
                    marginBottom: 3, fontSize: 12,
                  }}>
                    <span style={{ color: "#e0e0e0" }}>{c.name}</span>
                    <span style={{ color: "#666" }}>{c.commits} commits</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "#666", fontSize: 12 }}>No git repository detected</div>
        )}
      </Collapsible>

      {/* ─── Health Status ─── */}
      <Collapsible title="Health Status" defaultOpen>
        {/* Coverage */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#888", fontSize: 11 }}>Code Coverage</span>
            <span style={{ color: coverageColor(context.coverage), fontWeight: "bold", fontSize: 13 }}>
              {context.coverage}%
            </span>
          </div>
          <ProgressBar value={context.coverage} color={coverageColor(context.coverage)} />
          {context.coverageDetail && (
            <div style={{ marginTop: 6 }}>
              {context.coverageDetail.map((c) => (
                <div key={c.module} style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 11, marginBottom: 2, color: "#888",
                }}>
                  <span>{c.module}</span>
                  <span style={{ color: coverageColor(c.percentage) }}>{c.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health score */}
        {context.healthScore !== null && (
          <div style={{
            padding: 10, background: "var(--nami-surface)", borderRadius: 6,
            borderLeft: `3px solid ${healthScoreColor(context.healthScore)}`, marginBottom: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "#888", fontSize: 11 }}>Health Score</span>
              <div>
                <span style={{ fontSize: 22, fontWeight: "bold", color: healthScoreColor(context.healthScore) }}>
                  {context.healthScore}
                </span>
                <span style={{ fontSize: 11, color: "#666" }}>/100</span>
              </div>
            </div>
            <ProgressBar value={context.healthScore} color={healthScoreColor(context.healthScore)} />
          </div>
        )}

        {/* Code smells */}
        <div>
          <div style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>
            Code Smells ({context.smells.length})
          </div>
          {context.smells.length === 0 ? (
            <div style={{ color: "#50C878", fontSize: 12 }}>No issues detected</div>
          ) : (
            context.smells.map((s) => (
              <div key={s.id} style={{
                marginBottom: 6, padding: "6px 8px",
                background: "var(--nami-surface)", borderRadius: 4,
                borderLeft: `3px solid ${severityColor(s.severity)}`,
              }}>
                <div style={{ fontSize: 12 }}>
                  <SeverityDot severity={s.severity} />
                  <span style={{ marginLeft: 6 }}>{s.title}</span>
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.description}</div>
              </div>
            ))
          )}
        </div>
      </Collapsible>
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────

function Collapsible({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          width: "100%", padding: "8px 0", border: "none",
          background: "none", color: "#aaa", fontSize: 12,
          cursor: "pointer", fontFamily: "inherit",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          letterSpacing: "0.04em",
        }}
      >
        <span style={{
          display: "inline-block", transition: "transform 200ms",
          transform: open ? "rotate(90deg)" : "rotate(0deg)", fontSize: 10,
        }}>
          &#9654;
        </span>
        {title.toUpperCase()}
      </button>
      {open && <div style={{ paddingTop: 10 }}>{children}</div>}
    </div>
  );
}

// ─── Context hook ─────────────────────────────────────────────

interface BubbleContext {
  name: string;
  moduleName: string;
  coverage: number;
  coverageDetail: Array<{ module: string; percentage: number }> | null;
  healthScore: number | null;
  smells: Array<{ id: string; title: string; description: string; severity: string }>;
}

function useBubbleContext(
  bubble: PackedBubble | null,
  graph: NamiGraph,
  metrics?: MetricsResponse,
): BubbleContext {
  return useMemo(() => {
    // ─── No selection → overall ───
    if (!bubble) {
      const coverageDetail = metrics
        ? Object.entries(metrics.coverage.byModule).map(([m, c]) => ({ module: m, percentage: c.percentage }))
        : null;
      return {
        name: graph.rootPath.replace(/\/+$/, "").split("/").pop() ?? "Repository",
        moduleName: "All modules",
        coverage: metrics?.coverage.coveragePercentage ?? 0,
        coverageDetail,
        healthScore: metrics?.health?.overall ?? null,
        smells: metrics?.suggestions ?? [],
      };
    }

    // ─── Entity selected ───
    if (bubble.kind === "entity") {
      const moduleName = getModule(bubble.filePath ?? "");
      const entityHealth = metrics?.health?.entities.find((e) => e.entityId === bubble.id);
      const moduleCov = metrics?.coverage.byModule[moduleName];
      const isCovered = metrics?.coverage.coveredFiles.some((c) => c.source === bubble.filePath);
      const entitySmells = (metrics?.suggestions ?? []).filter(
        (s) => s.affectedEntities.includes(bubble.id),
      );
      return {
        name: bubble.name,
        moduleName,
        coverage: isCovered ? 100 : 0,
        coverageDetail: moduleCov ? [{ module: moduleName, percentage: moduleCov.percentage }] : null,
        healthScore: entityHealth?.score ?? null,
        smells: entitySmells,
      };
    }

    // ─── Module / file selected ───
    const moduleName = resolveModuleName(bubble);
    const childEntityIds = resolveChildEntityIds(bubble, graph);

    // Coverage for this module
    const moduleCov = metrics?.coverage.byModule[moduleName];
    const coverage = moduleCov?.percentage ?? 0;

    // Health — find module or average entities
    const moduleHealth = metrics?.health?.modules.find((m) => m.module === moduleName);
    const healthScore = moduleHealth?.score ?? metrics?.health?.overall ?? null;

    // Smells affecting children
    const smells = (metrics?.suggestions ?? []).filter(
      (s) => s.affectedEntities.some((id) => childEntityIds.has(id)),
    );

    // Coverage sub-modules
    let coverageDetail: Array<{ module: string; percentage: number }> | null = null;
    if (bubble.id === "repo" && metrics) {
      coverageDetail = Object.entries(metrics.coverage.byModule).map(([m, c]) => ({
        module: m, percentage: c.percentage,
      }));
    }

    return { name: bubble.name, moduleName, coverage, coverageDetail, healthScore, smells };
  }, [bubble, graph, metrics]);
}

function getModule(filePath: string): string {
  const parts = filePath.split("/");
  const start = parts[0] === "Sources" ? 1 : 0;
  return parts[start] ?? "root";
}

function resolveModuleName(bubble: PackedBubble): string {
  if (bubble.id === "repo") return "All modules";
  if (bubble.id.startsWith("module::")) {
    const dir = bubble.id.slice(8);
    return dir.split("/").pop() ?? bubble.name;
  }
  return bubble.name;
}

function resolveChildEntityIds(bubble: PackedBubble, graph: NamiGraph): Set<string> {
  const ids = new Set<string>();
  if (bubble.kind === "file") {
    for (const n of graph.nodes) {
      if (n.kind !== "file" && n.kind !== "module" && n.filePath === bubble.filePath) {
        ids.add(n.id);
      }
    }
    return ids;
  }

  // Module — determine prefix
  let prefix: string;
  if (bubble.id === "repo") {
    // Repo-level: all entities
    for (const n of graph.nodes) {
      if (n.kind !== "file" && n.kind !== "module") ids.add(n.id);
    }
    return ids;
  } else if (bubble.id.startsWith("module::")) {
    prefix = bubble.id.slice(8) + "/";
  } else {
    prefix = bubble.name + "/";
  }

  for (const n of graph.nodes) {
    if (n.kind !== "file" && n.kind !== "module" && n.filePath.startsWith(prefix)) {
      ids.add(n.id);
    }
  }
  return ids;
}

// ─── Shared components ────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: "#888", fontSize: 11 }}>{label}</div>
      <div style={{ color: "#e0e0e0", fontSize: 13 }}>{value}</div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 4, background: "#333", borderRadius: 2 }}>
      <div style={{
        height: "100%", width: `${Math.max(0, Math.min(100, value))}%`,
        background: color, borderRadius: 2, transition: "width 300ms",
      }} />
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  return (
    <span style={{
      display: "inline-block", width: 6, height: 6, borderRadius: "50%",
      background: severityColor(severity), verticalAlign: "middle",
    }} />
  );
}

function severityColor(severity: string): string {
  if (severity === "critical") return "#FF4444";
  if (severity === "warning") return "#FFB347";
  return "#4A90D9";
}

function coverageColor(pct: number): string {
  if (pct >= 70) return "#50C878";
  if (pct >= 40) return "#FFB347";
  return "#FF6B6B";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}
