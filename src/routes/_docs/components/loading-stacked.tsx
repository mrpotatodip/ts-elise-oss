import { createFileRoute } from "@tanstack/react-router";

import { AGUILoadingDocsLoadingStackedPage } from "@/modules/agui-loading-docs";

export const Route = createFileRoute("/_docs/components/loading-stacked")({
  head: () => ({ meta: [{ title: "Loading Stacked · Elise UI" }] }),
  component: AGUILoadingDocsLoadingStackedPage,
});
