export function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  return new Error(String(value));
}

export type TypedError<T extends string, P extends object = object> = Readonly<
  { type: T; cause: Error } & Omit<P, "type" | "cause">
>;

export function typedError<T extends string>(
  type: T,
  cause: unknown,
): TypedError<T>;
export function typedError<T extends string, P extends object>(
  type: T,
  cause: unknown,
  props: P,
): TypedError<T, P>;
export function typedError(
  type: string,
  cause: unknown,
  props?: object,
): TypedError<string> {
  return { ...props, type, cause: toError(cause) };
}
