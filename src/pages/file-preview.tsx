import { MarkdownContent } from "../components/layout/markdown-content.js";
import type { ResolvedStyles } from "../config/styles.js";
import { Document } from "../renderer/document.js";

type FilePreviewPageProps = {
  readonly title: string;
  readonly htmlContent: string;
  readonly styles: ResolvedStyles;
};

export function FilePreviewPage({
  title,
  htmlContent,
  styles,
}: FilePreviewPageProps) {
  return (
    <Document title={title} styles={styles} mode="file">
      <main class="px-2 sm:px-5 py-5 sm:py-15">
        <div class="max-w-4xl mx-auto">
          <MarkdownContent htmlContent={htmlContent} />
        </div>
      </main>
    </Document>
  );
}
