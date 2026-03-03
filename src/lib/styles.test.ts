import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { resolveStyles } from "./styles.js";

const testDir = join(import.meta.dirname, "__test_fixture__");
const customCssPath = join(testDir, "custom.css");
const customCssContent = ".markdown-body { color: red; }";
const xdgDir = join(testDir, "xdg-config");
const xdgCssPath = join(xdgDir, "peek", "style.css");
const xdgCssContent = ".markdown-body { color: blue; }";

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(customCssPath, customCssContent);
  mkdirSync(join(xdgDir, "peek"), { recursive: true });
  writeFileSync(xdgCssPath, xdgCssContent);
});

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => {
  vi.unstubAllEnvs();
  rmSync(testDir, { recursive: true, force: true });
});

describe("resolveStyles", () => {
  it("returns builtin contentCss when no options", async () => {
    const result = await resolveStyles();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.contentCss).toContain(".markdown-body");
  });

  it("loads custom CSS from --css option", async () => {
    const result = await resolveStyles(customCssPath);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.contentCss).toBe(customCssContent);
  });

  it("returns file-not-found error on non-existent CSS file", async () => {
    const result = await resolveStyles("/nonexistent/path.css");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("file-not-found");
  });

  it("loads CSS from XDG_CONFIG_HOME when set", async () => {
    vi.stubEnv("XDG_CONFIG_HOME", xdgDir);
    const result = await resolveStyles();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.contentCss).toBe(xdgCssContent);
  });

  it("--css option takes priority over XDG_CONFIG_HOME", async () => {
    vi.stubEnv("XDG_CONFIG_HOME", xdgDir);
    const result = await resolveStyles(customCssPath);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.contentCss).toBe(customCssContent);
  });

  it("falls back to builtin contentCss when XDG path does not exist", async () => {
    vi.stubEnv("XDG_CONFIG_HOME", join(testDir, "nonexistent-xdg"));
    const result = await resolveStyles();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.contentCss).toContain(".markdown-body");
  });
});
