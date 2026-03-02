import { basename } from "node:path";
import { Hono } from "hono";
import type { ResolvedStyles } from "../config/styles.js";
import { renderMarkdown } from "../markdown/renderer.js";
import { FilePreviewPage } from "../pages/index.js";
import { logger } from "../utils/logger.js";
import { readMarkdownFile } from "../utils/read-markdown.js";

export function createFileRoutes(
  filePath: string,
  styles: ResolvedStyles,
): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    const result = await readMarkdownFile(filePath);
    if (!result.ok) {
      logger.error("Failed to read file:", result.error);
      return c.text("Failed to read file", 500);
    }
    const html = renderMarkdown(result.value);
    const title = basename(filePath);
    return c.html(
      <FilePreviewPage title={title} htmlContent={html} styles={styles} />,
    );
  });

  return app;
}
