import { DocsPageHeader } from "@/modules/docs";

import {
  AGUILoadingDocsLoadingStackedAgentsExample,
  AGUILoadingDocsLoadingStackedExample,
} from "./examples";

export function AGUILoadingDocsLoadingStackedPage() {
  return (
    <div className="flex flex-col gap-8">
      <DocsPageHeader title="Loading Stacked">
        <p>
          One row for each step of the run: tool calls, messages and thinking. Rows
          change to done or failed, and can shrink into one line at the end. Press Play
          to send fake events.
        </p>
      </DocsPageHeader>
      <AGUILoadingDocsLoadingStackedExample />

      <section className="flex flex-col gap-4">
        <div className="flex max-w-3xl flex-col gap-2">
          <h2 className="text-xl font-semibold">Subagents and approvals</h2>
          <p className="text-muted-foreground">
            For agents that hand work to subagents or stop for an approval. Each subagent
            gets its own row, its steps are marked, and rows can wait for an approval and
            pick back up in the next run.
          </p>
        </div>
        <AGUILoadingDocsLoadingStackedAgentsExample />
      </section>
    </div>
  );
}
