import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchContent, fetchTree } from "./api-client.js";

const mockFetch =
  vi.fn<
    (input: string | URL | Request, init?: RequestInit) => Promise<Response>
  >();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

describe("fetchContent", () => {
  it("returns HTML text on success (directory mode with path)", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("<h1>Hello</h1>", { status: 200 }),
    );
    const result = await fetchContent("docs/readme.md");
    expect(result).toBe("<h1>Hello</h1>");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/content?path=docs%2Freadme.md",
      undefined,
    );
  });

  it("returns HTML text on success (file mode without path)", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("<h1>File</h1>", { status: 200 }),
    );
    const result = await fetchContent();
    expect(result).toBe("<h1>File</h1>");
    expect(mockFetch).toHaveBeenCalledWith("/api/content", undefined);
  });

  it("returns null on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce(new Response("Not found", { status: 404 }));
    const result = await fetchContent("missing.md");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await fetchContent("docs/readme.md");
    expect(result).toBeNull();
  });

  it("re-throws AbortError", async () => {
    mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    await expect(fetchContent("docs/readme.md")).rejects.toThrow("Aborted");
  });

  it("passes signal when provided", async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValueOnce(
      new Response("<h1>OK</h1>", { status: 200 }),
    );
    await fetchContent("readme.md", { signal: controller.signal });
    expect(mockFetch).toHaveBeenCalledWith("/api/content?path=readme.md", {
      signal: controller.signal,
    });
  });
});

describe("fetchTree", () => {
  it("returns parsed tree JSON on success", async () => {
    const treeData = [{ name: "readme.md", path: "readme.md", type: "file" }];
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(treeData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const result = await fetchTree();
    expect(result).toEqual(treeData);
    expect(mockFetch).toHaveBeenCalledWith("/api/tree", undefined);
  });

  it("returns null when response is not an array", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "bad" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const result = await fetchTree();
    expect(result).toBeNull();
  });

  it("returns null on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Internal error", { status: 500 }),
    );
    const result = await fetchTree();
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await fetchTree();
    expect(result).toBeNull();
  });

  it("re-throws AbortError", async () => {
    mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    await expect(fetchTree()).rejects.toThrow("Aborted");
  });

  it("passes signal when provided", async () => {
    const controller = new AbortController();
    const treeData = [{ name: "a.md", path: "a.md", type: "file" }];
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(treeData), { status: 200 }),
    );
    await fetchTree({ signal: controller.signal });
    expect(mockFetch).toHaveBeenCalledWith("/api/tree", {
      signal: controller.signal,
    });
  });
});
