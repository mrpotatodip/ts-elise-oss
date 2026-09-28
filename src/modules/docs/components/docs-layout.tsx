import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Github, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DOCS_GITHUB_URL } from "../data";
import { DocsSidebar } from "./docs-sidebar";

// -----
// Sidebar on the left, page on the right. On small
// screens the sidebar hides behind a menu button.
// -----
export function DocsLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-svh">
      {/* Top bar, small screens only. */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <DocsBrand onClick={closeMenu} />
        <div className="flex items-center gap-1">
          <a
            href={DOCS_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="rounded-md p-2 text-foreground/70 hover:bg-accent hover:text-foreground"
          >
            <Github className="size-4" />
          </a>
          <Button
            size="sm"
            variant="ghost"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 top-[57px] bottom-0 z-10 overflow-y-auto bg-background px-4 py-6 md:hidden">
          <DocsSidebar onNavigate={closeMenu} />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-8 overflow-y-auto border-r border-border px-4 py-8 md:flex">
          <DocsBrand />
          <DocsSidebar />
          <a
            href={DOCS_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-auto flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground/70 hover:bg-accent hover:text-foreground"
          >
            <Github className="size-4" />
            GitHub
          </a>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}

function DocsBrand({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="px-3 text-base font-semibold">
      Elise UI
    </Link>
  );
}
