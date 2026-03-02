import { init, mdToHtml } from "md4w";

let initialized = false;

export async function initMarkdown(): Promise<void> {
  if (initialized) return;
  await init();
  initialized = true;
}

export function renderMarkdown(content: string): string {
  if (!initialized) {
    throw new Error(
      "Markdown renderer not initialized. Call initMarkdown() first.",
    );
  }
  if (content === "") return "";
  return mdToHtml(content, {
    parseFlags: ["DEFAULT", "LATEX_MATH_SPANS"],
  });
}
