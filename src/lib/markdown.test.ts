import { beforeAll, describe, expect, it } from "vitest";
import { initMarkdown, renderMarkdown } from "./markdown.js";

describe("initMarkdown guard", () => {
  it("throws when renderMarkdown is called before initMarkdown", async () => {
    await expect(renderMarkdown("# test")).rejects.toThrow(/not initialized/);
  });

  it("is idempotent — calling initMarkdown twice does not throw", async () => {
    await expect(initMarkdown()).resolves.toBeUndefined();
    await expect(initMarkdown()).resolves.toBeUndefined();
  });
});

describe("renderMarkdown", () => {
  beforeAll(async () => {
    await initMarkdown();
  });

  it("renders headings", async () => {
    const html = await renderMarkdown("# Hello World");
    expect(html).toContain("<h1>");
    expect(html).toContain("Hello World");
  });

  it("renders paragraphs", async () => {
    const html = await renderMarkdown("This is a paragraph.");
    expect(html).toContain("<p>");
    expect(html).toContain("This is a paragraph.");
  });

  it("renders unordered lists", async () => {
    const html = await renderMarkdown("- item 1\n- item 2\n- item 3");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("item 1");
  });

  it("renders ordered lists", async () => {
    const html = await renderMarkdown("1. first\n2. second");
    expect(html).toContain("<ol>");
    expect(html).toContain("first");
  });

  it("renders code blocks with syntax highlighting", async () => {
    const html = await renderMarkdown("```js\nconsole.log('hi');\n```");
    expect(html).toContain("<pre");
    expect(html).toContain("shiki");
    expect(html).toContain("console");
  });

  it("renders inline code", async () => {
    const html = await renderMarkdown("Use `const` keyword");
    expect(html).toContain("<code>");
    expect(html).toContain("const");
  });

  it("renders links", async () => {
    const html = await renderMarkdown("[Google](https://google.com)");
    expect(html).toContain("<a");
    expect(html).toContain("https://google.com");
    expect(html).toContain("Google");
  });

  it("renders bold text", async () => {
    const html = await renderMarkdown("**bold text**");
    expect(html).toContain("<strong>");
    expect(html).toContain("bold text");
  });

  it("renders tables", async () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = await renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
    expect(html).toContain("<td>");
  });

  it("renders strikethrough", async () => {
    const html = await renderMarkdown("~~deleted~~");
    expect(html).toContain("<s>");
    expect(html).toContain("deleted");
  });

  it("renders task lists", async () => {
    const html = await renderMarkdown("- [x] done\n- [ ] todo");
    expect(html).toContain('type="checkbox"');
  });

  it("handles empty string", async () => {
    const html = await renderMarkdown("");
    expect(html).toBe("");
  });
});
