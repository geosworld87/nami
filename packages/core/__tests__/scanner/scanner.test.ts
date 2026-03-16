import { describe, it, expect } from "vitest";
import { scan } from "../../src/scanner/index.js";
import { ParserRegistry } from "../../src/parser/registry.js";
import type { LanguageParser, ParseResult } from "../../src/parser/base.js";
import type { GraphNode, GraphEdge } from "../../src/graph/model.js";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

class StubParser implements LanguageParser {
  readonly language = "swift";
  readonly extensions = [".swift"];
  parsedFiles: string[] = [];

  parseFile(filePath: string, content: string): ParseResult {
    this.parsedFiles.push(filePath);
    const node: GraphNode = {
      id: `${filePath}::File`,
      kind: "file",
      name: filePath,
      filePath,
      startLine: 0,
      endLine: content.split("\n").length,
      metadata: { linesOfCode: content.split("\n").length },
    };
    return { nodes: [node], edges: [] };
  }
}

function createFixture(): { dir: string; parser: StubParser } {
  const dir = mkdtempSync(join(tmpdir(), "nami-scan-"));
  mkdirSync(join(dir, "Sources"), { recursive: true });
  mkdirSync(join(dir, "node_modules", "pkg"), { recursive: true });
  writeFileSync(join(dir, "Sources", "App.swift"), "class App {}");
  writeFileSync(join(dir, "Sources", "Model.swift"), "struct User {}");
  writeFileSync(join(dir, "node_modules", "pkg", "index.swift"), "// ignored");
  writeFileSync(join(dir, "readme.txt"), "not a swift file");
  return { dir, parser: new StubParser() };
}

describe("scan", () => {
  it("scans swift files and skips non-matching", () => {
    const { dir, parser } = createFixture();
    const registry = new ParserRegistry();
    registry.register(parser);

    const graph = scan(dir, registry);

    expect(graph.version).toBe("1.0.0");
    expect(graph.stats.totalFiles).toBe(2);
    expect(graph.nodes).toHaveLength(2);
    expect(parser.parsedFiles.sort()).toEqual([
      "Sources/App.swift",
      "Sources/Model.swift",
    ]);
  });

  it("ignores node_modules", () => {
    const { dir, parser } = createFixture();
    const registry = new ParserRegistry();
    registry.register(parser);

    scan(dir, registry);

    expect(parser.parsedFiles).not.toContain(
      expect.stringContaining("node_modules"),
    );
  });

  it("calls onFile callback", () => {
    const { dir, parser } = createFixture();
    const registry = new ParserRegistry();
    registry.register(parser);
    const files: string[] = [];

    scan(dir, registry, { onFile: (f) => files.push(f) });

    expect(files).toHaveLength(2);
  });

  it("tracks language breakdown", () => {
    const { dir, parser } = createFixture();
    const registry = new ParserRegistry();
    registry.register(parser);

    const graph = scan(dir, registry);

    expect(graph.stats.languageBreakdown).toEqual({ swift: 2 });
  });
});
