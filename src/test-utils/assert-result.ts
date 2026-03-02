import { expect } from "vitest";
import type { Result } from "../types/result.js";

export function assertOk<T, E>(result: Result<T, E>): T {
  expect(result.ok).toBe(true);
  if (!result.ok)
    throw new Error(`Expected ok but got: ${JSON.stringify(result.error)}`);
  return result.value;
}

export function assertErr<T, E>(result: Result<T, E>): E {
  expect(result.ok).toBe(false);
  if (result.ok)
    throw new Error(`Expected err but got ok: ${JSON.stringify(result.value)}`);
  return result.error;
}
