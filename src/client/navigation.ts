import { safeSync } from "../types/result.ts";
import { logger } from "../utils/logger.ts";
import { applyBreadcrumb, fetchBreadcrumb } from "./update-breadcrumb.ts";
import { applyContent, fetchContent } from "./update-content.ts";
import { applyTree, fetchTree } from "./update-tree.ts";

function getFileNameFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

let currentNavController: AbortController | null = null;

async function navigateToFile(path: string, pushState: boolean): Promise<void> {
  if (currentNavController) currentNavController.abort();
  currentNavController = new AbortController();
  const { signal } = currentNavController;

  const [contentHtml, treeHtml, breadcrumbHtml] = await Promise.all([
    fetchContent(path, { signal }),
    fetchTree(path, { signal }),
    fetchBreadcrumb(path, { signal }),
  ]);

  if (contentHtml === null || treeHtml === null || breadcrumbHtml === null) {
    logger.error("Failed to fetch one or more resources during navigation");
    return;
  }

  applyContent(contentHtml);
  applyTree(treeHtml);
  applyBreadcrumb(breadcrumbHtml);

  document.title = `${getFileNameFromPath(path)} - peek`;

  const newUrl = `/view?path=${encodeURIComponent(path)}`;
  if (pushState) {
    history.pushState({ path }, "", newUrl);
  }
}

export function initNavigation(): void {
  if (!document.getElementById("sidebar")) return;

  const initialPath = new URLSearchParams(window.location.search).get("path");
  if (initialPath) {
    history.replaceState({ path: initialPath }, "");
  }

  document.addEventListener("click", (e: MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    const link = (e.target as Element).closest(
      "a[href]",
    ) as HTMLAnchorElement | null;
    if (!link) return;

    const urlResult = safeSync(
      () => new URL(link.href, window.location.origin),
      () => null,
    );
    if (!urlResult.ok) return;
    const url = urlResult.value;

    if (url.pathname !== "/view") return;
    const path = url.searchParams.get("path");
    if (!path) return;

    e.preventDefault();
    navigateToFile(path, true).catch((e: unknown) => {
      if (e instanceof DOMException && e.name === "AbortError") return;
      logger.error("Failed to navigate:", e);
    });
  });

  window.addEventListener("popstate", (e: PopStateEvent) => {
    const state = e.state as { path?: string } | null;
    const path =
      state?.path ?? new URLSearchParams(window.location.search).get("path");
    if (path) {
      navigateToFile(path, false).catch((e: unknown) =>
        logger.error("Failed to navigate:", e),
      );
    } else {
      window.location.reload();
    }
  });
}
