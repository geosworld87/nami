import type { LanguageParser } from "./base.js";

export class ParserRegistry {
  private parsers = new Map<string, LanguageParser>();

  register(parser: LanguageParser): void {
    for (const ext of parser.extensions) {
      this.parsers.set(ext, parser);
    }
  }

  getParser(filePath: string): LanguageParser | undefined {
    const ext = filePath.slice(filePath.lastIndexOf("."));
    return this.parsers.get(ext);
  }

  getSupportedExtensions(): string[] {
    return Array.from(this.parsers.keys());
  }

  getLanguages(): string[] {
    const langs = new Set<string>();
    for (const parser of this.parsers.values()) {
      langs.add(parser.language);
    }
    return Array.from(langs);
  }
}
