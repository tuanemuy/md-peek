import { useEffect } from "preact/hooks";
import type { FileTreeNode } from "../../core/file-tree.js";
import { fetchContent, fetchTree } from "../lib/api-client.js";
import { normalizePath } from "../lib/path-utils.js";
import { createSseConnection } from "../lib/sse.js";

/**
 * SSE live-update hook.
 *
 * Directory mode: pass `getCurrentPath` and `onTreeUpdate` to refresh
 * only the active file and tree on server events.
 * File mode: omit both — every file-changed event refreshes content.
 */
export function useSseUpdates(params: {
  readonly onContentUpdate: (html: string) => void;
  readonly getCurrentPath?: () => string;
  readonly onTreeUpdate?: (tree: readonly FileTreeNode[]) => void;
}): void {
  // All callbacks are expected to be stable (state setters) or accessed via
  // getCurrentPath (ref-based getter). This allows [] deps safely.
  const { onContentUpdate, getCurrentPath, onTreeUpdate } = params;

  useEffect(() => {
    const cleanup = createSseConnection({
      onFileChanged: (changedPath) => {
        if (getCurrentPath) {
          // Directory mode: only refresh if the changed file matches current
          if (changedPath === null) return;
          const current = getCurrentPath();
          if (normalizePath(changedPath) !== normalizePath(current)) return;
          fetchContent(current)
            .then((html) => {
              if (html !== null) onContentUpdate(html);
            })
            .catch((e: unknown) => {
              console.error("[peek] Failed to refresh content:", e);
            });
        } else {
          // File mode: always refresh
          fetchContent()
            .then((html) => {
              if (html !== null) onContentUpdate(html);
            })
            .catch((e: unknown) => {
              console.error("[peek] Failed to refresh content:", e);
            });
        }
      },
      onTreeChanged: onTreeUpdate
        ? () => {
            fetchTree()
              .then((treeData) => {
                if (treeData) onTreeUpdate(treeData);
              })
              .catch((e: unknown) => {
                console.error("[peek] Failed to refresh tree:", e);
              });
          }
        : undefined,
    });

    return cleanup;
  }, []); // eslint-disable-line -- stable callbacks by design
}
