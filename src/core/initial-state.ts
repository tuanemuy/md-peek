import type { ContentType } from "./content-type.js";
import type { FileTreeNode } from "./file-tree.js";

export type DirectoryInitialState = {
  readonly mode: "directory";
  readonly dirTitle: string;
  readonly currentPath: string;
  readonly contentType: ContentType;
  readonly content: string;
  readonly tree: readonly FileTreeNode[];
};

export type FileInitialState = {
  readonly mode: "file";
  readonly content: string;
};

export type InitialState = DirectoryInitialState | FileInitialState;
