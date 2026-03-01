import { register } from "node:module";

register(
  `data:text/javascript,${encodeURIComponent(`
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function load(url, context, nextLoad) {
  if (url.endsWith(".css")) {
    const content = readFileSync(fileURLToPath(url), "utf-8");
    return {
      format: "module",
      source: \`export default \${JSON.stringify(content)};\`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
`)}`,
);
