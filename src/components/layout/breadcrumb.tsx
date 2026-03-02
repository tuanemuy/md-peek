import { SlashIcon } from "../icons/index.js";

const BREADCRUMB_CLASSES = {
  dirItem: "inline-flex items-center shrink-0",
  dirLink: "text-sm text-muted-foreground hover:text-foreground",
  fileItem:
    "inline-flex items-center text-sm font-semibold text-foreground truncate",
} as const;

const SLASH_ICON_CLASS = "shrink-0 mx-1 size-4 text-muted-foreground" as const;

export type BreadcrumbItem = {
  readonly label: string;
  readonly href?: string;
};

type BreadcrumbProps = {
  readonly items: readonly BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol class="flex items-center min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={item.label}
              class={
                isLast
                  ? BREADCRUMB_CLASSES.fileItem
                  : BREADCRUMB_CLASSES.dirItem
              }
              aria-current={isLast ? "page" : undefined}
            >
              {isLast ? (
                item.label
              ) : (
                <>
                  <a class={BREADCRUMB_CLASSES.dirLink} href={item.href ?? "#"}>
                    {item.label}
                  </a>
                  <SlashIcon class={SLASH_ICON_CLASS} />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
