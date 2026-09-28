import { Link } from "@tanstack/react-router";

import { DOCS_NAV } from "../data";

// The menu: one group per section, one link per page.
export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6 text-sm">
      {DOCS_NAV.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          {group.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              // Only the exact page is active, so "/" doesn't light up everywhere.
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-1.5 text-foreground/70 hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent font-medium text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
