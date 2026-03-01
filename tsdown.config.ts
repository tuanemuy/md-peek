import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "dist",
  format: "esm",
  clean: true,
  loader: { ".css": "text" },
  banner: "#!/usr/bin/env node\n",
});
