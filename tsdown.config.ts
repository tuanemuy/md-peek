import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "dist",
  format: "esm",
  clean: true,
  loader: { ".css": "text" },
  outputOptions: {
    banner: "#!/usr/bin/env node",
  },
});
