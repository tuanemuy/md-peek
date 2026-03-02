import { describe, expect, it } from "vitest";
import {
  err,
  flatMap,
  getOr,
  map,
  mapError,
  match,
  ok,
  type Result,
  safe,
} from "./result.js";

describe("ok / err", () => {
  it("ok creates a success result", () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("err creates a failure result", () => {
    const result = err("failure");
    expect(result).toEqual({ ok: false, error: "failure" });
  });
});

describe("map", () => {
  it("transforms the value of an ok result", () => {
    const result: Result<number, string> = ok(2);
    expect(map(result, (v) => v * 3)).toEqual(ok(6));
  });

  it("passes through an err result unchanged", () => {
    const result: Result<number, string> = err("fail");
    expect(map(result, (v) => v * 3)).toEqual(err("fail"));
  });
});

describe("flatMap", () => {
  it("chains ok results", () => {
    const result: Result<number, string> = ok(2);
    expect(flatMap(result, (v) => ok(v * 3))).toEqual(ok(6));
  });

  it("chains ok to err", () => {
    const result: Result<number, string> = ok(2);
    expect(flatMap(result, () => err("oops"))).toEqual(err("oops"));
  });

  it("passes through an err result without calling fn", () => {
    const result: Result<number, string> = err("fail");
    expect(flatMap(result, (v) => ok(v * 3))).toEqual(err("fail"));
  });
});

describe("mapError", () => {
  it("transforms the error of an err result", () => {
    const result: Result<number, string> = err("fail");
    expect(mapError(result, (e) => e.toUpperCase())).toEqual(err("FAIL"));
  });

  it("passes through an ok result unchanged", () => {
    const result: Result<number, string> = ok(42);
    expect(mapError(result, (e) => e.toUpperCase())).toEqual(ok(42));
  });
});

describe("match", () => {
  it("calls ok handler for ok result", () => {
    const result: Result<number, string> = ok(42);
    const output = match(result, {
      ok: (v) => `value: ${v}`,
      err: (e) => `error: ${e}`,
    });
    expect(output).toBe("value: 42");
  });

  it("calls err handler for err result", () => {
    const result: Result<number, string> = err("fail");
    const output = match(result, {
      ok: (v) => `value: ${v}`,
      err: (e) => `error: ${e}`,
    });
    expect(output).toBe("error: fail");
  });
});

describe("getOr", () => {
  it("returns the value for ok result", () => {
    const result: Result<number, string> = ok(42);
    expect(getOr(result, 0)).toBe(42);
  });

  it("returns the default value for err result", () => {
    const result: Result<number, string> = err("fail");
    expect(getOr(result, 0)).toBe(0);
  });
});

describe("safe", () => {
  it("returns ok when the async function succeeds", async () => {
    const result = await safe(
      () => Promise.resolve(42),
      (e) => String(e),
    );
    expect(result).toEqual(ok(42));
  });

  it("returns err when the async function throws", async () => {
    const result = await safe(
      () => Promise.reject(new Error("boom")),
      (e) => (e instanceof Error ? e.message : "unknown"),
    );
    expect(result).toEqual(err("boom"));
  });
});
