import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import type { Result } from "../core/result.js";
import { map, ok } from "../core/result.js";
import contentCssDefault from "../styles/content.css?inline";
import type { ReadTextFileError } from "./read-text-file.js";
import { readTextFile } from "./read-text-file.js";

export type ResolvedStyles = {
  readonly contentCss: string;
};

function getXdgConfigPath(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return resolve(xdgConfigHome, "peek", "style.css");
  }
  return resolve(homedir(), ".config", "peek", "style.css");
}

export async function resolveStyles(
  cssOption?: string,
): Promise<Result<ResolvedStyles, ReadTextFileError>> {
  if (cssOption) {
    const cssPath = isAbsolute(cssOption)
      ? cssOption
      : resolve(process.cwd(), cssOption);
    const result = await readTextFile(cssPath);
    return map(result, (contentCss) => ({ contentCss }));
  }

  const xdgPath = getXdgConfigPath();
  const xdgResult = await readTextFile(xdgPath);
  if (xdgResult.ok) {
    return ok({ contentCss: xdgResult.value });
  }
  if (xdgResult.error.type === "read-error") {
    return xdgResult;
  }

  return ok({ contentCss: contentCssDefault });
}
