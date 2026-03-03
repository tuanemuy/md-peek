import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertErr } from "../test-utils/assert-result.js";
import { createFileTreeCache } from "./file-tree-cache.js";

const testDir = join(import.meta.dirname, "__test_cache_fixture__");

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, "docs"), { recursive: true });
  writeFileSync(join(testDir, "README.md"), "# README");
  writeFileSync(join(testDir, "docs", "guide.md"), "# Guide");
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("createFileTreeCache", () => {
  it("returns cached result on second get()", async () => {
    const cache = createFileTreeCache(testDir);
    const first = await cache.get();
    const second = await cache.get();
    expect(first).toBe(second);
  });

  it("returns fresh result after invalidate()", async () => {
    const cache = createFileTreeCache(testDir);
    const first = await cache.get();
    cache.invalidate();
    const second = await cache.get();
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  it("deduplicates concurrent get() calls", async () => {
    const cache = createFileTreeCache(testDir);
    const [a, b, c] = await Promise.all([
      cache.get(),
      cache.get(),
      cache.get(),
    ]);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("invalidate() during pending get() causes rebuild on next get()", async () => {
    const cache = createFileTreeCache(testDir);
    const firstPromise = cache.get();
    cache.invalidate();
    const first = await firstPromise;
    const second = await cache.get();
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
  });

  it("returns err result for nonexistent path", async () => {
    const cache = createFileTreeCache("/nonexistent/path");
    const result = await cache.get();
    const error = assertErr(result);
    expect(error.type).toBe("root-not-accessible");
  });

  it("retries after a previous failure instead of caching error", async () => {
    const cache = createFileTreeCache("/nonexistent/path");
    const first = await cache.get();
    expect(first.ok).toBe(false);
    const second = await cache.get();
    expect(second.ok).toBe(false);
    expect(first).not.toBe(second);
  });
});
