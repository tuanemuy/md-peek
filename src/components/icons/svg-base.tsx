import type { Child } from "hono/jsx";

export type IconProps = {
  readonly id?: string;
  readonly class?: string;
  readonly "data-chevron"?: boolean;
};

type SvgBaseProps = IconProps & {
  readonly children: Child;
  readonly width?: string | number;
  readonly height?: string | number;
  readonly viewBox?: string;
};

export function SvgBase({
  class: className,
  children,
  width = "24",
  height = "24",
  viewBox = "0 0 24 24",
  ...rest
}: SvgBaseProps) {
  return (
    <svg
      {...rest}
      class={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {children}
    </svg>
  );
}
