import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { DOCS_NAV } from "../data";

// The menu: one group per section, one link per page.
export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6 text-sm">
      {DOCS_NAV.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[17px] font-semibold text-foreground">
            {group.title}
          </p>
          {group.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              // Only the exact page is active, so "/" doesn't light up everywhere.
              activeOptions={{ exact: true }}
              className="relative flex items-center py-1.5 pr-3 pl-7 text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
              activeProps={{ className: "font-medium text-foreground" }}
            >
              {({ isActive }) => (
                <>
                  {/* Sits in the left padding, so the label doesn't move. */}
                  {isActive && <ChevronRight aria-hidden className="absolute left-2 size-3" />}
                  {item.label}
                </>
              )}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
