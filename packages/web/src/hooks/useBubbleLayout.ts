import { useMemo } from "react";
import { hierarchy, pack } from "d3-hierarchy";
import type { HierarchyDatum, PackedBubble } from "../types/bubble.js";

/**
 * Compute circle-pack layout from a hierarchy datum.
 * Returns flat array of PackedBubble for the children of the focus node.
 */
export function useBubbleLayout(
  root: HierarchyDatum,
  width: number,
  height: number,
  focusNode: HierarchyDatum | null,
): PackedBubble[] {
  return useMemo(() => {
    // Determine which subtree to layout
    const target = focusNode ?? root;
    if (!target.children || target.children.length === 0) return [];

    const size = Math.min(width, height);
    if (size <= 0) return [];

    const h = hierarchy(target)
      .sum((d) => (d.children && d.children.length > 0 ? 0 : Math.max(d.value, 1)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const packLayout = pack<HierarchyDatum>()
      .size([size, size])
      .padding(size * 0.02);

    const packed = packLayout(h);

    // Offset to center in viewport
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;

    // Return only depth-1 children (the visible bubbles at current zoom level)
    const bubbles: PackedBubble[] = [];
    for (const child of packed.children ?? []) {
      bubbles.push({
        id: child.data.id,
        name: child.data.name,
        kind: child.data.kind,
        nodeKind: child.data.nodeKind,
        filePath: child.data.filePath,
        x: child.x + offsetX,
        y: child.y + offsetY,
        r: child.r,
        depth: child.depth,
        value: child.value ?? 0,
        hasChildren: (child.data.children?.length ?? 0) > 0,
        metadata: child.data.metadata,
      });
    }

    return bubbles;
  }, [root, width, height, focusNode]);
}
