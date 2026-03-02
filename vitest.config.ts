import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "css-raw-text",
      enforce: "pre",
      resolveId(source, importer) {
        if (
          source.endsWith(".css") &&
          importer &&
          !source.includes("node_modules")
        ) {
          const importerDir = importer.startsWith("file://")
            ? dirname(fileURLToPath(importer))
            : dirname(importer);
          const resolved = resolve(importerDir, source);
          return `${resolved}.js`;
        }
      },
      load(id) {
        if (id.endsWith(".css.js")) {
          const cssPath = id.slice(0, -".js".length);
          const content = readFileSync(cssPath, "utf-8");
          return `export default ${JSON.stringify(content)};`;
        }
      },
    },
  ],
  test: {
    exclude: ["**/node_modules/**", "**/.direnv/**"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
