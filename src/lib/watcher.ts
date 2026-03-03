import { type FSWatcher, watch } from "node:fs";

export type FileChangeCallback = (filePath: string) => void;

export type FileWatcherHandle = {
  readonly watchFile: (filePath: string, callback: FileChangeCallback) => void;
  readonly watchDirectory: (
    dirPath: string,
    callback: FileChangeCallback,
  ) => void;
  readonly close: () => void;
};

export function createFileWatcher(debounceMs = 100): FileWatcherHandle {
  const watchers: FSWatcher[] = [];
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let closed = false;

  function debounced(key: string, fn: () => void): void {
    if (closed) return;
    const existing = debounceTimers.get(key);
    if (existing) clearTimeout(existing);
    debounceTimers.set(
      key,
      setTimeout(() => {
        debounceTimers.delete(key);
        if (!closed) fn();
      }, debounceMs),
    );
  }

  return {
    watchFile(filePath: string, callback: FileChangeCallback): void {
      if (closed) return;
      const watcher = watch(filePath, (eventType) => {
        debounced(filePath, () => callback(filePath));
        if (eventType === "rename") {
          watcher.close();
        }
      });
      watcher.on("error", () => {
        watcher.close();
      });
      watchers.push(watcher);
    },

    watchDirectory(dirPath: string, callback: FileChangeCallback): void {
      if (closed) return;
      const watcher = watch(
        dirPath,
        { recursive: true },
        (_eventType, filename) => {
          if (!filename) return;
          const filePath = filename.toString();
          if (filePath.endsWith(".md")) {
            debounced(filePath, () => callback(filePath));
          }
        },
      );
      watchers.push(watcher);
    },

    close(): void {
      closed = true;
      for (const watcher of watchers) {
        watcher.close();
      }
      watchers.length = 0;
      for (const timer of debounceTimers.values()) {
        clearTimeout(timer);
      }
      debounceTimers.clear();
    },
  };
}
