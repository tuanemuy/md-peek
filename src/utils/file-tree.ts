import type { Dirent } from "node:fs";
import { readdir, readFile, realpath } from "node:fs/promises";
import { join, relative } from "node:path";
import ignore, { type Ignore } from "ignore";
import type { Result } from "../types/result.js";
import { err, ok, safe } from "../types/result.js";
import { isNodeError } from "./error.js";
import { logger } from "./logger.js";

export type FileTreeNode = {
  readonly name: string;
  readonly path: string;
  readonly type: "file" | "directory";
  readonly children?: readonly FileTreeNode[];
};

const DEFAULT_IGNORE_PATTERNS = [
  ".git/",
  "node_modules/",
  ".next/",
  ".nuxt/",
  ".svelte-kit/",
  "dist/",
  "build/",
  ".cache/",
];

type IgnoreRule = {
  readonly ig: Ignore;
  readonly baseDir: string;
};

async function readGitignore(path: string): Promise<Ignore | null> {
  const result = await safe(
    () => readFile(path, "utf-8"),
    (e) => e,
  );

  if (result.ok) {
    const ig = ignore();
    ig.add(result.value);
    return ig;
  }

  if (!(isNodeError(result.error) && result.error.code === "ENOENT")) {
    logger.warn(`Failed to read .gitignore at ${path}:`, result.error);
  }

  return null;
}

function tryLoadGitignoreFromEntries(
  dir: string,
  entries: readonly Dirent[],
): Promise<Ignore | null> {
  const hasGitignore = entries.some(
    (e) => e.isFile() && e.name === ".gitignore",
  );
  if (!hasGitignore) return Promise.resolve(null);
  return readGitignore(join(dir, ".gitignore"));
}

/**
 * Check whether a path is ignored by any of the loaded .gitignore rules.
 *
 * NOTE: Cross-file negation is not supported.  A negation pattern (`!pattern`)
 * in a child .gitignore will NOT override a match from a parent .gitignore
 * because each rule set is evaluated independently.
 */
function isPathIgnored(
  relPath: string,
  isDir: boolean,
  rules: readonly IgnoreRule[],
): boolean {
  for (const rule of rules) {
    const pathFromBase =
      rule.baseDir === "" ? relPath : relative(rule.baseDir, relPath);
    if (pathFromBase.startsWith("..")) continue;
    const checkPath = isDir ? `${pathFromBase}/` : pathFromBase;
    if (rule.ig.ignores(checkPath)) return true;
  }
  return false;
}

export type BuildTreeError = {
  readonly type: "build-tree-error";
  readonly cause: unknown;
};

export async function buildFileTree(
  rootDir: string,
): Promise<Result<readonly FileTreeNode[], BuildTreeError>> {
  try {
    const defaultIg = ignore();
    defaultIg.add(DEFAULT_IGNORE_PATTERNS);
    const rules: IgnoreRule[] = [{ ig: defaultIg, baseDir: "" }];

    const rootEntries = await readdir(rootDir, { withFileTypes: true });

    const rootGitignore = await tryLoadGitignoreFromEntries(
      rootDir,
      rootEntries,
    );
    if (rootGitignore) {
      rules.push({ ig: rootGitignore, baseDir: "" });
    }

    const rootReal = await realpath(rootDir);
    const visited = new Set<string>([rootReal]);

    const nodes = await processEntries(
      rootEntries,
      rootDir,
      rootDir,
      rules,
      visited,
    );
    return ok(nodes);
  } catch (e) {
    return err({ type: "build-tree-error" as const, cause: e });
  }
}

async function scanDirectory(
  dir: string,
  rootDir: string,
  parentRules: readonly IgnoreRule[],
  visited: Set<string>,
): Promise<FileTreeNode[]> {
  let real: string;
  try {
    real = await realpath(dir);
  } catch {
    // Broken symlink — skip silently as this is expected for dangling links
    return [];
  }
  if (visited.has(real)) {
    return [];
  }
  visited.add(real);

  const entries = await readdir(dir, { withFileTypes: true });

  const localGitignore = await tryLoadGitignoreFromEntries(dir, entries);
  const rules = localGitignore
    ? [...parentRules, { ig: localGitignore, baseDir: relative(rootDir, dir) }]
    : parentRules;

  return processEntries(entries, dir, rootDir, rules, visited);
}

async function processEntries(
  entries: readonly Dirent[],
  dir: string,
  rootDir: string,
  rules: readonly IgnoreRule[],
  visited: Set<string>,
): Promise<FileTreeNode[]> {
  const fileNodes: FileTreeNode[] = [];
  const dirPromises: Promise<FileTreeNode | null>[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = join(dir, entry.name);
    const relPath = relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (isPathIgnored(relPath, true, rules)) continue;

      dirPromises.push(
        scanDirectory(fullPath, rootDir, rules, visited).then((children) =>
          children.length > 0
            ? {
                name: entry.name,
                path: relPath,
                type: "directory" as const,
                children,
              }
            : null,
        ),
      );
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      if (isPathIgnored(relPath, false, rules)) continue;

      fileNodes.push({
        name: entry.name,
        path: relPath,
        type: "file",
      });
    }
  }

  const dirResults = await Promise.all(dirPromises);
  const dirNodes = dirResults.filter(
    (node): node is FileTreeNode => node !== null,
  );

  const nodes = [...dirNodes, ...fileNodes];
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "en");
  });

  return nodes;
}
