/** Color palette for node kinds — matches existing Nami theme */
export const KIND_COLORS: Record<string, string> = {
  class: "#4A90D9",
  struct: "#50C878",
  enum: "#FFB347",
  protocol: "#7B68EE",
  extension: "#DDA0DD",
  function: "#87CEEB",
  property: "#D3D3D3",
  file: "#8899AA",
  module: "#FF6B6B",
};

/** Glow color is the same as the kind color but used in SVG filters */
export const KIND_GLOW: Record<string, string> = {
  class: "#4A90D9",
  struct: "#50C878",
  enum: "#FFB347",
  protocol: "#7B68EE",
  extension: "#DDA0DD",
  function: "#87CEEB",
  file: "#8899AA",
  module: "#FF6B6B",
};

/** For module-level bubbles, pick a color from the dominant kind inside */
export function moduleColor(dominantKind: string | undefined): string {
  if (dominantKind && KIND_COLORS[dominantKind]) return KIND_COLORS[dominantKind];
  return KIND_COLORS.module;
}

/** Color for a bubble based on its hierarchy kind + original nodeKind */
export function bubbleColor(
  kind: "root" | "module" | "file" | "entity",
  nodeKind?: string,
): string {
  if (kind === "entity" && nodeKind) return KIND_COLORS[nodeKind] ?? "#888";
  if (kind === "file") return KIND_COLORS.file;
  if (kind === "module") return KIND_COLORS.module;
  return "#666";
}

/** Gradient stop colors: lighter center, color at edge */
export function gradientStops(color: string): [string, string] {
  return [`${color}18`, `${color}60`];
}
