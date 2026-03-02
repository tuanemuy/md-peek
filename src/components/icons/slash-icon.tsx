import type { IconProps } from "./svg-base.js";
import { SvgBase } from "./svg-base.js";

export function SlashIcon(props: IconProps) {
  return (
    <SvgBase {...props} width="16" height="16" viewBox="0 0 16 16">
      <path d="M6 13L10 3" stroke-linecap="round" />
    </SvgBase>
  );
}
