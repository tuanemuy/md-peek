import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

beforeEach(() => {
  mockWatcher.removeAllListeners();
  vi.clearAllMocks();
});

describe("watchFile error handling", () => {
  it("error event closes watcher without throwing", () => {
    const handle = createFileWatcher(50);
    const callback = vi.fn();
    handle.watchFile("/tmp/test.md", callback);

    expect(() => {
      mockWatcher.emit("error", new Error("EACCES: permission denied"));
    }).not.toThrow();

    expect(mockWatcher.close).toHaveBeenCalled();

    handle.close();
  });
});

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

  it("callback is not invoked after error closes watcher", () => {
    const handle = createFileWatcher(50);
    const callback = vi.fn();
    handle.watchDirectory("/tmp", callback);

    mockWatcher.emit("error", new Error("EACCES: permission denied"));
    mockWatcher.emit("change", "rename", "test.md");

    expect(callback).not.toHaveBeenCalled();

    handle.close();
  });

  it("multiple error events do not throw", () => {
    const handle = createFileWatcher(50);
    const callback = vi.fn();
    handle.watchDirectory("/tmp", callback);

    expect(() => {
      mockWatcher.emit("error", new Error("EACCES: permission denied"));
      mockWatcher.emit("error", new Error("EACCES: permission denied"));
    }).not.toThrow();

    handle.close();
  });
});
