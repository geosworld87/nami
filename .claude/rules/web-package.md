---
paths:
  - "packages/web/**/*.{ts,tsx}"
---

# Web Package Rules

- Only type-import from @nami/core (graph model interfaces). Never runtime-import core.
- All data comes from the @nami/server API via fetch calls.
- Use D3 circle-pack (`d3-hierarchy`, `d3-zoom`) for bubble visualization — do not use Cytoscape or other graph libraries.
- React renders SVG; D3 only computes layout (no DOM manipulation by D3).
- SVG filters (glow, gradients) defined in `BubbleView.tsx` `<defs>`.
- Semantic zoom: 3 discrete levels (modules → files → entities) via `useSemanticZoom` hook.
- React components should be functional with hooks.
- Use CSS classes from `BubbleView.css` + inline styles. Glass morphism via `.nami-glass` class.
