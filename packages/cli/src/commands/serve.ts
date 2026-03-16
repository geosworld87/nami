import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { startServer } from "@nami/server";

interface ServeOptions {
  port: string;
  graph: string;
}

export function serveCommand(options: ServeOptions): void {
  const graphPath = resolve(options.graph);
  if (!existsSync(graphPath)) {
    console.error(`Error: Graph file not found: ${graphPath}`);
    console.error(`Run 'nami scan' first to generate the graph.`);
    process.exit(1);
  }

  // Find the web UI dist directory (built by @nami/web)
  // Navigate from cli dist to web dist
  const cliDir = dirname(fileURLToPath(import.meta.url));
  const webDistDir = resolve(cliDir, "../../../web/dist");

  const port = parseInt(options.port, 10);

  startServer({
    graphPath,
    port,
    staticDir: existsSync(webDistDir) ? webDistDir : undefined,
  });
}
