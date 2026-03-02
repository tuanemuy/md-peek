import { MainContent } from "../components/layout/main-content.js";
import { MarkdownContent } from "../components/layout/markdown-content.js";
import { PageHeader } from "../components/layout/page-header.js";
import { Sidebar } from "../components/navigation/sidebar.js";
import type { ResolvedStyles } from "../config/styles.js";
import { Document } from "../renderer/document.js";

import type { FileTreeNode } from "../utils/file-tree.js";

type DirectoryViewPageProps = {
  readonly dirTitle: string;
  readonly fileTitle: string;
  readonly htmlContent: string;
  readonly tree: readonly FileTreeNode[];
  readonly currentPath: string;
  readonly styles: ResolvedStyles;
};

export function DirectoryViewPage({
  dirTitle,
  fileTitle,
  htmlContent,
  tree,
  currentPath,
  styles,
}: DirectoryViewPageProps) {
  return (
    <Document title={fileTitle} styles={styles} mode="directory">
      <Sidebar title={dirTitle} tree={tree} currentPath={currentPath} />

      <PageHeader
        id="header-bar"
        breadcrumbs={[{ label: dirTitle, href: "/" }, { label: fileTitle }]}
        showSidebarToggle
        externalLinkHref={`/${currentPath}`}
      />

      <MainContent class="px-5 sm:px-10 py-5 sm:py-10">
        <div class="max-w-4xl mx-auto">
          <MarkdownContent htmlContent={htmlContent} />
        </div>
      </MainContent>
    </Document>
  );
}
