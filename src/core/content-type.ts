export type ContentType = "markdown" | "html";

const EXTENSION_MAP: ReadonlyMap<string, ContentType> = new Map([
  [".md", "markdown"],
  [".html", "html"],
  [".htm", "html"],
]);

function getExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filePath.length - 1) return "";
  return filePath.slice(lastDot).toLowerCase();
}

export function getContentType(filePath: string): ContentType | null {
  return EXTENSION_MAP.get(getExtension(filePath)) ?? null;
}

export function isSupportedFile(filePath: string): boolean {
  return getContentType(filePath) !== null;
}
