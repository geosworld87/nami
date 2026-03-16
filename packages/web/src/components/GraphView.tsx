import { useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import type { NamiGraph, GraphNode } from "../api/client.js";

cytoscape.use(dagre);

// Color palette per NodeKind
const NODE_COLORS: Record<string, string> = {
  class: "#4A90D9",
  struct: "#50C878",
  enum: "#FFB347",
  protocol: "#7B68EE",
  extension: "#DDA0DD",
  function: "#87CEEB",
  property: "#D3D3D3",
  file: "#F5F5F5",
  module: "#FF6B6B",
};

const NODE_SHAPES: Record<string, string> = {
  class: "round-rectangle",
  struct: "round-rectangle",
  enum: "round-hexagon",
  protocol: "diamond",
  extension: "round-rectangle",
  function: "ellipse",
  file: "rectangle",
};

const EDGE_COLORS: Record<string, string> = {
  inherits: "#FF6B6B",
  conforms_to: "#7B68EE",
  calls: "#999",
  references: "#CCC",
  imports: "#DDD",
  declares: "#EEE",
  delegates_to: "#FF9800",
  observes: "#4CAF50",
  publishes: "#2196F3",
  subscribes: "#00BCD4",
  injects: "#9C27B0",
  test_covers: "#8BC34A",
};

interface GraphViewProps {
  graph: NamiGraph;
  onNodeSelect: (node: GraphNode | null) => void;
  highlightedNodes?: Set<string>;
  visibleKinds: Set<string>;
  visibleEdgeKinds: Set<string>;
  searchQuery: string;
}

export function GraphView({
  graph,
  onNodeSelect,
  highlightedNodes,
  visibleKinds,
  visibleEdgeKinds,
  searchQuery,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const initGraph = useCallback(() => {
    if (!containerRef.current) return;

    // Filter to non-file nodes for the main view (files clutter the graph)
    const filteredNodes = graph.nodes.filter(
      (n) => n.kind !== "file" && visibleKinds.has(n.kind),
    );
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    // Also include short names for edge matching
    const nodeNames = new Set(filteredNodes.map((n) => n.name));

    const filteredEdges = graph.edges.filter(
      (e) =>
        visibleEdgeKinds.has(e.kind) &&
        e.kind !== "declares" &&
        e.kind !== "contains" &&
        (nodeIds.has(e.source) || nodeNames.has(e.source.split("::").pop()!)) &&
        (nodeIds.has(e.target) || nodeNames.has(e.target)),
    );

    const elements: cytoscape.ElementDefinition[] = [];

    for (const node of filteredNodes) {
      elements.push({
        data: {
          id: node.id,
          label: node.name,
          kind: node.kind,
          filePath: node.filePath,
          linesOfCode: node.metadata.linesOfCode,
          methodCount: node.metadata.methodCount,
          propertyCount: node.metadata.propertyCount,
        },
      });
    }

    for (const edge of filteredEdges) {
      // Resolve source/target to actual node IDs
      const sourceId = nodeIds.has(edge.source)
        ? edge.source
        : filteredNodes.find((n) => n.name === edge.source.split("::").pop())?.id;
      const targetId = nodeIds.has(edge.target)
        ? edge.target
        : filteredNodes.find((n) => n.name === edge.target)?.id;

      if (sourceId && targetId && sourceId !== targetId) {
        elements.push({
          data: {
            id: edge.id,
            source: sourceId,
            target: targetId,
            kind: edge.kind,
            label: edge.kind,
          },
        });
      }
    }

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "11px",
            "font-family": "system-ui, sans-serif",
            "background-color": "#4A90D9",
            color: "#fff",
            "text-outline-color": "#333",
            "text-outline-width": 1,
            width: 30,
            height: 30,
            "min-zoomed-font-size": 8,
          },
        },
        // Per-kind styles
        ...Object.entries(NODE_COLORS).map(([kind, color]) => ({
          selector: `node[kind="${kind}"]`,
          style: {
            "background-color": color,
            shape: (NODE_SHAPES[kind] ?? "ellipse") as any,
          },
        })),
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#DDD",
            "target-arrow-color": "#DDD",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.6,
          },
        },
        // Per-kind edge styles
        ...Object.entries(EDGE_COLORS).map(([kind, color]) => ({
          selector: `edge[kind="${kind}"]`,
          style: {
            "line-color": color,
            "target-arrow-color": color,
          },
        })),
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#FFD700",
          },
        },
        {
          selector: ".highlighted",
          style: {
            "border-width": 3,
            "border-color": "#FF4444",
            "background-opacity": 1,
          },
        },
        {
          selector: ".dimmed",
          style: {
            opacity: 0.2,
          },
        },
        {
          selector: ".blast-1",
          style: { "border-width": 3, "border-color": "#FF4444" },
        },
        {
          selector: ".blast-2",
          style: { "border-width": 3, "border-color": "#FF8C00" },
        },
        {
          selector: ".blast-3",
          style: { "border-width": 2, "border-color": "#FFD700" },
        },
        {
          selector: ".search-match",
          style: {
            "border-width": 3,
            "border-color": "#00FF00",
            "background-opacity": 1,
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "TB",
        nodeSep: 60,
        rankSep: 80,
        animate: false,
      } as any,
      minZoom: 0.1,
      maxZoom: 5,
    });

    // Click handler
    cy.on("tap", "node", (evt) => {
      const nodeData = evt.target.data();
      const graphNode = graph.nodes.find((n) => n.id === nodeData.id);
      onNodeSelect(graphNode ?? null);
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        onNodeSelect(null);
      }
    });

    cyRef.current = cy;
  }, [graph, visibleKinds, visibleEdgeKinds, onNodeSelect]);

  useEffect(() => {
    initGraph();
  }, [initGraph]);

  // Handle blast radius highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().removeClass("highlighted dimmed blast-1 blast-2 blast-3");

    if (highlightedNodes && highlightedNodes.size > 0) {
      cy.nodes().forEach((node) => {
        if (highlightedNodes.has(node.id())) {
          node.addClass("highlighted");
        } else {
          node.addClass("dimmed");
        }
      });
      cy.edges().forEach((edge) => {
        const src = edge.source().id();
        const tgt = edge.target().id();
        if (!highlightedNodes.has(src) || !highlightedNodes.has(tgt)) {
          edge.addClass("dimmed");
        }
      });
    }
  }, [highlightedNodes]);

  // Handle search highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass("search-match");

    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      cy.nodes().forEach((node) => {
        const label = (node.data("label") as string ?? "").toLowerCase();
        if (label.includes(q)) {
          node.addClass("search-match");
        }
      });
    }
  }, [searchQuery]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#1a1a2e",
      }}
    />
  );
}
