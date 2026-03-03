import { useState } from "preact/hooks";
import { MarkdownContent } from "../components/layout/markdown-content.js";
import { useSseUpdates } from "./use-sse-updates.js";

type FileAppProps = {
  readonly content: string;
};

export function FileApp({ content: initialContent }: FileAppProps) {
  const [content, setContent] = useState(initialContent);

  useSseUpdates({ onContentUpdate: setContent });

  return (
    <main class="px-2 sm:px-5 py-5 sm:py-15">
      <div class="max-w-4xl mx-auto">
        <MarkdownContent htmlContent={content} />
      </div>
    </main>
  );
}
