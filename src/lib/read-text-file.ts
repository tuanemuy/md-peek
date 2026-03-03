import { readFile } from "node:fs/promises";
import { type TypedError, typedError } from "../core/error.js";
import type { Result } from "../core/result.js";
import { safe } from "../core/result.js";
import { isNodeError } from "./node-error.js";

export type FileNotFoundError = TypedError<"file-not-found", { path: string }>;
export type FileReadError = TypedError<"read-error", { path: string }>;
export type ReadTextFileError = FileNotFoundError | FileReadError;

export function readTextFile(
  path: string,
): Promise<Result<string, ReadTextFileError>> {
  return safe(
    () => readFile(path, "utf-8"),
    (e): ReadTextFileError =>
      isNodeError(e) && e.code === "ENOENT"
        ? typedError("file-not-found", e, { path })
        : typedError("read-error", e, { path }),
  );
}
