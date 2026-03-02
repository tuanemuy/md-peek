import { basename, normalize, resolve } from "node:path";
import { Hono } from "hono";
import type { ResolvedStyles } from "../config/styles.js";
import { renderMarkdown } from "../markdown/renderer.js";
import {
  DirectoryListPage,
  DirectoryViewPage,
  FilePreviewPage,
} from "../pages/index.js";
import type { FileTreeCache } from "../utils/file-tree-cache.js";
import { logger } from "../utils/logger.js";
import { isWithinBase } from "../utils/path.js";
import { readTextFile } from "../utils/read-text-file.js";

export function createDirectoryRoutes(
  dirPath: string,
  styles: ResolvedStyles,
  treeCache: FileTreeCache,
): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    const treeResult = await treeCache.get();
    if (!treeResult.ok) {
      logger.error("Failed to build file tree:", treeResult.error);
      return c.text("Internal server error", 500);
    }
    const title = basename(dirPath) || dirPath;
    return c.html(
      <DirectoryListPage
        title={title}
        tree={treeResult.value}
        styles={styles}
      />,
    );
  });

  app.get("/view", async (c) => {
    const relativePath = c.req.query("path");
    if (!relativePath) {
      return c.redirect("/");
    }

    const fullPath = resolve(dirPath, normalize(relativePath));
    if (!isWithinBase(dirPath, fullPath)) {
      return c.text("Forbidden", 403);
    }

    if (!relativePath.endsWith(".md")) {
      return c.text("Not found", 404);
    }

    const contentResult = await readTextFile(fullPath);
    if (!contentResult.ok) {
      if (contentResult.error.type === "file-not-found") {
        return c.text("File not found", 404);
      }
      logger.error("Failed to render file:", contentResult.error);
      return c.text("Internal server error", 500);
    }

    const treeResult = await treeCache.get();
    if (!treeResult.ok) {
      logger.error("Failed to build file tree:", treeResult.error);
      return c.text("Internal server error", 500);
    }

    const html = await renderMarkdown(contentResult.value);
    const dirTitle = basename(dirPath) || dirPath;
    const fileTitle = basename(relativePath);
    return c.html(
      <DirectoryViewPage
        dirTitle={dirTitle}
        fileTitle={fileTitle}
        htmlContent={html}
        tree={treeResult.value}
        currentPath={relativePath}
        styles={styles}
      />,
    );
  });

  app.get("/:path{.+}", async (c) => {
    const relativePath = c.req.param("path");
    const fullPath = resolve(dirPath, normalize(relativePath));
    if (!isWithinBase(dirPath, fullPath)) {
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
      logger.error("Failed to render file:", result.error);
      return c.text("Internal server error", 500);
    }

    const html = await renderMarkdown(result.value);
    const fileTitle = basename(relativePath);
    return c.html(
      <FilePreviewPage title={fileTitle} htmlContent={html} styles={styles} />,
    );
  });

  return app;
}
