import { tasklist } from "@mdit/plugin-tasklist";
import { fromAsyncCodeToHtml } from "@shikijs/markdown-it/async";
import createMarkdownItAsync, { type MarkdownItAsync } from "markdown-it-async";
import { codeToHtml } from "shiki";

let md: MarkdownItAsync | null = null;
let initPromise: Promise<void> | null = null;

export function initMarkdown(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const instance = createMarkdownItAsync();
      instance.use(tasklist);
      instance.use(
        fromAsyncCodeToHtml(codeToHtml, {
          themes: {
            light: "vitesse-light",
            dark: "vitesse-dark",
          },
          defaultColor: false,
        }),
      );
      md = instance;
    })().catch((e: unknown) => {
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
}

export async function renderMarkdown(content: string): Promise<string> {
  if (!md) {
    throw new Error(
      "Markdown renderer not initialized. Call initMarkdown() first.",
    );
  }
  if (content === "") return "";
  return md.renderAsync(content);
}
