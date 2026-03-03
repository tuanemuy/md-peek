import { basename } from "node:path";
import { Hono } from "hono";
import { MarkdownContent } from "../components/layout/markdown-content.js";
import type { ResolvedStyles } from "../config/styles.js";
import { renderMarkdown } from "../markdown/renderer.js";
import { Document, renderDocument } from "../renderer/document.js";
import { logger } from "../utils/logger.js";
import { readTextFile } from "../utils/read-text-file.js";

export function createFileRoutes(
  filePath: string,
  styles: ResolvedStyles,
): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    const result = await readTextFile(filePath);
    if (!result.ok) {
      logger.error("Failed to read file:", result.error);
      return c.text("Failed to read file", 500);
    }
    const html = await renderMarkdown(result.value);
    const title = basename(filePath);
    return c.html(
      renderDocument(
        <Document
          title={title}
          styles={styles}
          initialState={{ mode: "file", content: html }}
        >
          <main class="px-2 sm:px-5 py-5 sm:py-15">
            <div class="max-w-4xl mx-auto">
              <MarkdownContent htmlContent={html} />
            </div>
          </main>
        </Document>,
      ),
    );
  });

  return app;
}
