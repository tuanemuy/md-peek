import { SidebarCloseIcon, SidebarOpenIcon } from "../icons/index.js";
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb.js";
import { ExternalLink } from "./external-link.js";
import { ThemeToggle } from "./theme-toggle.js";

export type { BreadcrumbItem };

type PageHeaderProps = {
  readonly id?: string;
  readonly breadcrumbs: readonly BreadcrumbItem[];
  readonly showSidebarToggle?: boolean;
  readonly onToggleSidebar?: () => void;
  readonly externalLinkHref?: string;
};

export function PageHeader({
  id,
  breadcrumbs,
  showSidebarToggle,
  onToggleSidebar,
  externalLinkHref,
}: PageHeaderProps) {
  return (
    <header
      id={id}
      class="sticky top-0 z-50 bg-background border-b border-border"
    >
      <div class="flex items-center justify-between w-full py-2 px-2 sm:px-5">
        <div class="flex items-center gap-1 min-w-0">
          {showSidebarToggle && (
            <button
              type="button"
              id="sidebar-toggle"
              onClick={onToggleSidebar}
              class="shrink-0 w-7 h-7 inline-flex justify-center items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent cursor-pointer"
            >
              {/* Icon visibility driven by body[data-sidebar-open] via CSS */}
              <SidebarOpenIcon class="shrink-0 size-4" id="icon-sidebar-open" />
              <SidebarCloseIcon
                class="shrink-0 size-4 hidden"
                id="icon-sidebar-close"
              />
            </button>
          )}

          <Breadcrumb items={breadcrumbs} />
        </div>

        <div class="flex items-center gap-1">
          <ThemeToggle />
          {externalLinkHref !== undefined && (
            <ExternalLink href={externalLinkHref} />
          )}
        </div>
      </div>
    </header>
  );
}
