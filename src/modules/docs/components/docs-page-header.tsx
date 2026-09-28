import type { ReactNode } from "react";

// The title and short intro at the top of every page.
export function DocsPageHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="max-w-3xl text-muted-foreground">{children}</div>
    </header>
  );
}
