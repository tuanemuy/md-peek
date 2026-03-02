import { readFile } from "node:fs/promises";
import type { Result } from "../types/result.js";
import { safe } from "../types/result.js";
import { isNodeError } from "./error.js";

type FileNotFoundError = {
  readonly type: "file-not-found";
  readonly path: string;
};

type FileReadError = {
  readonly type: "read-error";
  readonly path: string;
  readonly cause: unknown;
};

export type ReadFileError = FileNotFoundError | FileReadError;

export function readMarkdownFile(
  path: string,
): Promise<Result<string, ReadFileError>> {
  return safe(
    () => readFile(path, "utf-8"),
    (e): ReadFileError =>
      isNodeError(e) && e.code === "ENOENT"
        ? { type: "file-not-found", path }
        : { type: "read-error", path, cause: e },
  );
}
