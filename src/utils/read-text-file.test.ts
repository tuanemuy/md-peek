import { chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertErr, assertOk } from "../test-utils/assert-result.js";
import { readTextFile } from "./read-text-file.js";

const testDir = join(import.meta.dirname, "__test_read_text_fixture__");
const validFile = join(testDir, "valid.md");
const nonexistentFile = join(testDir, "nonexistent.md");
const unreadableFile = join(testDir, "unreadable.md");

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(validFile, "# Hello\n\nWorld");
  writeFileSync(unreadableFile, "secret");
  chmodSync(unreadableFile, 0o000);
});

afterAll(() => {
  chmodSync(unreadableFile, 0o644);
  rmSync(testDir, { recursive: true, force: true });
});

const isRoot = process.getuid?.() === 0;

describe("readTextFile", () => {
  it("returns ok with file content for a valid file", async () => {
    const result = await readTextFile(validFile);
    const value = assertOk(result);
    expect(value).toBe("# Hello\n\nWorld");
  });

  it("returns err with file-not-found for a nonexistent path", async () => {
    const result = await readTextFile(nonexistentFile);
    const error = assertErr(result);
    expect(error.type).toBe("file-not-found");
    expect(error.path).toBe(nonexistentFile);
    expect(error.cause).toBeInstanceOf(Error);
  });
});

describe.skipIf(isRoot)("readTextFile with unreadable file", () => {
  it("returns err with read-error and Error cause for permission denied", async () => {
    const result = await readTextFile(unreadableFile);
    const error = assertErr(result);
    expect(error.type).toBe("read-error");
    expect(error.path).toBe(unreadableFile);
    expect(error.cause).toBeInstanceOf(Error);
  });
});
