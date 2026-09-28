import { createFileRoute, Outlet } from "@tanstack/react-router";

import { DocsLayout } from "@/modules/docs";

// Pathless layout: every page under src/routes/_docs/ gets the sidebar.
export const Route = createFileRoute("/_docs")({
  component: () => (
    <DocsLayout>
      <Outlet />
    </DocsLayout>
  ),
});
