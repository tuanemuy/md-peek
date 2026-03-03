import { useEffect, useState } from "preact/hooks";
import { MarkdownContent } from "../components/layout/markdown-content.js";
import { fetchContent } from "./api-client.js";
import { createSseConnection } from "./sse.js";

type FileAppProps = {
  readonly content: string;
};

export function FileApp({ content: initialContent }: FileAppProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    const cleanup = createSseConnection({
      onFileChanged: () => {
        fetchContent().then((html) => {
          if (html !== null) setContent(html);
        });
      },
    });

    return cleanup;
  }, []);

  return (
    <main class="px-2 sm:px-5 py-5 sm:py-15">
      <div class="max-w-4xl mx-auto">
        <MarkdownContent htmlContent={content} />
      </div>
    </main>
  );
}
