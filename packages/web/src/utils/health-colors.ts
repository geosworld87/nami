/**
 * Maps a health score (0-100) to a color along the gradient:
 * CC0000 (critical) → FFB347 (warning) → 90EE90 (ok) → 50C878 (healthy)
 */
export function healthScoreColor(score: number): string {
  const s = Math.max(0, Math.min(100, score));

  if (s < 40) {
    // CC0000 → FFB347 (0-40)
    const t = s / 40;
    return interpolateHex("#CC0000", "#FFB347", t);
  }
  if (s < 70) {
    // FFB347 → 90EE90 (40-70)
    const t = (s - 40) / 30;
    return interpolateHex("#FFB347", "#90EE90", t);
  }
  // 90EE90 → 50C878 (70-100)
  const t = (s - 70) / 30;
  return interpolateHex("#90EE90", "#50C878", t);
}

function interpolateHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `#${hex(r)}${hex(g)}${hex(bl)}`;
}

function parseHex(color: string): [number, number, number] {
  const c = color.replace("#", "");
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

function hex(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
}
