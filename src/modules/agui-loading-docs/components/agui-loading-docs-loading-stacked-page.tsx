import { DocsPageHeader } from "@/modules/docs";

import { AGUILoadingDocsLoadingStackedExample } from "./examples";

export function AGUILoadingDocsLoadingStackedPage() {
  return (
    <div className="flex flex-col gap-8">
      <DocsPageHeader title="Loading Stacked">
        <p>
          One row for each step of the run: tool calls, messages, thinking and
          subagents. A subagent's own steps are marked, a row can wait for an approval,
          and rows change to done or failed. They can shrink into one line at the end.
          Press Play to send fake events.
        </p>
      </DocsPageHeader>
      <AGUILoadingDocsLoadingStackedExample />
    </div>
  );
}
