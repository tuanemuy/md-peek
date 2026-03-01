import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { ResolvedStyles } from "./config/styles.js";
import type { ApiConfig } from "./routes/api.js";
import { createApiRoutes } from "./routes/api.js";
import { createDirectoryRoutes } from "./routes/directory.js";
import { createFileRoutes } from "./routes/file.js";
import type { SseManager } from "./routes/sse.js";
import { createSseManager } from "./routes/sse.js";
import type { FileTreeCache } from "./utils/file-tree-cache.js";
import { createFileTreeCache } from "./utils/file-tree-cache.js";
import type { FileWatcherHandle } from "./watcher/index.js";
import { createFileWatcher } from "./watcher/index.js";

type FileServerConfig = {
  readonly mode: "file";
  readonly targetPath: string;
  readonly port: number;
  readonly hostname: string;
  readonly styles: ResolvedStyles;
};

type DirectoryServerConfig = {
  readonly mode: "directory";
  readonly targetPath: string;
  readonly port: number;
  readonly hostname: string;
  readonly styles: ResolvedStyles;
};

export type ServerConfig = FileServerConfig | DirectoryServerConfig;

export type ServerInstance = {
  readonly close: () => void;
  readonly watcher: FileWatcherHandle;
  readonly sseCloseAll: () => void;
};

type AppContext =
  | {
      readonly mode: "file";
      readonly targetPath: string;
      readonly styles: ResolvedStyles;
    }
  | {
      readonly mode: "directory";
      readonly targetPath: string;
      readonly styles: ResolvedStyles;
      readonly treeCache: FileTreeCache;
    };

function createApp(ctx: AppContext, sse: SseManager): Hono {
  const app = new Hono();

  app.get("/favicon.ico", (c) => c.body(null, 204));
  app.route("/", sse.app);

  if (ctx.mode === "file") {
    const apiRoutes = createApiRoutes({
      mode: "file",
      targetPath: ctx.targetPath,
    });
    app.route("/", apiRoutes);

    const fileRoutes = createFileRoutes(ctx.targetPath, ctx.styles);
    app.route("/", fileRoutes);
  } else {
    const apiConfig: ApiConfig = {
      mode: "directory",
      targetPath: ctx.targetPath,
      treeCache: ctx.treeCache,
    };
    app.route("/", createApiRoutes(apiConfig));
    app.route(
      "/",
      createDirectoryRoutes(ctx.targetPath, ctx.styles, ctx.treeCache),
    );
  }

  return app;
}

function setupWatcher(ctx: AppContext, sse: SseManager): FileWatcherHandle {
  const watcher = createFileWatcher();

  if (ctx.mode === "file") {
    watcher.watchFile(ctx.targetPath, () => {
      sse.broadcast("file-changed", JSON.stringify({}));
    });
  } else {
    watcher.watchDirectory(ctx.targetPath, (filePath) => {
      const normalizedPath = filePath.replace(/\\/g, "/");
      ctx.treeCache.invalidate();
      sse.broadcast("file-changed", JSON.stringify({ path: normalizedPath }));
      sse.broadcast("tree-changed", JSON.stringify({}));
    });
  }

  return watcher;
}

export async function startServer(
  config: ServerConfig,
): Promise<ServerInstance> {
  const sse = createSseManager();

  const ctx: AppContext =
    config.mode === "directory"
      ? {
          mode: "directory",
          targetPath: config.targetPath,
          styles: config.styles,
          treeCache: createFileTreeCache(config.targetPath),
        }
      : {
          mode: "file",
          targetPath: config.targetPath,
          styles: config.styles,
        };

  const app = createApp(ctx, sse);
  const watcher = setupWatcher(ctx, sse);

  const server = serve({
    fetch: app.fetch,
    hostname: config.hostname,
    port: config.port,
  });

  await new Promise<void>((resolve, reject) => {
    const onListening = () => {
      server.removeListener("error", onError);
      resolve();
    };
    const onError = (err: Error) => {
      server.removeListener("listening", onListening);
      watcher.close();
      reject(err);
    };
    server.once("listening", onListening);
    server.once("error", onError);
  });

  return {
    close: () => {
      server.close();
    },
    watcher,
    sseCloseAll: () => sse.closeAll(),
  };
}
