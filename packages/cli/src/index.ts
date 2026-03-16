#!/usr/bin/env node
import { Command } from "commander";
import { VERSION } from "@nami/core";
import { scanCommand } from "./commands/scan.js";
import { serveCommand } from "./commands/serve.js";
import { blastCommand } from "./commands/blast.js";
import { reportCommand } from "./commands/report.js";

const program = new Command();

program
  .name("nami")
  .description("Codebase architecture scanner for Engineering Managers")
  .version(VERSION);

program
  .command("scan")
  .argument("<path>", "Path to the repository to scan")
  .option("-o, --output <file>", "Output graph JSON file", "nami-graph.json")
  .option("-v, --verbose", "Verbose output")
  .description("Scan a repository and produce an architecture graph")
  .action(scanCommand);

program
  .command("serve")
  .option("-p, --port <number>", "Port number", "3000")
  .option("-g, --graph <file>", "Path to graph JSON file", "nami-graph.json")
  .description("Start the web UI to explore the architecture graph")
  .action(serveCommand);

program
  .command("blast")
  .argument("<entity>", "Entity name or ID to analyze")
  .option("-g, --graph <file>", "Path to graph JSON file", "nami-graph.json")
  .option("-d, --depth <number>", "Maximum traversal depth")
  .description("Show the blast radius for an entity")
  .action(blastCommand);

program
  .command("report")
  .option("-g, --graph <file>", "Path to graph JSON file", "nami-graph.json")
  .description("Generate a summary report of the architecture")
  .action(reportCommand);

program.parse();
