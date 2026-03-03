import { afterEach, describe, expect, it } from "vitest";

import { createSseManager } from "./sse.js";

describe("SSE manager", () => {
  it("GET /sse returns SSE content type", async () => {
    const sse = createSseManager();
    const res = await sse.app.request("/sse");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });

  it("starts with zero clients", () => {
    const sse = createSseManager();
    expect(sse.clientCount).toBe(0);
  });

  it("closeAll does not throw with no clients", () => {
    const sse = createSseManager();
    expect(() => sse.closeAll()).not.toThrow();
  });

  it("broadcast does not throw with no clients", () => {
    const sse = createSseManager();
    expect(() =>
      sse.broadcast("file-changed", '{"path":"test.md"}'),
    ).not.toThrow();
  });
});

describe("SSE connection lifecycle", () => {
  let sse: ReturnType<typeof createSseManager>;

  afterEach(() => {
    sse.closeAll();
  });

  it("clientCount increases when a client connects", async () => {
    sse = createSseManager();
    expect(sse.clientCount).toBe(0);

    // Initiate SSE connection (non-blocking — response is a stream)
    sse.app.request("/sse");
    // Allow microtask queue to flush so the stream handler registers the client
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sse.clientCount).toBe(1);
  });

  it("broadcast sends data to connected clients", async () => {
    sse = createSseManager();
    const res = await sse.app.request("/sse");

    // Allow the stream handler to register
    await new Promise((resolve) => setTimeout(resolve, 50));

    sse.broadcast("file-changed", '{"path":"test.md"}');

    // Read partial body — the SSE stream should contain the broadcast event
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No reader");

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("file-changed");
    reader.cancel();
  });

  it("closeAll resets clientCount to zero", async () => {
    sse = createSseManager();
    sse.app.request("/sse");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sse.clientCount).toBeGreaterThan(0);
    sse.closeAll();
    expect(sse.clientCount).toBe(0);
  });
});
