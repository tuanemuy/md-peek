import type { ContentType } from "../core/content-type.js";
import { FULLSCREEN_IFRAME_STYLE } from "../core/iframe-style.js";
import { MainContent } from "./layout/main-content.js";
import { MarkdownContent } from "./layout/markdown-content.js";

type ContentViewProps = {
  readonly contentType: ContentType;
  readonly fileTitle: string;
  readonly rawUrl: string;
  readonly htmlContent: string;
  readonly htmlReloadKey?: number;
  readonly markdownClass?: string;
};

export function ContentView({
  contentType,
  fileTitle,
  rawUrl,
  htmlContent,
  htmlReloadKey,
  markdownClass = "px-5 sm:px-10 py-5 sm:py-10",
}: ContentViewProps) {
  if (contentType === "html") {
    return (
      <MainContent class="relative flex-1 overflow-hidden">
        <iframe
          key={htmlReloadKey}
          title={fileTitle}
          src={rawUrl}
          style={FULLSCREEN_IFRAME_STYLE}
        />
      </MainContent>
    );
  }
  return (
    <MainContent class={markdownClass}>
      <div class="max-w-4xl mx-auto">
        <MarkdownContent htmlContent={htmlContent} />
      </div>
    </MainContent>
  );
}
