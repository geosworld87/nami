import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_IGNORES = [
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "dist",
  "build",
  ".build",
  "DerivedData",
  "Pods",
  ".turbo",
  "__pycache__",
  ".DS_Store",
];

export class FileFilter {
  private patterns: string[];

  constructor(repoRoot: string) {
    this.patterns = [...DEFAULT_IGNORES];
    const gitignorePath = join(repoRoot, ".gitignore");
    if (existsSync(gitignorePath)) {
      const content = readFileSync(gitignorePath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          this.patterns.push(trimmed);
        }
      }
    }
  }

  shouldIgnore(relativePath: string): boolean {
    const parts = relativePath.split("/");
    for (const pattern of this.patterns) {
      const cleanPattern = pattern.replace(/\/$/, "");
      for (const part of parts) {
        if (part === cleanPattern) return true;
      }
    }
    return false;
  }
}
