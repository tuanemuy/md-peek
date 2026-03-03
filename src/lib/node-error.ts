export function isNodeError(e: unknown): e is NodeJS.ErrnoException {
  return (
    e instanceof Error &&
    "code" in e &&
    typeof e.code === "string" &&
    typeof e.message === "string"
  );
}
