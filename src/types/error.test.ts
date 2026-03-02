import { describe, expect, it } from "vitest";
import { type AnyError, anyError, toError, typedError } from "./error.js";

describe("toError", () => {
  it("returns the same Error instance when given an Error", () => {
    const original = new Error("test");
    expect(toError(original)).toBe(original);
  });

  it("preserves Error subclasses", () => {
    const original = new TypeError("bad type");
    const result = toError(original);
    expect(result).toBe(original);
    expect(result).toBeInstanceOf(TypeError);
  });

  it("wraps a string into an Error", () => {
    const result = toError("something went wrong");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("something went wrong");
  });

  it("wraps a number into an Error via String()", () => {
    const result = toError(42);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("42");
  });

  it("wraps null into an Error", () => {
    const result = toError(null);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("null");
  });

  it("wraps undefined into an Error", () => {
    const result = toError(undefined);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("undefined");
  });
});

describe("typedError", () => {
  it("creates a typed error with cause converted via toError", () => {
    const result = typedError("my-error", "string cause");
    expect(result.type).toBe("my-error");
    expect(result.cause).toBeInstanceOf(Error);
    expect(result.cause.message).toBe("string cause");
  });

  it("preserves an Error cause as-is", () => {
    const cause = new Error("original");
    const result = typedError("my-error", cause);
    expect(result.cause).toBe(cause);
  });

  it("includes extra props when provided", () => {
    const result = typedError("file-error", "boom", { path: "/tmp/x" });
    expect(result.type).toBe("file-error");
    expect(result.path).toBe("/tmp/x");
    expect(result.cause).toBeInstanceOf(Error);
  });
});

describe("anyError", () => {
  it("returns an AnyError with the correct type discriminant", () => {
    const cause = new Error("root cause");
    const result: AnyError = anyError("context message", cause);
    expect(result.type).toBe("any-error");
  });

  it("preserves the message", () => {
    const cause = new Error("root cause");
    const result = anyError("Failed to do X", cause);
    expect(result.message).toBe("Failed to do X");
  });

  it("preserves the cause", () => {
    const cause = new Error("root cause");
    const result = anyError("context", cause);
    expect(result.cause).toBe(cause);
  });

  it("converts an unknown cause to an Error via toError", () => {
    const result = anyError("context", "string cause");
    expect(result.cause).toBeInstanceOf(Error);
    expect(result.cause.message).toBe("string cause");
  });

  it("converts a non-Error object cause to an Error", () => {
    const result = anyError("context", 42);
    expect(result.cause).toBeInstanceOf(Error);
    expect(result.cause.message).toBe("42");
  });
});
