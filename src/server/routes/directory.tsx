import { basename, normalize, resolve } from "node:path";
import { Hono } from "hono";
import { MainContent } from "../../components/layout/main-content.js";
import { MarkdownContent } from "../../components/layout/markdown-content.js";
import { PageHeader } from "../../components/layout/page-header.js";
import { Sidebar } from "../../components/navigation/sidebar.js";
import type { FileTreeNode } from "../../core/file-tree.js";
import { isWithinBase } from "../../core/path.js";
import type { FileTreeCache } from "../../lib/file-tree-cache.js";
import { logger } from "../../lib/logger.js";
import { renderMarkdown } from "../../lib/markdown.js";
import { readTextFile } from "../../lib/read-text-file.js";
import type { ResolvedStyles } from "../../lib/styles.js";
import { Document, renderDocument } from "../renderer/document.js";

function findFirstFile(
  nodes: readonly FileTreeNode[],
): FileTreeNode | undefined {
  for (const node of nodes) {
    if (node.type === "file") return node;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return undefined;
}

function renderDirectoryView(params: {
  readonly dirTitle: string;
  readonly fileTitle: string;
  readonly currentPath: string;
  readonly html: string;
  readonly tree: readonly FileTreeNode[];
  readonly styles: ResolvedStyles;
}): string {
  const { dirTitle, fileTitle, currentPath, html, tree, styles } = params;
  return renderDocument(
    <Document
      title={fileTitle}
      styles={styles}
      initialState={{
        mode: "directory",
        dirTitle,
        currentPath,
        content: html,
        tree,
      }}
    >
      <Sidebar title={dirTitle} tree={tree} currentPath={currentPath} />
      <PageHeader
        id="header-bar"
        breadcrumbs={[{ label: dirTitle, href: "/" }, { label: fileTitle }]}
        showSidebarToggle
        externalLinkHref={`/${currentPath.split("/").map(encodeURIComponent).join("/")}`}
      />
      <MainContent class="px-5 sm:px-10 py-5 sm:py-10">
        <div class="max-w-4xl mx-auto">
          <MarkdownContent htmlContent={html} />
        </div>
      </MainContent>
    </Document>,
  );
}

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

    const firstFile = findFirstFile(treeResult.value);
    if (!firstFile) {
      return c.text("No markdown files found", 404);
    }

    const fullPath = resolve(dirPath, normalize(firstFile.path));
    const contentResult = await readTextFile(fullPath);
    if (!contentResult.ok) {
      logger.error("Failed to read file:", contentResult.error);
      return c.text("Internal server error", 500);
    }

    const html = await renderMarkdown(contentResult.value);
    const dirTitle = basename(dirPath) || dirPath;
    return c.html(
      renderDirectoryView({
        dirTitle,
        fileTitle: basename(firstFile.path),
        currentPath: firstFile.path,
        html,
        tree: treeResult.value,
        styles,
      }),
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
    return c.html(
      renderDirectoryView({
        dirTitle,
        fileTitle: basename(relativePath),
        currentPath: relativePath,
        html,
        tree: treeResult.value,
        styles,
      }),
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
      renderDocument(
        <Document
          title={fileTitle}
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
