import type { ComponentChildren } from "preact";

type ContentCardProps = {
  readonly children: ComponentChildren;
};

export function ContentCard({ children }: ContentCardProps) {
  return (
    <div class="max-w-4xl mx-auto">
      <div class="bg-card border border-border shadow-2xs rounded-xl">
        <div class="px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
