import { useRef, useState } from "preact/hooks";
import { MainContent } from "../components/layout/main-content.js";
import { MarkdownContent } from "../components/layout/markdown-content.js";
import { PageHeader } from "../components/layout/page-header.js";
import { Sidebar } from "../components/navigation/sidebar.js";
import type { FileTreeNode } from "../utils/file-tree.js";
import { getFileNameFromPath } from "./path-utils.js";
import { useNavigation } from "./use-navigation.js";
import { useSidebar } from "./use-sidebar.js";
import { useSseUpdates } from "./use-sse-updates.js";

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
  // Direct ref assignment — no sync effect needed (Preact has no concurrent rendering)
  currentPathRef.current = currentPath;

  const sidebar = useSidebar();

  useNavigation((path, html) => {
    currentPathRef.current = path;
    setCurrentPath(path);
    setContent(html);
  });

  useSseUpdates({
    getCurrentPath: () => currentPathRef.current,
    onContentUpdate: setContent,
    onTreeUpdate: setTree,
  });

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
