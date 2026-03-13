import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHtmlFileRoutes } from "./html-file.js";

const testDir = join(import.meta.dirname, "__test_fixture_html_file__");
const testFile = join(testDir, "test.html");

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(testFile, "<h1>Hello</h1><p>World</p>");
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("html file routes", () => {
  it("GET / returns HTML document with iframe", async () => {
    const app = createHtmlFileRoutes(testFile);
    const res = await app.request("/");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("test.html - peek");
    expect(html).toContain("<iframe");
    expect(html).toContain("/api/raw");
    expect(html).toContain('sandbox="allow-scripts"');
  });

  it("GET / includes SSE reload script", async () => {
    const app = createHtmlFileRoutes(testFile);
    const res = await app.request("/");
    const html = await res.text();
    expect(html).toContain("EventSource");
    expect(html).toContain("file-changed");
  });
});
