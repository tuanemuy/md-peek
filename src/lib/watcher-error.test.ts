import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

const mockWatcher = new EventEmitter() as EventEmitter & { close: () => void };
mockWatcher.close = vi.fn();

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    watch: vi.fn(() => mockWatcher),
  };
});

const { createFileWatcher } = await import("./watcher.js");

describe("watchDirectory error handling", () => {
  it("error event closes watcher without throwing", () => {
    const handle = createFileWatcher(50);
    const callback = vi.fn();
    handle.watchDirectory("/tmp", callback);

    expect(() => {
      mockWatcher.emit("error", new Error("EACCES: permission denied"));
    }).not.toThrow();

    expect(mockWatcher.close).toHaveBeenCalled();

    handle.close();
  });
});
