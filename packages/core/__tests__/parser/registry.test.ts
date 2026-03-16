import { describe, it, expect } from "vitest";
import { ParserRegistry } from "../../src/parser/registry.js";
import type { LanguageParser, ParseResult } from "../../src/parser/base.js";

class MockParser implements LanguageParser {
  readonly language: string;
  readonly extensions: string[];

  constructor(language: string, extensions: string[]) {
    this.language = language;
    this.extensions = extensions;
  }

  parseFile(): ParseResult {
    return { nodes: [], edges: [] };
  }
}

describe("ParserRegistry", () => {
  it("registers and retrieves a parser by extension", () => {
    const registry = new ParserRegistry();
    const swift = new MockParser("swift", [".swift"]);
    registry.register(swift);
    expect(registry.getParser("Foo.swift")).toBe(swift);
  });

  it("returns undefined for unknown extension", () => {
    const registry = new ParserRegistry();
    expect(registry.getParser("foo.rb")).toBeUndefined();
  });

  it("handles multiple extensions", () => {
    const registry = new ParserRegistry();
    const ts = new MockParser("typescript", [".ts", ".tsx"]);
    registry.register(ts);
    expect(registry.getParser("app.ts")).toBe(ts);
    expect(registry.getParser("App.tsx")).toBe(ts);
  });

  it("lists supported extensions", () => {
    const registry = new ParserRegistry();
    registry.register(new MockParser("swift", [".swift"]));
    registry.register(new MockParser("typescript", [".ts", ".tsx"]));
    expect(registry.getSupportedExtensions().sort()).toEqual([".swift", ".ts", ".tsx"]);
  });

  it("lists unique languages", () => {
    const registry = new ParserRegistry();
    registry.register(new MockParser("swift", [".swift"]));
    registry.register(new MockParser("typescript", [".ts", ".tsx"]));
    expect(registry.getLanguages().sort()).toEqual(["swift", "typescript"]);
  });
});
