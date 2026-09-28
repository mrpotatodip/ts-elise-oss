import { DocsPageHeader } from "@/modules/docs";

import { AGUILoadingDocsLoadingAgentsExample, AGUILoadingDocsLoadingExample } from "./examples";

export function AGUILoadingDocsLoadingPage() {
  return (
    <div className="flex flex-col gap-8">
      <DocsPageHeader title="Loading">
        <p>
          One line that follows the latest AG-UI event: an icon, text that changes while
          the agent works, and anything you add. Press Play to send fake events.
        </p>
      </DocsPageHeader>
      <AGUILoadingDocsLoadingExample />

      <section className="flex flex-col gap-4">
        <div className="flex max-w-3xl flex-col gap-2">
          <h2 className="text-xl font-semibold">Subagents and approvals</h2>
          <p className="text-muted-foreground">
            For agents that hand work to subagents or stop for an approval. The loader
            names the subagent behind the latest event, and waits on screen until the next
            run when an approval is pending.
          </p>
        </div>
        <AGUILoadingDocsLoadingAgentsExample />
      </section>
    </div>
  );
}
