import { resolve, sep } from "node:path";

export function isWithinBase(base: string, target: string): boolean {
  const resolvedBase = resolve(base);
  const resolvedTarget = resolve(target);
  const prefix = resolvedBase.endsWith(sep) ? resolvedBase : resolvedBase + sep;
  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(prefix);
}
