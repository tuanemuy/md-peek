import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { typedError } from "../../core/error.js";
import { err } from "../../core/result.js";
import { createFileTreeCache } from "../../lib/file-tree-cache.js";
import { initMarkdown } from "../../lib/markdown.js";
import { createApiRoutes } from "./api.js";

const testDir = join(import.meta.dirname, "__test_fixture_api__");
const testFile = join(testDir, "readme.md");
const testHtmlFile = join(testDir, "page.html");

beforeAll(async () => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(testFile, "# API Test\n\nContent here");
  writeFileSync(testHtmlFile, "<h1>HTML Test</h1><p>Hello</p>");
  await initMarkdown();
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("api routes - file mode", () => {
  it("GET /api/content returns rendered HTML", async () => {
    const app = createApiRoutes({ mode: "file", targetPath: testFile });
    const res = await app.request("/api/content");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("API Test");
  });

  it("GET /api/tree returns empty array in file mode", async () => {
    const app = createApiRoutes({ mode: "file", targetPath: testFile });
    const res = await app.request("/api/tree");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });
});

describe("api routes - directory mode", () => {
  it("GET /api/content?path=readme.md returns rendered HTML", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/content?path=readme.md");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("API Test");
  });

  it("GET /api/content without path returns 400", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/content");
    expect(res.status).toBe(400);
  });

  it("GET /api/content with nonexistent path returns 404", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/content?path=nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("GET /api/tree returns file tree JSON", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/tree");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string }[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((n) => n.name === "readme.md")).toBe(true);
  });

  it("GET /api/content with path traversal returns 403", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/content?path=../../../etc/passwd");
    expect(res.status).toBe(403);
  });
});

describe("api routes - HTML file mode", () => {
  it("GET /api/content returns iframe snippet for HTML file", async () => {
    const app = createApiRoutes({ mode: "file", targetPath: testHtmlFile });
    const res = await app.request("/api/content");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<iframe");
    expect(html).toContain("/api/raw");
  });

  it("GET /api/raw returns raw HTML content", async () => {
    const app = createApiRoutes({ mode: "file", targetPath: testHtmlFile });
    const res = await app.request("/api/raw");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<h1>HTML Test</h1>");
    expect(html).toContain("Hello");
  });
});

describe("api routes - HTML directory mode", () => {
  it("GET /api/content?path=page.html returns iframe snippet", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/content?path=page.html");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<iframe");
    expect(html).toContain("/api/raw?path=page.html");
  });

  it("GET /api/raw?path=page.html returns raw HTML content", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/raw?path=page.html");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<h1>HTML Test</h1>");
  });

  it("GET /api/raw without path returns 400", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/raw");
    expect(res.status).toBe(400);
  });

  it("GET /api/raw with path traversal returns 403", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/raw?path=../../../etc/passwd");
    expect(res.status).toBe(403);
  });

  it("GET /api/raw with non-HTML path returns 404", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/raw?path=readme.md");
    expect(res.status).toBe(404);
  });
});

describe("api routes - file mode edge cases", () => {
  it("GET /api/content returns 500 when file does not exist", async () => {
    const app = createApiRoutes({
      mode: "file",
      targetPath: join(testDir, "nonexistent.md"),
    });
    const res = await app.request("/api/content");
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe("Failed to read file");
  });
});

describe("api routes - tree error handling", () => {
  const failingTreeCache = {
    get: () =>
      Promise.resolve(
        err(typedError("root-not-accessible", new Error("disk failure"))),
      ),
    invalidate: () => {},
  };

  it("GET /api/tree returns 500 when treeCache fails", async () => {
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache: failingTreeCache,
    });
    const res = await app.request("/api/tree");
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe("Failed to read directory");
  });
});

describe("api routes - directory mode edge cases", () => {
  it("GET /api/content with unsupported extension returns 404", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/content?path=readme.txt");
    expect(res.status).toBe(404);
  });

  it("GET /api/content with ../etc/passwd path traversal returns 403", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/content?path=../etc/passwd");
    expect(res.status).toBe(403);
  });

  it("GET /api/content with ./../../etc/passwd path traversal returns 403", async () => {
    const treeCache = createFileTreeCache(testDir);
    const app = createApiRoutes({
      mode: "directory",
      targetPath: testDir,
      treeCache,
    });
    const res = await app.request("/api/content?path=./../../etc/passwd");
    expect(res.status).toBe(403);
  });
});
