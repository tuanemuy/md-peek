import { beforeAll, describe, expect, it } from "vitest";
import { initMarkdown, renderMarkdown } from "./renderer.js";

describe("initMarkdown guard", () => {
  it("throws when renderMarkdown is called before initMarkdown", () => {
    expect(() => renderMarkdown("# test")).toThrow(/not initialized/);
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

  it("renders headings", () => {
    const html = renderMarkdown("# Hello World");
    expect(html).toContain("<h1>");
    expect(html).toContain("Hello World");
  });

  it("renders paragraphs", () => {
    const html = renderMarkdown("This is a paragraph.");
    expect(html).toContain("<p>");
    expect(html).toContain("This is a paragraph.");
  });

  it("renders unordered lists", () => {
    const html = renderMarkdown("- item 1\n- item 2\n- item 3");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("item 1");
  });

  it("renders ordered lists", () => {
    const html = renderMarkdown("1. first\n2. second");
    expect(html).toContain("<ol>");
    expect(html).toContain("first");
  });

  it("renders code blocks", () => {
    const html = renderMarkdown("```js\nconsole.log('hi');\n```");
    expect(html).toContain("<pre>");
    expect(html).toContain("<code");
    expect(html).toContain("console.log");
  });

  it("renders inline code", () => {
    const html = renderMarkdown("Use `const` keyword");
    expect(html).toContain("<code>");
    expect(html).toContain("const");
  });

  it("renders links", () => {
    const html = renderMarkdown("[Google](https://google.com)");
    expect(html).toContain("<a");
    expect(html).toContain("https://google.com");
    expect(html).toContain("Google");
  });

  it("renders bold text", () => {
    const html = renderMarkdown("**bold text**");
    expect(html).toContain("<strong>");
    expect(html).toContain("bold text");
  });

  it("renders tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
    expect(html).toContain("<td>");
  });

  it("renders strikethrough", () => {
    const html = renderMarkdown("~~deleted~~");
    expect(html).toContain("<del>");
    expect(html).toContain("deleted");
  });

  it("renders task lists", () => {
    const html = renderMarkdown("- [x] done\n- [ ] todo");
    expect(html).toContain('type="checkbox"');
  });

  it("handles empty string", () => {
    const html = renderMarkdown("");
    expect(html).toBe("");
  });
});
