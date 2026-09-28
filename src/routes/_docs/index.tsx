import { createFileRoute } from "@tanstack/react-router";

import { DocsIntroduction } from "@/modules/docs";

export const Route = createFileRoute("/_docs/")({
  head: () => ({ meta: [{ title: "Introduction · Elise UI" }] }),
  component: DocsIntroduction,
});
