import type { ReactNode } from "react";

// A titled block of text under the page header.
export function DocsSection({
  id,
  title,
  intro,
  children,
}: {
  id?: string;
  title: string;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex max-w-3xl flex-col gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {intro && <div className="flex flex-col gap-2 text-muted-foreground">{intro}</div>}
      </div>
      {children}
    </section>
  );
}

// Inline code in running text.
export function DocsCode({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>;
}
