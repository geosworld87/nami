---
paths:
  - "packages/core/**/*.ts"
---

# Core Package Rules

- Graph model types (GraphNode, GraphEdge, NamiGraph) are the central contract. Changes here affect ALL other packages.
- All data structures must have corresponding Zod schemas for runtime validation.
- Parsers must implement the LanguageParser interface from parser/base.ts.
- Analyzers must only operate on NamiGraph — never import from parser/ or scanner/.
- tree-sitter queries go in dedicated queries.ts files, not inline in parser code.
- Scanner must respect .gitignore patterns.
- Test parser changes against known code snippets with exact expected output.
