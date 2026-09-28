import { DocsPageHeader } from "@/modules/docs";

import { AGUILoadingDocsLoadingExample } from "./examples";

export function AGUILoadingDocsLoadingPage() {
  return (
    <div className="flex flex-col gap-8">
      <DocsPageHeader title="Loading">
        <p>
          One line that follows the latest AG-UI event: an icon, text that changes while
          the agent works, and anything you add. It names the subagent behind the latest
          event, and waits on screen when the run stops for an approval. Press Play to
          send fake events.
        </p>
      </DocsPageHeader>
      <AGUILoadingDocsLoadingExample />
    </div>
  );
}
