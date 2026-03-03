import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createFileTreeCache } from "../../lib/file-tree-cache.js";
import { initMarkdown } from "../../lib/markdown.js";
import { resolveStyles } from "../../lib/styles.js";
import { createDirectoryRoutes } from "./directory.js";

const testDir = join(import.meta.dirname, "__test_fixture_dir__");

beforeAll(async () => {
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, "docs"), { recursive: true });
  writeFileSync(join(testDir, "README.md"), "# README\n\nHello");
  writeFileSync(join(testDir, "docs", "guide.md"), "# Guide\n\nContent");
  await initMarkdown();
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("directory routes", () => {
  it("GET / returns file tree listing page", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("README.md");
    expect(html).toContain("docs");
  });

  it("GET /view?path=README.md returns sidebar + preview", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/view?path=README.md");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("README.md");
    expect(html).toContain("sidebar");
    expect(html).toContain("Hello");
  });

  it("GET /view?path=docs/guide.md works with nested paths", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/view?path=docs/guide.md");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("Guide");
    expect(html).toContain("Content");
  });

  it("GET /view without path redirects to /", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/view");
    expect(res.status).toBe(302);
  });

  it("GET /view?path=nonexistent.md returns 404", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/view?path=nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("GET /view with path traversal returns 403", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/view?path=../../../etc/passwd");
    expect(res.status).toBe(403);
  });
});

describe("directory routes - catch-all path", () => {
  it("GET /README.md returns rendered file preview", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/README.md");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("README.md");
    expect(html).toContain("Hello");
  });

  it("GET /docs/guide.md works with nested paths", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/docs/guide.md");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("Guide");
    expect(html).toContain("Content");
  });

  it("GET /nonexistent.md returns 404", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("GET /somefile.txt returns 404 for non-.md extension", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/somefile.txt");
    expect(res.status).toBe(404);
  });

  it("GET with path traversal attempt does not return 200", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    // URL-level path normalization resolves ../ before routing,
    // so the handler either rejects with 403 or treats the encoded
    // dots as a literal filename (404). Either way, traversal is blocked.
    const res = await app.request("/..%2F..%2F..%2Fetc%2Fpasswd.md");
    expect([403, 404]).toContain(res.status);
  });
});

describe("directory routes - security", () => {
  it("GET /view?path=../etc/passwd returns 403", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/view?path=../etc/passwd");
    expect(res.status).toBe(403);
  });

  it("GET /view?path=./../../etc/passwd returns 403", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/view?path=./../../etc/passwd");
    expect(res.status).toBe(403);
  });

  it("GET /view?path=docs returns 404 for directory path without .md extension", async () => {
    const result = await resolveStyles();
    if (!result.ok) throw new Error("Failed to resolve styles");
    const styles = result.value;
    const treeCache = createFileTreeCache(testDir);
    const app = createDirectoryRoutes(testDir, styles, treeCache);

    const res = await app.request("/view?path=docs");
    expect(res.status).toBe(404);
  });
});
