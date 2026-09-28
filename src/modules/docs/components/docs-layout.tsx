import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

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
        <Button
          size="sm"
          variant="ghost"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
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
