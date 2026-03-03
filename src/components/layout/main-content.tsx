import type { ComponentChildren } from "preact";

type MainContentProps = {
  readonly class?: string;
  readonly children: ComponentChildren;
};

export function MainContent({ class: className, children }: MainContentProps) {
  return (
    <main id="main-content" class={className ?? ""}>
      {children}
    </main>
  );
}
