import { createFileRoute } from "@tanstack/react-router";

import { DocsInstallation } from "@/modules/docs";

export const Route = createFileRoute("/_docs/installation")({
  head: () => ({ meta: [{ title: "Installation · Elise UI" }] }),
  component: DocsInstallation,
});
