import { basename, normalize, resolve } from "node:path";
import { Hono } from "hono";
import { MainContent } from "../../components/layout/main-content.js";
import { MarkdownContent } from "../../components/layout/markdown-content.js";
import { PageHeader } from "../../components/layout/page-header.js";
import { Sidebar } from "../../components/navigation/sidebar.js";
import type { ContentType } from "../../core/content-type.js";
import { getContentType } from "../../core/content-type.js";
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
  readonly contentType: ContentType;
  readonly html: string;
  readonly tree: readonly FileTreeNode[];
  readonly styles: ResolvedStyles;
}): string {
  const { dirTitle, fileTitle, currentPath, contentType, html, tree, styles } =
    params;
  return renderDocument(
    <Document
      title={fileTitle}
      styles={styles}
      initialState={{
        mode: "directory",
        dirTitle,
        currentPath,
        contentType,
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
      {contentType === "html" ? (
        <MainContent>
          <iframe
            title={fileTitle}
            src={`/api/raw?path=${encodeURIComponent(currentPath)}`}
            style="border:none;width:100%;height:100%;position:absolute;top:0;left:0"
          />
        </MainContent>
      ) : (
        <MainContent class="px-5 sm:px-10 py-5 sm:py-10">
          <div class="max-w-4xl mx-auto">
            <MarkdownContent htmlContent={html} />
          </div>
        </MainContent>
      )}
    </Document>,
  );
}

async function renderFileContent(
  fullPath: string,
  contentType: ContentType,
): Promise<
  { ok: true; html: string } | { ok: false; status: number; message: string }
> {
  const result = await readTextFile(fullPath);
  if (!result.ok) {
    if (result.error.type === "file-not-found") {
      return { ok: false, status: 404, message: "File not found" };
    }
    logger.error("Failed to read file:", result.error);
    return { ok: false, status: 500, message: "Internal server error" };
  }

  if (contentType === "html") {
    return { ok: true, html: "" };
  }
  return { ok: true, html: await renderMarkdown(result.value) };
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
      return c.text("No supported files found", 404);
    }

    const contentType = getContentType(firstFile.path) ?? "markdown";
    const fullPath = resolve(dirPath, normalize(firstFile.path));
    const rendered = await renderFileContent(fullPath, contentType);
    if (!rendered.ok) {
      return c.text(rendered.message, rendered.status as 404 | 500);
    }

    const dirTitle = basename(dirPath) || dirPath;
    return c.html(
      renderDirectoryView({
        dirTitle,
        fileTitle: basename(firstFile.path),
        currentPath: firstFile.path,
        contentType,
        html: rendered.html,
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

    const contentType = getContentType(relativePath);
    if (!contentType) {
      return c.text("Not found", 404);
    }

    const rendered = await renderFileContent(fullPath, contentType);
    if (!rendered.ok) {
      return c.text(rendered.message, rendered.status as 404 | 500);
    }

    const treeResult = await treeCache.get();
    if (!treeResult.ok) {
      logger.error("Failed to build file tree:", treeResult.error);
      return c.text("Internal server error", 500);
    }

    const dirTitle = basename(dirPath) || dirPath;
    return c.html(
      renderDirectoryView({
        dirTitle,
        fileTitle: basename(relativePath),
        currentPath: relativePath,
        contentType,
        html: rendered.html,
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

    const contentType = getContentType(relativePath);
    if (!contentType) {
      return c.text("Not found", 404);
    }

    const rendered = await renderFileContent(fullPath, contentType);
    if (!rendered.ok) {
      return c.text(rendered.message, rendered.status as 404 | 500);
    }

    const fileTitle = basename(relativePath);
    return c.html(
      renderDocument(
        <Document
          title={fileTitle}
          styles={styles}
          initialState={{ mode: "file", content: rendered.html }}
        >
          {contentType === "html" ? (
            <main>
              <iframe
                title={fileTitle}
                src={`/api/raw?path=${encodeURIComponent(relativePath)}`}
                style="border:none;width:100%;height:100%;position:absolute;top:0;left:0"
              />
            </main>
          ) : (
            <main class="px-2 sm:px-5 py-5 sm:py-15">
              <div class="max-w-4xl mx-auto">
                <MarkdownContent htmlContent={rendered.html} />
              </div>
            </main>
          )}
        </Document>,
      ),
    );
  });

  return app;
}
