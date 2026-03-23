import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockWatcher = new EventEmitter() as EventEmitter & { close: () => void };
mockWatcher.close = vi.fn(() => mockWatcher.removeAllListeners());

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    watch: vi.fn((...args: unknown[]) => {
      const cb = args.find((a) => typeof a === "function") as
        | ((...cbArgs: unknown[]) => void)
        | undefined;
      if (cb) mockWatcher.on("change", cb);
      return mockWatcher;
    }),
  };
});

const { createFileWatcher } = await import("./watcher.js");

beforeEach(() => {
  mockWatcher.removeAllListeners();
  mockWatcher.close = vi.fn(() => mockWatcher.removeAllListeners());
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("watchFile error handling", () => {
  it("error event closes watcher without throwing", () => {
    const handle = createFileWatcher(50);
    const callback = vi.fn();
    handle.watchFile("/tmp/test.md", callback);

    const emittedError = new Error("EACCES: permission denied");
    expect(() => {
      mockWatcher.emit("error", emittedError);
    }).not.toThrow();

    expect(mockWatcher.close).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      "[peek]",
      "File watcher error for /tmp/test.md:",
      emittedError,
    );

    handle.close();
  });

  it("callback is not invoked after error closes watcher", () => {
    const handle = createFileWatcher(50);
    const callback = vi.fn();
    handle.watchFile("/tmp/test.md", callback);

    mockWatcher.emit("error", new Error("EACCES: permission denied"));
    mockWatcher.emit("change", "change");

    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();

    handle.close();
  });
});

describe("watchDirectory error handling", () => {
  it("error event closes watcher without throwing", () => {
    const handle = createFileWatcher(50);
    const callback = vi.fn();
    handle.watchDirectory("/tmp", callback);

    const emittedError = new Error("EACCES: permission denied");
    expect(() => {
      mockWatcher.emit("error", emittedError);
    }).not.toThrow();

    expect(mockWatcher.close).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      "[peek]",
      "Directory watcher error for /tmp:",
      emittedError,
    );

    handle.close();
  });

  it("callback is not invoked after error closes watcher", () => {
    const handle = createFileWatcher(50);
    const callback = vi.fn();
    handle.watchDirectory("/tmp", callback);

    mockWatcher.emit("error", new Error("EACCES: permission denied"));
    mockWatcher.emit("change", "rename", "test.md");

    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();

    handle.close();
  });
});
