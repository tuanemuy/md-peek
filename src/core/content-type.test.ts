import { describe, expect, it } from "vitest";
import { getContentType, isSupportedFile } from "./content-type.js";

describe("getContentType", () => {
  it("returns 'markdown' for .md files", () => {
    expect(getContentType("README.md")).toBe("markdown");
    expect(getContentType("docs/guide.md")).toBe("markdown");
  });

  it("returns 'html' for .html files", () => {
    expect(getContentType("index.html")).toBe("html");
    expect(getContentType("pages/about.html")).toBe("html");
  });

  it("returns 'html' for .htm files", () => {
    expect(getContentType("page.htm")).toBe("html");
  });

  it("is case-insensitive for extensions", () => {
    expect(getContentType("FILE.MD")).toBe("markdown");
    expect(getContentType("PAGE.HTML")).toBe("html");
    expect(getContentType("PAGE.HTM")).toBe("html");
  });

  it("returns null for unsupported extensions", () => {
    expect(getContentType("style.css")).toBeNull();
    expect(getContentType("script.js")).toBeNull();
    expect(getContentType("data.json")).toBeNull();
    expect(getContentType("notes.txt")).toBeNull();
  });

  it("returns null for files without extension", () => {
    expect(getContentType("Makefile")).toBeNull();
    expect(getContentType("README")).toBeNull();
  });

  it("ignores dots in directory names", () => {
    expect(getContentType("my.project/README")).toBeNull();
    expect(getContentType("v2.0/notes")).toBeNull();
    expect(getContentType("my.project/README.md")).toBe("markdown");
    expect(getContentType("v2.0/page.html")).toBe("html");
  });

  it("handles Windows-style backslash paths", () => {
    expect(getContentType("my.project\\README")).toBeNull();
    expect(getContentType("v2.0\\page.html")).toBe("html");
  });

  it("returns null for empty string", () => {
    expect(getContentType("")).toBeNull();
  });
});

describe("isSupportedFile", () => {
  it("returns true for .md files", () => {
    expect(isSupportedFile("README.md")).toBe(true);
  });

  it("returns true for .html files", () => {
    expect(isSupportedFile("index.html")).toBe(true);
  });

  it("returns true for .htm files", () => {
    expect(isSupportedFile("page.htm")).toBe(true);
  });

  it("returns false for unsupported files", () => {
    expect(isSupportedFile("style.css")).toBe(false);
    expect(isSupportedFile("script.js")).toBe(false);
    expect(isSupportedFile("notes.txt")).toBe(false);
  });
});
