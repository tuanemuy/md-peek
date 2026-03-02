import { readFile } from "node:fs/promises";
import { toError } from "../types/error.js";
import type { Result } from "../types/result.js";
import { safe } from "../types/result.js";
import { isNodeError } from "./error.js";

export type FileNotFoundError = {
  readonly type: "file-not-found";
  readonly path: string;
};

export type FileReadError = {
  readonly type: "read-error";
  readonly path: string;
  readonly cause: Error;
};

export type ReadTextFileError = FileNotFoundError | FileReadError;

export function readTextFile(
  path: string,
): Promise<Result<string, ReadTextFileError>> {
  return safe(
    () => readFile(path, "utf-8"),
    (e): ReadTextFileError =>
      isNodeError(e) && e.code === "ENOENT"
        ? { type: "file-not-found", path }
        : { type: "read-error", path, cause: toError(e) },
  );
}
