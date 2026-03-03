#!/usr/bin/env node
import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { platform } from "node:os";
import { resolve } from "node:path";
import { cancel, intro, log, outro, spinner } from "@clack/prompts";
import { cli, define } from "gunshi";
import pc from "picocolors";
import { logger } from "./lib/logger.js";
import { initMarkdown } from "./lib/markdown.js";
import { isNodeError } from "./lib/node-error.js";
import { resolveStyles } from "./lib/styles.js";
import { startServer } from "./server/index.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const command = define({
  name: "peek",
  description: "Preview Markdown files in the browser",
  args: {
    path: {
      type: "positional",
      description: "File or directory path to preview",
    },
    port: {
      type: "number",
      short: "p",
      default: 3000,
      description: "Server port",
    },
    host: {
      type: "string",
      short: "H",
      default: "localhost",
      description: "Bind hostname (use 0.0.0.0 for external access)",
    },
    css: {
      type: "string",
      short: "c",
      description: "Custom CSS file path",
    },
    open: {
      type: "boolean",
      default: true,
      negatable: true,
      description: "Open browser automatically",
    },
  },
  examples: `$ peek README.md
$ peek docs/
$ peek . --port 8080
$ peek README.md --css ./custom.css --no-open`,
  run: async (ctx) => {
    const { path: targetArg, port, host: hostname, css, open } = ctx.values;

    intro(pc.bgCyan(pc.black(" peek ")));

    const targetPath = targetArg || ".";
    const fullPath = resolve(targetPath);

    const pathStat = await stat(fullPath).catch((e: unknown) => {
      logger.error("Failed to stat path:", e);
      cancel(`Path not found: ${fullPath}`);
      return process.exit(1);
    });

    const mode = pathStat.isDirectory() ? "directory" : "file";

    if (mode === "file" && !fullPath.endsWith(".md")) {
      cancel("Only Markdown files (.md) are supported");
      process.exit(1);
    }

    if (
      Number.isNaN(port) ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      cancel(`Invalid port number: ${port}`);
      process.exit(1);
    }

    const s = spinner();
    s.start("Initializing...");

    await initMarkdown().catch((e: unknown) => {
      logger.error("Failed to initialize Markdown renderer:", e);
      s.stop("Failed to initialize");
      cancel("Failed to initialize Markdown renderer");
      return process.exit(1);
    });

    const stylesResult = await resolveStyles(css);
    if (!stylesResult.ok) {
      s.stop("Failed to resolve styles");
      const message =
        stylesResult.error.type === "file-not-found"
          ? `CSS file not found: ${stylesResult.error.path}`
          : `Failed to read CSS file: ${stylesResult.error.path}`;
      cancel(message);
      process.exit(1);
    }
    const styles = stylesResult.value;

    const server = await startServer({
      targetPath: fullPath,
      mode,
      port,
      hostname,
      styles,
    }).catch((e: unknown) => {
      s.stop("Failed to start server");
      const message =
        isNodeError(e) && e.code === "EADDRINUSE"
          ? `Port ${port} is already in use`
          : "Failed to start server";
      cancel(message);
      return process.exit(1);
    });

    s.stop("Server started");

    const url = `http://${hostname}:${port}`;
    log.info(`${pc.green("Preview:")} ${pc.cyan(pc.underline(url))}`);
    log.info(`${pc.dim(`Mode: ${mode} | Path: ${fullPath}`)}`);

    if (open) {
      openBrowser(url);
    }

    outro(pc.dim("Press Ctrl+C to stop"));

    let shuttingDown = false;
    const shutdown = async () => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log();
      intro(pc.bgYellow(pc.black(" Shutting down... ")));
      await server.shutdown();
      outro(pc.green("Server stopped. Bye!"));
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  },
});

function openBrowser(url: string): void {
  const os = platform();
  let cmd: string;
  let args: string[];
  if (os === "darwin") {
    cmd = "open";
    args = [url];
  } else if (os === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }
  execFile(cmd, args, (err) => {
    if (err) {
      logger.error(`Failed to open browser: ${err.message}`);
    }
  });
}

await cli(process.argv.slice(2), command, {
  name: "peek",
  version: pkg.version,
  description: "Preview Markdown files in the browser",
});
