import { describe, it, expect } from "vitest";
import { FileFilter } from "../../src/scanner/file-filter.js";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("FileFilter", () => {
  it("ignores node_modules by default", () => {
    const dir = mkdtempSync(join(tmpdir(), "nami-test-"));
    const filter = new FileFilter(dir);
    expect(filter.shouldIgnore("node_modules/foo/bar.js")).toBe(true);
  });

  it("ignores .git by default", () => {
    const dir = mkdtempSync(join(tmpdir(), "nami-test-"));
    const filter = new FileFilter(dir);
    expect(filter.shouldIgnore(".git/config")).toBe(true);
  });

  it("allows normal paths", () => {
    const dir = mkdtempSync(join(tmpdir(), "nami-test-"));
    const filter = new FileFilter(dir);
    expect(filter.shouldIgnore("Sources/Models/User.swift")).toBe(false);
  });

  it("reads .gitignore patterns", () => {
    const dir = mkdtempSync(join(tmpdir(), "nami-test-"));
    writeFileSync(join(dir, ".gitignore"), "*.log\nbuild\n# comment\n");
    const filter = new FileFilter(dir);
    expect(filter.shouldIgnore("build/output.js")).toBe(true);
  });

  it("ignores DerivedData (Xcode)", () => {
    const dir = mkdtempSync(join(tmpdir(), "nami-test-"));
    const filter = new FileFilter(dir);
    expect(filter.shouldIgnore("DerivedData/foo/bar")).toBe(true);
  });
});
