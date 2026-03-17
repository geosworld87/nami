import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { select } from "d3-selection";
import { zoom as d3zoom, zoomIdentity } from "d3-zoom";
import type { NamiGraph } from "../api/client.js";
import type { HierarchyDatum, PackedBubble, SizeMetric } from "../types/bubble.js";
import { buildHierarchy } from "../utils/hierarchy-builder.js";
import { useBubbleLayout } from "../hooks/useBubbleLayout.js";
import { useSemanticZoom } from "../hooks/useSemanticZoom.js";
import { Bubble } from "./Bubble.js";
import { BreadcrumbNav } from "./BreadcrumbNav.js";
import { KIND_GLOW } from "../utils/bubble-colors.js";
import type { ColorMode } from "./FilterPanel.js";
import "./BubbleView.css";

interface BubbleViewProps {
  graph: NamiGraph;
  visibleKinds: Set<string>;
  sizeMetric: SizeMetric;
  onBubbleSelect: (bubble: PackedBubble | null) => void;
  highlightedNodes?: Set<string>;
  searchQuery: string;
  colorMode: ColorMode;
  healthScores?: Map<string, number>;
}

export function BubbleView({
  graph,
  visibleKinds,
  sizeMetric,
  onBubbleSelect,
  highlightedNodes,
  searchQuery,
  colorMode,
  healthScores,
}: BubbleViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<ReturnType<typeof d3zoom<SVGSVGElement, unknown>> | null>(null);
  const cooldownRef = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredBubble, setHoveredBubble] = useState<PackedBubble | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [svgTransform, setSvgTransform] = useState("translate(0,0) scale(1)");
  const [transitionClass, setTransitionClass] = useState<"" | "burst-in" | "collapse-out">("");

  // Extract repo name from root path
  const repoName = useMemo(() => {
    const parts = graph.rootPath.replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || "Root";
  }, [graph.rootPath]);

  // Build hierarchy from flat graph
  const hierarchyData = useMemo(
    () => buildHierarchy(graph.nodes, visibleKinds, sizeMetric, repoName),
    [graph.nodes, visibleKinds, sizeMetric, repoName],
  );

  // Semantic zoom state
  const { focusNode, breadcrumb, level, zoomIn, zoomOut, navigateTo, findNode } =
    useSemanticZoom(hierarchyData);

  // Circle-pack layout
  const bubbles = useBubbleLayout(hierarchyData, dimensions.width, dimensions.height, focusNode);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    setDimensions({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Stable refs for semantic zoom callbacks (avoid re-binding d3-zoom on every render)
  const levelRef = useRef(level);
  const bubblesRef = useRef(bubbles);
  const findNodeRef = useRef(findNode);
  const zoomInRef = useRef(zoomIn);
  const zoomOutRef = useRef(zoomOut);
  levelRef.current = level;
  bubblesRef.current = bubbles;
  findNodeRef.current = findNode;
  zoomInRef.current = zoomIn;
  zoomOutRef.current = zoomOut;

  const ZOOM_IN_THRESHOLD = 1.8;
  const ZOOM_OUT_THRESHOLD = 0.55;

  // Reset d3 transform to identity (used after semantic transitions)
  const resetD3Transform = useCallback(() => {
    const svg = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svg || !zb) return;
    const sel = select(svg);
    sel.call(zb.transform, zoomIdentity);
    setSvgTransform("translate(0,0) scale(1)");
  }, []);

  // d3-zoom with semantic zoom threshold triggers
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .filter((event) => {
        // Allow wheel and pointer drag, block double-click zoom
        if (event.type === "dblclick") return false;
        return true;
      })
      .on("zoom", (event) => {
        if (cooldownRef.current) return;

        const t = event.transform;
        const scale = t.k;

        // Zoom IN threshold → burst into the bubble under the mouse
        if (scale > ZOOM_IN_THRESHOLD && levelRef.current < 3) {
          const currentBubbles = bubblesRef.current;
          const drillable = currentBubbles.filter((b) => b.hasChildren);
          if (drillable.length > 0) {
            // Get mouse position in SVG space (invert the current d3 transform)
            const srcEvt = event.sourceEvent as MouseEvent | WheelEvent | null;
            let mx: number;
            let my: number;
            if (srcEvt && svg) {
              const rect = svg.getBoundingClientRect();
              const clientX = srcEvt.clientX - rect.left;
              const clientY = srcEvt.clientY - rect.top;
              // Invert transform: svgX = (clientX - translate.x) / scale
              mx = (clientX - t.x) / t.k;
              my = (clientY - t.y) / t.k;
            } else {
              mx = dimensions.width / 2;
              my = dimensions.height / 2;
            }

            // First: find a drillable bubble that contains the mouse
            let target = drillable.find((b) => {
              const dx = b.x - mx;
              const dy = b.y - my;
              return dx * dx + dy * dy <= b.r * b.r;
            });

            // Fallback: closest drillable bubble to mouse
            if (!target) {
              let minDist = Infinity;
              for (const b of drillable) {
                const dx = b.x - mx;
                const dy = b.y - my;
                const dist = dx * dx + dy * dy;
                if (dist < minDist) {
                  minDist = dist;
                  target = b;
                }
              }
            }

            const node = target ? findNodeRef.current(target.id) : null;
            if (node) {
              cooldownRef.current = true;
              setTransitionClass("burst-in");
              setTimeout(() => {
                zoomInRef.current(node);
                setTransitionClass("");
              }, 200);
            }
            return;
          }
        }

        // Zoom OUT threshold → collapse to parent
        if (scale < ZOOM_OUT_THRESHOLD && levelRef.current > 0) {
          cooldownRef.current = true;
          setTransitionClass("collapse-out");
          setTimeout(() => {
            zoomOutRef.current();
            setTransitionClass("");
          }, 200);
          return;
        }

        setSvgTransform(`translate(${t.x},${t.y}) scale(${t.k})`);
      });

    zoomBehaviorRef.current = zoomBehavior;
    const sel = select(svg);
    sel.call(zoomBehavior);

    return () => {
      sel.on(".zoom", null);
    };
  }, [dimensions.width, dimensions.height]);

  // Reset d3 transform when semantic level changes
  useEffect(() => {
    resetD3Transform();
    // Release cooldown after the transition settles
    const timer = setTimeout(() => {
      cooldownRef.current = false;
    }, 450);
    return () => clearTimeout(timer);
  }, [level, focusNode, resetD3Transform]);

  // Single click → always select (show detail panel)
  const handleBubbleClick = useCallback(
    (bubble: PackedBubble) => {
      onBubbleSelect(bubble);
    },
    [onBubbleSelect],
  );

  // Double click → zoom into children
  const handleBubbleDoubleClick = useCallback(
    (bubble: PackedBubble) => {
      if (bubble.hasChildren && level < 3) {
        const node = findNode(bubble.id);
        if (node) zoomIn(node);
      }
    },
    [level, findNode, zoomIn],
  );

  // Background click → deselect (or zoom out)
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.target !== e.currentTarget) return;
      if (level > 0) {
        zoomOut();
      }
      onBubbleSelect(null);
    },
    [level, zoomOut, onBubbleSelect],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // Search matching — check if a bubble or any descendant matches
  const searchMatches = useMemo(() => {
    const matches = new Set<string>();
    if (searchQuery.length < 2) return matches;
    const q = searchQuery.toLowerCase();
    for (const bubble of bubbles) {
      if (bubble.name.toLowerCase().includes(q)) {
        matches.add(bubble.id);
        continue;
      }
      const node = findNode(bubble.id);
      if (node && hasDescendantMatch(node, q)) {
        matches.add(bubble.id);
      }
    }
    return matches;
  }, [bubbles, searchQuery, findNode]);

  // Blast radius — check if bubble or descendants are highlighted
  const blastActive = highlightedNodes && highlightedNodes.size > 0;
  const bubbleHighlighted = useMemo(() => {
    const set = new Set<string>();
    if (!blastActive) return set;
    for (const bubble of bubbles) {
      if (highlightedNodes!.has(bubble.id)) {
        set.add(bubble.id);
        continue;
      }
      const node = findNode(bubble.id);
      if (node && hasDescendantInSet(node, highlightedNodes!)) {
        set.add(bubble.id);
      }
    }
    return set;
  }, [bubbles, highlightedNodes, blastActive, findNode]);

  return (
    <div
      ref={containerRef}
      className="bubble-view-container"
      onMouseMove={handleMouseMove}
    >
      <svg
        ref={svgRef}
        className="bubble-view-svg"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        onClick={handleBackgroundClick}
      >
        <defs>
          {Object.entries(KIND_GLOW).map(([kind, color]) => (
            <filter key={kind} id={`glow-${kind}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feFlood floodColor={color} floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}

          <filter id="glow-default" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feFlood floodColor="#888" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-blast" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feFlood floodColor="#FF4444" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-search" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feFlood floodColor="#00FF00" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g ref={gRef} transform={svgTransform} className={transitionClass}>
          {bubbles.map((bubble) => (
            <Bubble
              key={bubble.id}
              bubble={bubble}
              onClick={handleBubbleClick}
              onDoubleClick={handleBubbleDoubleClick}
              onHover={setHoveredBubble}
              highlighted={blastActive ? bubbleHighlighted.has(bubble.id) : undefined}
              dimmed={blastActive ? !bubbleHighlighted.has(bubble.id) : undefined}
              searchMatch={searchMatches.has(bubble.id)}
              colorMode={colorMode}
              healthScore={healthScores?.get(bubble.id)}
            />
          ))}
        </g>
      </svg>

      {/* Breadcrumb navigation */}
      <BreadcrumbNav breadcrumb={breadcrumb} onNavigate={navigateTo} rootName={repoName} />

      {/* Tooltip */}
      {hoveredBubble && (
        <div
          className="bubble-tooltip nami-glass"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 8,
          }}
        >
          <div className="tooltip-name">{hoveredBubble.name}</div>
          <div className="tooltip-detail">
            {hoveredBubble.nodeKind ?? hoveredBubble.kind}
            {hoveredBubble.value > 0 && ` \u2022 ${hoveredBubble.value.toLocaleString()} loc`}
          </div>
        </div>
      )}
    </div>
  );
}

function hasDescendantMatch(node: HierarchyDatum, query: string): boolean {
  if (node.name.toLowerCase().includes(query)) return true;
  if (node.children) {
    for (const child of node.children) {
      if (hasDescendantMatch(child, query)) return true;
    }
  }
  return false;
}

function hasDescendantInSet(node: HierarchyDatum, ids: Set<string>): boolean {
  if (ids.has(node.id)) return true;
  if (node.children) {
    for (const child of node.children) {
      if (hasDescendantInSet(child, ids)) return true;
    }
  }
  return false;
}
