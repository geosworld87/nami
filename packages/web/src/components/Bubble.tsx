import { memo } from "react";
import type { PackedBubble } from "../types/bubble.js";
import { bubbleColor, gradientStops } from "../utils/bubble-colors.js";
import { healthScoreColor } from "../utils/health-colors.js";
import type { ColorMode } from "./FilterPanel.js";

interface BubbleProps {
  bubble: PackedBubble;
  onClick: (bubble: PackedBubble) => void;
  onDoubleClick: (bubble: PackedBubble) => void;
  onHover: (bubble: PackedBubble | null) => void;
  highlighted?: boolean;
  dimmed?: boolean;
  searchMatch?: boolean;
  colorMode?: ColorMode;
  healthScore?: number;
}

export const Bubble = memo(function Bubble({
  bubble,
  onClick,
  onDoubleClick,
  onHover,
  highlighted,
  dimmed,
  searchMatch,
  colorMode,
  healthScore,
}: BubbleProps) {
  const color =
    colorMode === "health" && healthScore !== undefined
      ? healthScoreColor(healthScore)
      : bubbleColor(bubble.kind, bubble.nodeKind);
  const [stopLight, stopFull] = gradientStops(color);
  const gradId = `grad-${bubble.id.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const filterId = bubble.nodeKind ? `glow-${bubble.nodeKind}` : "glow-default";

  const showLabel = bubble.r > 20;
  const showValue = bubble.r > 35;
  const fontSize = Math.max(10, Math.min(bubble.r * 0.22, 18));
  const valueFontSize = Math.max(9, fontSize * 0.75);

  let className = "bubble-group visible";
  if (highlighted) className += " bubble-highlighted";
  if (dimmed) className += " bubble-dimmed";
  if (searchMatch) className += " bubble-search-match";

  return (
    <g
      className={className}
      style={{ transformOrigin: `${bubble.x}px ${bubble.y}px` }}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={stopLight} />
          <stop offset="100%" stopColor={stopFull} />
        </radialGradient>
      </defs>

      {/* Outer glow circle */}
      <circle
        className="bubble-circle-outer"
        cx={bubble.x}
        cy={bubble.y}
        r={bubble.r}
        fill={`url(#${gradId})`}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.6}
        filter={`url(#${filterId})`}
        onClick={() => onClick(bubble)}
        onDoubleClick={() => onDoubleClick(bubble)}
        onMouseEnter={() => onHover(bubble)}
        onMouseLeave={() => onHover(null)}
      />

      {/* Inner highlight circle */}
      <circle
        className="bubble-circle-inner"
        cx={bubble.x}
        cy={bubble.y}
        r={bubble.r * 0.85}
        fill={`url(#${gradId})`}
        opacity={0.4}
      />

      {/* Label */}
      {showLabel && (
        <text
          className="bubble-label"
          x={bubble.x}
          y={showValue ? bubble.y - valueFontSize * 0.5 : bubble.y}
          fontSize={fontSize}
        >
          {truncate(bubble.name, bubble.r)}
        </text>
      )}

      {/* Value subtitle */}
      {showValue && (
        <text
          className="bubble-value"
          x={bubble.x}
          y={bubble.y + fontSize * 0.7}
          fontSize={valueFontSize}
        >
          {bubble.value.toLocaleString()} {bubble.kind === "entity" ? "loc" : ""}
        </text>
      )}
    </g>
  );
});

function truncate(text: string, radius: number): string {
  const fontSize = Math.max(10, Math.min(radius * 0.22, 18));
  const charWidth = fontSize * 0.6;
  const availableWidth = radius * 1.6; // ~80% of diameter
  const maxChars = Math.floor(availableWidth / charWidth);
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + "\u2026";
}
