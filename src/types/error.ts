export function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  return new Error(String(value));
}

export type AnyError = {
  readonly type: "any-error";
  readonly message: string;
  readonly cause: Error;
};

export function anyError(message: string, cause: Error): AnyError;
export function anyError(message: string, cause: unknown): AnyError;
export function anyError(message: string, cause: unknown): AnyError {
  return { type: "any-error", message, cause: toError(cause) };
}
