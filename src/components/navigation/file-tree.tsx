import type { FileTreeNode } from "../../core/file-tree.js";
import { FileTreeItems } from "./file-tree-items.js";

type FileTreeProps = {
  readonly nodes: readonly FileTreeNode[];
  readonly currentPath?: string;
};

export function FileTree({ nodes, currentPath }: FileTreeProps) {
  return (
    <ul id="file-tree" class="flex flex-col gap-y-1">
      <FileTreeItems nodes={nodes} currentPath={currentPath} />
    </ul>
  );
}
