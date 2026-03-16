---
paths:
  - "**/__tests__/**/*.ts"
  - "**/*.test.ts"
---

# Testing Rules

- Use vitest (not jest, not mocha).
- Use `describe`/`it` blocks with descriptive names.
- Parser tests: provide a known code snippet string, parse it, assert exact nodes and edges.
- Analyzer tests: construct a NamiGraph by hand (not by parsing), test the algorithm.
- Integration tests: use the fixtures/ directory.
- Prefer `toEqual` for deep comparison, `toBe` for primitives.
- No mocking of tree-sitter — use real parsing of test snippets.
