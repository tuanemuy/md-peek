import { normalize, resolve } from "node:path";
import { Hono } from "hono";
import { renderMarkdown } from "../markdown/renderer.js";
import type { FileTreeCache } from "../utils/file-tree-cache.js";
import { logger } from "../utils/logger.js";
import { isWithinBase } from "../utils/path.js";
import { readTextFile } from "../utils/read-text-file.js";

type FileApiConfig = {
  readonly mode: "file";
  readonly targetPath: string;
};

type DirectoryApiConfig = {
  readonly mode: "directory";
  readonly targetPath: string;
  readonly treeCache: FileTreeCache;
};

export type ApiConfig = FileApiConfig | DirectoryApiConfig;

export function createApiRoutes(config: ApiConfig): Hono {
  const app = new Hono();

  app.get("/api/content", async (c) => {
    if (config.mode === "file") {
      const result = await readTextFile(config.targetPath);
      if (!result.ok) {
        logger.error("Failed to read file:", result.error);
        return c.text("Failed to read file", 500);
      }
      return c.html(await renderMarkdown(result.value));
    }

    const relativePath = c.req.query("path");
    if (!relativePath) {
      return c.text("Missing path parameter", 400);
    }

    const fullPath = resolve(config.targetPath, normalize(relativePath));
    if (!isWithinBase(config.targetPath, fullPath)) {
      return c.text("Forbidden", 403);
    }

    if (!relativePath.endsWith(".md")) {
      return c.text("Not found", 404);
    }

    const result = await readTextFile(fullPath);
    if (!result.ok) {
      if (result.error.type === "file-not-found") {
        return c.text("File not found", 404);
      }
      logger.error("Failed to read file:", result.error);
      return c.text("Failed to read file", 500);
    }
    return c.html(await renderMarkdown(result.value));
  });

  app.get("/api/tree", async (c) => {
    if (config.mode === "file") {
      return c.json([]);
    }

    const result = await config.treeCache.get();
    if (!result.ok) {
      logger.error("Failed to read directory tree:", result.error);
      return c.text("Failed to read directory", 500);
    }
    return c.json(result.value);
  });

  return app;
}
