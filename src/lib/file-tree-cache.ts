import type { FileTreeNode } from "../core/file-tree.js";
import type { Result } from "../core/result.js";
import type { BuildTreeError } from "./file-tree.js";
import { buildFileTree } from "./file-tree.js";

export type FileTreeCache = {
  readonly get: () => Promise<Result<readonly FileTreeNode[], BuildTreeError>>;
  readonly invalidate: () => void;
};

/**
 * Callers that already hold a reference to the pending promise will still
 * receive its (now-stale) result after `invalidate()` is called.  The next
 * call to `get()` after invalidation will trigger a fresh build.
 */
export function createFileTreeCache(rootDir: string): FileTreeCache {
  let cached: Result<readonly FileTreeNode[], BuildTreeError> | null = null;
  let pending: Promise<Result<readonly FileTreeNode[], BuildTreeError>> | null =
    null;

  return {
    async get() {
      if (cached) return cached;
      if (pending) return pending;
      const currentPending = buildFileTree(rootDir).then((result) => {
        if (pending === currentPending) {
          // Only cache successful results so errors trigger a retry on next get()
          if (result.ok) {
            cached = result;
          }
          pending = null;
        }
        return result;
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
