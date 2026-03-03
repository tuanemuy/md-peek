import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createFileWatcher } from "./watcher.js";

const testDir = join(import.meta.dirname, "__test_fixture_watcher__");
const testFile = join(testDir, "test.md");

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(testFile, "# Test");
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("FileWatcher", () => {
  it("debounces rapid changes", async () => {
    const watcher = createFileWatcher(50);
    const callback = vi.fn();

    watcher.watchFile(testFile, callback);

    writeFileSync(testFile, "# Change 1");
    writeFileSync(testFile, "# Change 2");
    writeFileSync(testFile, "# Change 3");

    await new Promise((r) => setTimeout(r, 200));
    watcher.close();

    expect(callback.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("close() stops all watchers and clears timers", () => {
    const watcher = createFileWatcher(50);
    const callback = vi.fn();

    watcher.watchFile(testFile, callback);
    watcher.close();

    writeFileSync(testFile, "# After close");

    expect(callback).not.toHaveBeenCalled();
  });

  it("ignores events after close", async () => {
    const watcher = createFileWatcher(50);
    const callback = vi.fn();

    watcher.watchFile(testFile, callback);
    writeFileSync(testFile, "# Before close");
    watcher.close();

    await new Promise((r) => setTimeout(r, 200));

    expect(callback).not.toHaveBeenCalled();
  });

  it("rejects watchFile after close", () => {
    const watcher = createFileWatcher(50);
    watcher.close();

    const callback = vi.fn();
    watcher.watchFile(testFile, callback);

    writeFileSync(testFile, "# After closed watcher");

    expect(callback).not.toHaveBeenCalled();
  });

  it("rejects watchDirectory after close", () => {
    const watcher = createFileWatcher(50);
    watcher.close();

    const callback = vi.fn();
    watcher.watchDirectory(testDir, callback);

    writeFileSync(testFile, "# After closed watcher dir");

    expect(callback).not.toHaveBeenCalled();
  });
});
