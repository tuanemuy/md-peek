import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { ServerInstance } from "./index.js";
import { startServer } from "./index.js";

const testDir = join(import.meta.dirname, "__test_server_fixture__");
const htmlFile = join(testDir, "test.html");

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, () => {
      const addr = srv.address() as AddressInfo;
      srv.close((err) => (err ? reject(err) : resolve(addr.port)));
    });
  });
}

const baseConfig = {
  targetPath: htmlFile,
  mode: "file" as const,
  hostname: "localhost",
  contentType: "html" as const,
};

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(htmlFile, "<html><body><h1>Test</h1></body></html>");
});

afterAll(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("startServer / shutdown lifecycle", () => {
  let server: ServerInstance | undefined;

  afterEach(async () => {
    await server?.shutdown().catch(() => {});
    server = undefined;
  });

  it("startServer starts server and responds to HTTP requests", async () => {
    const port = await getFreePort();
    server = await startServer({ ...baseConfig, port });

    const res = await fetch(`http://localhost:${port}/`);
    expect(res.status).toBe(200);
  });

  it("shutdown resolves without error", async () => {
    const port = await getFreePort();
    server = await startServer({ ...baseConfig, port });

    await expect(server.shutdown()).resolves.toBeUndefined();
    server = undefined;
  });

  it("server does not accept connections after shutdown", async () => {
    const port = await getFreePort();
    server = await startServer({ ...baseConfig, port });

    await server.shutdown();
    server = undefined;

    await expect(fetch(`http://localhost:${port}/`)).rejects.toThrow();
  });

  it("calling shutdown twice rejects on the second call", async () => {
    const port = await getFreePort();
    server = await startServer({ ...baseConfig, port });

    await server.shutdown();
    await expect(server.shutdown()).rejects.toThrow();
    server = undefined;
  });
});
