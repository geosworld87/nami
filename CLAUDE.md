# Nami - Codebase Architecture Scanner

## Project overview
Nami is an Engineering Manager tool that scans codebases and produces interactive architectural graphs, blast radius analysis, test coverage metrics, and improvement suggestions. TypeScript full-stack monorepo.

## Commands
```bash
npm install                       # Install all dependencies
npm run build                     # Build all packages (turborepo)
npm test                          # Run all tests (vitest)
npm run dev                       # Dev mode (all packages)
npm test -w packages/core         # Test single package
npm run build -w packages/core    # Build single package
```

## Monorepo structure
- `packages/core/` — @nami/core: scanner, tree-sitter parsers, graph model, analyzers
- `packages/cli/` — @nami/cli: Commander.js CLI (scan, serve, blast, report)
- `packages/web/` — @nami/web: React + Cytoscape.js interactive graph UI
- `packages/server/` — @nami/server: Express API serving graph data
- `fixtures/` — Test fixture repos (Swift iOS, etc.)

Build order: core -> server + web (parallel) -> cli

## Code style
- IMPORTANT: Use ESM (`import`/`export`), never CommonJS (`require`)
- TypeScript strict mode, no `any` unless absolutely necessary
- Zod schemas for all data boundaries (graph JSON, API responses)
- Prefer `interface` over `type` for object shapes
- Name files in kebab-case: `blast-radius.ts`, not `blastRadius.ts`
- Name exports in PascalCase for classes/interfaces, camelCase for functions/variables

## Architecture rules
- The graph model (`packages/core/src/graph/model.ts`) is the central contract — all packages depend on it
- Parsers implement the `LanguageParser` interface — never add language-specific logic outside parser/
- Analyzers operate on `NamiGraph` only — they never import parsers or scanner directly
- Web UI consumes API responses, never imports @nami/core directly (only type imports)

## Testing
- Use vitest for all tests
- Test files: `__tests__/` directory alongside source, or `*.test.ts` co-located
- IMPORTANT: Run `npm test -w packages/core` after changing core, not the full suite
- For parser changes: test against known Swift/TS snippets, assert exact nodes/edges

## Graph model (key types)
- `NodeKind`: file, class, struct, enum, protocol, extension, function, property, module
- `EdgeKind`: imports, declares, inherits, conforms_to, calls, references, delegates_to, observes, publishes, subscribes, injects, contains, test_covers
- `NamiGraph`: { version, scannedAt, rootPath, nodes[], edges[], stats{} }

## Agent optimization
- Use haiku model for exploration and search tasks (fast, cheap)
- Use sonnet for code review and analysis (balanced)
- Use opus only for complex architecture decisions
- Delegate codebase exploration to subagents to preserve main context
- Run independent research tasks in parallel subagents
