import type { FileTreeNode } from "./file-tree.js";
import { buildFileTree } from "./file-tree.js";

export type FileTreeCache = {
  readonly get: () => Promise<readonly FileTreeNode[]>;
  readonly invalidate: () => void;
};

/**
 * Callers that already hold a reference to the pending promise will still
 * receive its (now-stale) result after `invalidate()` is called.  The next
 * call to `get()` after invalidation will trigger a fresh build.
 */
export function createFileTreeCache(rootDir: string): FileTreeCache {
  let cached: readonly FileTreeNode[] | null = null;
  let pending: Promise<readonly FileTreeNode[]> | null = null;

  return {
    async get() {
      if (cached) return cached;
      if (pending) return pending;
      const currentPending = buildFileTree(rootDir)
        .then((result) => {
          if (pending === currentPending) {
            cached = result;
            pending = null;
          }
          return result;
        })
        .catch((error: unknown) => {
          if (pending === currentPending) {
            pending = null;
          }
          throw error;
        });
      pending = currentPending;
      return currentPending;
    },
    invalidate() {
      cached = null;
      pending = null;
    },
  };
}
