import type { SizeMetric } from "../types/bubble.js";

/**
 * Compute the numeric size value for a leaf node.
 * Used as the `value` in d3-hierarchy so pack layout sizes bubbles proportionally.
 *
 * - "loc" mode: lines of code (fallback to methods+props, fallback to 1)
 * - "methods" mode: methodCount + propertyCount (fallback to loc, fallback to 1)
 */
export function computeSize(
  metadata: Record<string, unknown>,
  metric: SizeMetric = "loc",
): number {
  const loc = typeof metadata.linesOfCode === "number" ? metadata.linesOfCode : 0;
  const methods = typeof metadata.methodCount === "number" ? metadata.methodCount : 0;
  const props = typeof metadata.propertyCount === "number" ? metadata.propertyCount : 0;

  if (metric === "loc") {
    if (loc > 0) return loc;
    if (methods + props > 0) return methods + props;
    return 1;
  }

  // methods mode
  if (methods + props > 0) return methods + props;
  if (loc > 0) return loc;
  return 1;
}
