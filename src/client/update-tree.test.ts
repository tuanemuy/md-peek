import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./tree-toggle.ts", () => ({
  attachTreeToggleHandlers: vi.fn(),
}));

import { attachTreeToggleHandlers } from "./tree-toggle.ts";
import { applyTree, fetchTree, updateTree } from "./update-tree.ts";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal("document", {
    getElementById: vi.fn(),
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("fetchTree", () => {
  it("fetches tree HTML with encoded path", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<ul>tree</ul>"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchTree("docs/sub dir");
    expect(result).toBe("<ul>tree</ul>");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tree-html?currentPath=docs%2Fsub%20dir",
      { signal: undefined },
    );
  });

  it("returns null on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const result = await fetchTree("docs");
    expect(result).toBeNull();
  });

  it("re-throws AbortError", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(fetchTree("docs")).rejects.toThrow(abortError);
  });

  it("returns null on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await fetchTree("docs");
    expect(result).toBeNull();
  });
});

describe("applyTree", () => {
  it("sets innerHTML and calls attachTreeToggleHandlers", () => {
    const mockEl = { innerHTML: "" };
    vi.stubGlobal("document", {
      getElementById: vi.fn().mockReturnValue(mockEl),
    });

    applyTree("<ul>new tree</ul>");
    expect(mockEl.innerHTML).toBe("<ul>new tree</ul>");
    expect(attachTreeToggleHandlers).toHaveBeenCalled();
  });

  it("does nothing when element not found", () => {
    vi.stubGlobal("document", {
      getElementById: vi.fn().mockReturnValue(null),
    });

    expect(() => applyTree("<ul>tree</ul>")).not.toThrow();
    expect(attachTreeToggleHandlers).not.toHaveBeenCalled();
  });
});

describe("updateTree", () => {
  it("fetches and applies tree HTML", async () => {
    const mockEl = { innerHTML: "" };
    vi.stubGlobal("document", {
      getElementById: vi.fn().mockReturnValue(mockEl),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<ul>updated</ul>"),
      }),
    );

    await updateTree("docs");
    expect(mockEl.innerHTML).toBe("<ul>updated</ul>");
    expect(attachTreeToggleHandlers).toHaveBeenCalled();
  });

  it("does not update DOM on fetch failure", async () => {
    const mockEl = { innerHTML: "original" };
    vi.stubGlobal("document", {
      getElementById: vi.fn().mockReturnValue(mockEl),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await updateTree("docs");
    expect(mockEl.innerHTML).toBe("original");
  });
});
