---
paths:
  - "packages/web/**/*.{ts,tsx}"
---

# Web Package Rules

- Only type-import from @nami/core (graph model interfaces). Never runtime-import core.
- All data comes from the @nami/server API via fetch calls.
- Use Cytoscape.js for graph rendering — do not mix with D3 or other graph libraries.
- Cytoscape config (styles, layouts) goes in dedicated config files, not inline in components.
- React components should be functional with hooks.
- Use Tailwind CSS for styling.
