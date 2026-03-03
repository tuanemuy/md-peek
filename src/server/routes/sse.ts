import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

export type SSEClient = {
  readonly send: (event: string, data: string) => void;
  readonly close: () => void;
};

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

export type SseManager = {
  readonly app: Hono;
  readonly broadcast: (event: string, data: string) => void;
  readonly closeAll: () => void;
  readonly clientCount: number;
};

const KEEP_ALIVE_INTERVAL_MS = 30_000;

export function createSseManager(): SseManager {
  const clients = new Set<SSEClient>();

  function broadcast(event: string, data: string): void {
    for (const client of Array.from(clients)) {
      client.send(event, data);
    }
  }

  function closeAll(): void {
    for (const client of clients) {
      client.close();
    }
    clients.clear();
  }

  const app = new Hono();

  app.get("/sse", (c) => {
    return streamSSE(c, async (stream) => {
      let closed = false;
      const abortController = new AbortController();

      function cleanup() {
        if (!closed) {
          closed = true;
          abortController.abort();
          clients.delete(client);
        }
      }

      const client: SSEClient = {
        send: (event, data) => {
          if (!closed) {
            stream.writeSSE({ event, data }).catch(cleanup);
          }
        },
        close: cleanup,
      };

      clients.add(client);
      stream.onAbort(cleanup);

      // Keep connection alive with comment lines
      while (!closed) {
        try {
          await sleep(KEEP_ALIVE_INTERVAL_MS, abortController.signal);
        } catch {
          // AbortSignal interrupts sleep when the connection is closed — expected
          break;
        }
        if (!closed) {
          await stream.write(": keep-alive\n\n").catch(cleanup);
        }
      }
    });
  });

  return {
    app,
    broadcast,
    closeAll,
    get clientCount() {
      return clients.size;
    },
  };
}
