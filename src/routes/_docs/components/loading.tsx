import { createFileRoute } from "@tanstack/react-router";

import { AGUILoadingDocsLoadingPage } from "@/modules/agui-loading-docs";

export const Route = createFileRoute("/_docs/components/loading")({
  head: () => ({ meta: [{ title: "Loading · Elise UI" }] }),
  component: AGUILoadingDocsLoadingPage,
});
