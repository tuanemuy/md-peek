import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSseConnection } from "./sse.js";

type EventHandler = (e: MessageEvent) => void;

class MockEventSource {
  readonly url: string;
  onerror: (() => void) | null = null;
  private listeners = new Map<string, EventHandler[]>();
  private closed = false;

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: string, handler: EventHandler): void {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  dispatchEvent(type: string, data: string): void {
    const handlers = this.listeners.get(type) ?? [];
    for (const handler of handlers) {
      handler({ data } as MessageEvent);
    }
  }

  close(): void {
    this.closed = true;
  }

  get isClosed(): boolean {
    return this.closed;
  }
}

let mockEventSourceInstance: MockEventSource | null = null;

function getInstance(): MockEventSource {
  if (!mockEventSourceInstance) throw new Error("No MockEventSource instance");
  return mockEventSourceInstance;
}

beforeEach(() => {
  mockEventSourceInstance = null;
  vi.stubGlobal(
    "EventSource",
    function MockES(this: MockEventSource, url: string) {
      const instance = new MockEventSource(url);
      mockEventSourceInstance = instance;
      Object.assign(this, instance);
      // Copy prototype methods onto `this` so EventSource usage works
      this.addEventListener = instance.addEventListener.bind(instance);
      this.close = instance.close.bind(instance);
      this.dispatchEvent = instance.dispatchEvent.bind(instance);
      Object.defineProperty(this, "onerror", {
        get: () => instance.onerror,
        set: (v: (() => void) | null) => {
          instance.onerror = v;
        },
        configurable: true,
      });
      Object.defineProperty(this, "url", {
        get: () => instance.url,
        configurable: true,
      });
      Object.defineProperty(this, "isClosed", {
        get: () => instance.isClosed,
        configurable: true,
      });
    },
  );
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("createSseConnection", () => {
  it("connects to /sse", () => {
    createSseConnection({ onFileChanged: vi.fn() });
    const instance = getInstance();
    expect(instance.url).toBe("/sse");
  });

  it("calls onFileChanged with normalized path on file-changed event", () => {
    const onFileChanged = vi.fn();
    createSseConnection({ onFileChanged });

    getInstance().dispatchEvent(
      "file-changed",
      JSON.stringify({ path: "docs\\readme.md" }),
    );

    expect(onFileChanged).toHaveBeenCalledWith("docs/readme.md");
  });

  it("calls onFileChanged with null when data is invalid JSON", () => {
    const onFileChanged = vi.fn();
    createSseConnection({ onFileChanged });

    getInstance().dispatchEvent("file-changed", "not-json");

    expect(onFileChanged).toHaveBeenCalledWith(null);
  });

  it("calls onFileChanged with null when data has no path", () => {
    const onFileChanged = vi.fn();
    createSseConnection({ onFileChanged });

    getInstance().dispatchEvent("file-changed", JSON.stringify({ foo: "bar" }));

    expect(onFileChanged).toHaveBeenCalledWith(null);
  });

  it("calls onTreeChanged on tree-changed event", () => {
    const onTreeChanged = vi.fn();
    createSseConnection({ onFileChanged: vi.fn(), onTreeChanged });

    getInstance().dispatchEvent("tree-changed", "");

    expect(onTreeChanged).toHaveBeenCalledTimes(1);
  });

  it("does not register tree-changed listener when callback is not provided", () => {
    createSseConnection({ onFileChanged: vi.fn() });

    // Should not throw when dispatching tree-changed
    getInstance().dispatchEvent("tree-changed", "");
  });

  it("cleans up on dispose", () => {
    const cleanup = createSseConnection({ onFileChanged: vi.fn() });
    expect(getInstance().isClosed).toBe(false);

    cleanup();

    expect(getInstance().isClosed).toBe(true);
  });

  it("retries on error with exponential backoff", () => {
    createSseConnection({ onFileChanged: vi.fn() });
    const firstInstance = getInstance();

    // Trigger error
    firstInstance.onerror?.();

    // First instance should be closed
    expect(firstInstance.isClosed).toBe(true);

    // Advance past retry delay (1000ms initial)
    vi.advanceTimersByTime(1000);

    // New instance should be created
    const newInstance = getInstance();
    expect(newInstance).not.toBe(firstInstance);
    expect(newInstance.url).toBe("/sse");
  });

  it("resets retry count after stable connection", () => {
    const onFileChanged = vi.fn();
    createSseConnection({ onFileChanged });

    // Trigger error and retry
    getInstance().onerror?.();
    vi.advanceTimersByTime(1000);

    // Wait for stable threshold (5000ms)
    vi.advanceTimersByTime(5000);

    // Trigger another error - should use initial delay (1000ms) not exponential
    const instanceAfterStable = getInstance();
    instanceAfterStable.onerror?.();
    vi.advanceTimersByTime(1000);

    expect(getInstance()).not.toBe(instanceAfterStable);
  });
});
