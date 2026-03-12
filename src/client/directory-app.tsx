import { useRef, useState } from "preact/hooks";
import { MainContent } from "../components/layout/main-content.js";
import { MarkdownContent } from "../components/layout/markdown-content.js";
import { PageHeader } from "../components/layout/page-header.js";
import { Sidebar } from "../components/navigation/sidebar.js";
import type { ContentType } from "../core/content-type.js";
import { getContentType } from "../core/content-type.js";
import type { FileTreeNode } from "../core/file-tree.js";
import { useNavigation } from "./hooks/use-navigation.js";
import { useSidebar } from "./hooks/use-sidebar.js";
import { useSseUpdates } from "./hooks/use-sse-updates.js";
import { getFileNameFromPath } from "./lib/path-utils.js";

type DirectoryAppProps = {
  readonly dirTitle: string;
  readonly currentPath: string;
  readonly contentType: ContentType;
  readonly content: string;
  readonly tree: readonly FileTreeNode[];
};

export function DirectoryApp({
  dirTitle,
  currentPath: initialPath,
  contentType: initialContentType,
  content: initialContent,
  tree: initialTree,
}: DirectoryAppProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [contentType, setContentType] =
    useState<ContentType>(initialContentType);
  const [content, setContent] = useState(initialContent);
  const [tree, setTree] = useState(initialTree);
  const [htmlReloadKey, setHtmlReloadKey] = useState(0);
  const currentPathRef = useRef(currentPath);
  // Direct ref assignment — no sync effect needed (Preact has no concurrent rendering)
  currentPathRef.current = currentPath;

  const sidebar = useSidebar();

  useNavigation((path, html) => {
    currentPathRef.current = path;
    setCurrentPath(path);
    setContentType(getContentType(path) ?? "markdown");
    setContent(html);
    setHtmlReloadKey(0);
  });

  useSseUpdates({
    getCurrentPath: () => currentPathRef.current,
    onContentUpdate: (html) => {
      const ct = getContentType(currentPathRef.current);
      if (ct === "html") {
        setHtmlReloadKey((k) => k + 1);
      } else {
        setContent(html);
      }
    },
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

      {contentType === "html" ? (
        <MainContent>
          <iframe
            key={htmlReloadKey}
            title={fileTitle}
            src={`/api/raw?path=${encodeURIComponent(currentPath)}`}
            style="border:none;width:100%;height:100%;position:absolute;top:0;left:0"
          />
        </MainContent>
      ) : (
        <MainContent class="px-5 sm:px-10 py-5 sm:py-10">
          <div class="max-w-4xl mx-auto">
            <MarkdownContent htmlContent={content} />
          </div>
        </MainContent>
      )}
    </>
  );
}
