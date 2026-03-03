export function normalizePath(p: string): string {
  return p ? p.replace(/\\/g, "/") : p;
}

export function getFileNameFromPath(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const parts = trimmed.split("/");
  return parts[parts.length - 1] || path;
}
