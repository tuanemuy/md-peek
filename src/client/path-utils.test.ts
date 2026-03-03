import { describe, expect, it } from "vitest";
import { getFileNameFromPath, normalizePath } from "./path-utils.js";

describe("normalizePath", () => {
  it("replaces backslashes with forward slashes", () => {
    expect(normalizePath("foo\\bar\\baz")).toBe("foo/bar/baz");
  });

  it("returns the same string when no backslashes are present", () => {
    expect(normalizePath("foo/bar/baz")).toBe("foo/bar/baz");
  });

  it("returns empty string for empty input", () => {
    expect(normalizePath("")).toBe("");
  });
});

describe("getFileNameFromPath", () => {
  it("extracts the file name from a path", () => {
    expect(getFileNameFromPath("docs/guide/intro.md")).toBe("intro.md");
  });

  it("returns the path itself for a single segment", () => {
    expect(getFileNameFromPath("readme.md")).toBe("readme.md");
  });

  it("extracts the directory name when path has trailing slash", () => {
    expect(getFileNameFromPath("docs/")).toBe("docs");
  });

  it("returns empty string for empty input", () => {
    expect(getFileNameFromPath("")).toBe("");
  });

  it("returns empty string for root slash", () => {
    expect(getFileNameFromPath("/")).toBe("/");
  });
});
