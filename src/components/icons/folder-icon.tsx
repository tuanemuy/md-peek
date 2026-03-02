import type { IconProps } from "./svg-base.js";
import { SvgBase } from "./svg-base.js";

export function FolderIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 0-1.69.9L9.6 8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
    </SvgBase>
  );
}
