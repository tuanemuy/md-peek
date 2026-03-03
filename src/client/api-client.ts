import type { FileTreeNode } from "../utils/file-tree.js";

export async function fetchContent(
  path?: string,
  options?: { readonly signal?: AbortSignal },
): Promise<string | null> {
  try {
    const url = path
      ? `/api/content?path=${encodeURIComponent(path)}`
      : "/api/content";
    const res = await fetch(
      url,
      options?.signal ? { signal: options.signal } : undefined,
    );
    if (!res.ok) {
      console.error(`[peek] Failed to fetch content: HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    console.error("[peek] Failed to fetch content:", e);
    return null;
  }
}

export async function fetchTree(options?: {
  readonly signal?: AbortSignal;
}): Promise<readonly FileTreeNode[] | null> {
  try {
    const res = await fetch(
      "/api/tree",
      options?.signal ? { signal: options.signal } : undefined,
    );
    if (!res.ok) {
      console.error(`[peek] Failed to fetch tree: HTTP ${res.status}`);
      return null;
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      console.error("[peek] Unexpected tree response format");
      return null;
    }
    return data as FileTreeNode[];
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    console.error("[peek] Failed to fetch tree:", e);
    return null;
  }
}
