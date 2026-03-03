import { expect } from "vitest";
import type { Result } from "../core/result.js";

export function assertOk<T, E>(result: Result<T, E>): T {
  expect(result.ok).toBe(true);
  return (result as Extract<typeof result, { ok: true }>).value;
}

export function assertErr<T, E>(result: Result<T, E>): E {
  expect(result.ok).toBe(false);
  return (result as Extract<typeof result, { ok: false }>).error;
}
