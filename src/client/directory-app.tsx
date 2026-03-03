import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { MainContent } from "../components/layout/main-content.js";
import { MarkdownContent } from "../components/layout/markdown-content.js";
import { PageHeader } from "../components/layout/page-header.js";
import { Sidebar } from "../components/navigation/sidebar.js";
import type { FileTreeNode } from "../utils/file-tree.js";
import { fetchContent, fetchTree } from "./api-client.js";
import { getFileNameFromPath, normalizePath } from "./path-utils.js";
import { createSseConnection } from "./sse.js";
import { useSidebar } from "./use-sidebar.js";

type DirectoryAppProps = {
  readonly dirTitle: string;
  readonly currentPath: string;
  readonly content: string;
  readonly tree: readonly FileTreeNode[];
};

export function DirectoryApp({
  dirTitle,
  currentPath: initialPath,
  content: initialContent,
  tree: initialTree,
}: DirectoryAppProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [content, setContent] = useState(initialContent);
  const [tree, setTree] = useState(initialTree);
  const currentPathRef = useRef(currentPath);
  const navControllerRef = useRef<AbortController | null>(null);
  const sidebar = useSidebar();

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  const navigateToFile = useCallback(
    async (path: string, pushState: boolean) => {
      if (navControllerRef.current) navControllerRef.current.abort();
      const controller = new AbortController();
      navControllerRef.current = controller;

      try {
        const html = await fetchContent(path, { signal: controller.signal });

        if (html === null) return;
        setCurrentPath(path);
        setContent(html);
        document.title = `${getFileNameFromPath(path)} - peek`;
        const newUrl = `/view?path=${encodeURIComponent(path)}`;
        if (pushState) {
          history.pushState({ path }, "", newUrl);
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("[peek] Failed to navigate:", e);
      }
    },
    [],
  );

  // Link click interception
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const link = (e.target as Element).closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!link) return;

      let url: URL;
      try {
        url = new URL(link.href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname !== "/view") return;
      const path = url.searchParams.get("path");
      if (!path) return;

      e.preventDefault();
      navigateToFile(path, true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [navigateToFile]);

  // Set initial history state (one-time)
  useEffect(() => {
    const initialPathFromUrl = new URLSearchParams(window.location.search).get(
      "path",
    );
    if (initialPathFromUrl) {
      history.replaceState({ path: initialPathFromUrl }, "");
    }
  }, []);

  // Browser back/forward
  useEffect(() => {
    function handlePopstate(e: PopStateEvent) {
      const state = e.state as { path?: string } | null;
      const path =
        state?.path ?? new URLSearchParams(window.location.search).get("path");
      if (path) {
        navigateToFile(path, false);
      } else {
        window.location.reload();
      }
    }

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, [navigateToFile]);

  // SSE connection
  useEffect(() => {
    const cleanup = createSseConnection({
      onFileChanged: (changedPath) => {
        const current = currentPathRef.current;
        if (
          changedPath === null ||
          normalizePath(changedPath) === normalizePath(current)
        ) {
          fetchContent(current).then((html) => {
            if (html !== null) setContent(html);
          });
        }
      },
      onTreeChanged: () => {
        fetchTree().then((treeData) => {
          if (treeData) setTree(treeData);
        });
      },
    });

    return cleanup;
  }, []);

  const fileTitle = getFileNameFromPath(currentPath);
  return (
    <>
      <Sidebar
        title={dirTitle}
        tree={tree}
        currentPath={currentPath}
        onClose={sidebar.close}
      />

      <PageHeader
        id="header-bar"
        breadcrumbs={[{ label: dirTitle, href: "/" }, { label: fileTitle }]}
        showSidebarToggle
        onToggleSidebar={sidebar.toggle}
        externalLinkHref={`/${currentPath.split("/").map(encodeURIComponent).join("/")}`}
      />

      <MainContent class="px-5 sm:px-10 py-5 sm:py-10">
        <div class="max-w-4xl mx-auto">
          <MarkdownContent htmlContent={content} />
        </div>
      </MainContent>
    </>
  );
}
