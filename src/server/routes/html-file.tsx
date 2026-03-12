import { basename } from "node:path";
import { Hono } from "hono";
import { renderHtmlDocument } from "../renderer/html-document.js";

export function createHtmlFileRoutes(filePath: string): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    const title = basename(filePath);
    return c.html(renderHtmlDocument(title, "/api/raw"));
  });

  return app;
}
