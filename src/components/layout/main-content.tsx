import type { Child } from "hono/jsx";

type MainContentProps = {
  readonly class?: string;
  readonly children: Child;
};

export function MainContent({ class: className, children }: MainContentProps) {
  return (
    <main id="main-content" class={className ?? ""}>
      {children}
    </main>
  );
}
