import { DocsCode, DocsCodeBlock, DocsPageHeader, DocsPartReference, DocsSection } from "@/modules/docs";

import { AGUI_LOADING_DOCS_LOADING_PARTS } from "../data";
import { AGUILoadingDocsLoadingAgentsExample, AGUILoadingDocsLoadingExample } from "./examples";

const ANATOMY = `
<AGUILoading>              // the root: shows or hides the line
  <AGUILoadingIcon />      // icon for the latest event
  <AGUILoadingSubagent />  // "researcher ·" when a subagent works
  <AGUILoadingText />      // "Searching..." for the latest event
  <AGUILoadingEvent />     // "TOOL_CALL_START", for debugging
</AGUILoading>
`;

const BY_EVENT = `
<AGUILoadingText
  byEvent={{
    [EventType.TOOL_CALL_START]: ["Searching..."], // this event
    waiting: ["Needs your approval"],              // the run is waiting
    stopped: ["Cancelled"],                        // the run was cancelled
    default: ["Working on it..."],                 // every other event
  }}
/>
`;

export function AGUILoadingDocsLoadingPage() {
  return (
    <div className="flex flex-col gap-10">
      <DocsPageHeader title="Loading">
        <p>
          One line that tells the user what the agent is doing right now. It follows the
          latest AG-UI event, so the text reads "Searching..." during a tool call and
          "Writing..." while the answer streams. Press Run below to send fake events.
        </p>
      </DocsPageHeader>

      <DocsSection
        title="How the parts fit"
        intro={
          <>
            <p>
              The loader is a root with small parts inside. Each part shows one thing. Use
              the parts you want, in any order, and put your own elements between them.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                <DocsCode>aguiLoadingReducer</DocsCode> reads each AG-UI event and keeps
                the state: is the agent running, and what was the last event.
              </li>
              <li>
                <DocsCode>{"<AGUILoading>"}</DocsCode> gets that state as props and decides
                when the line is on screen.
              </li>
              <li>The parts inside read from the root and show the icon, text and so on.</li>
            </ol>
          </>
        }
      >
        <DocsCodeBlock code={ANATOMY} />
      </DocsSection>

      <DocsSection title="Example">
        <AGUILoadingDocsLoadingExample />
      </DocsSection>

      <DocsSection
        title="Choosing text and icons per event"
        intro={
          <>
            <p>
              The icon and the text both take a <DocsCode>byEvent</DocsCode> object. Each
              key is an AG-UI event name, and the value is what to show for that event.
              Three more keys cover the rest:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <DocsCode>waiting</DocsCode> while the run waits for an approval.
              </li>
              <li>
                <DocsCode>stopped</DocsCode> after someone cancels the run.
              </li>
              <li>
                <DocsCode>default</DocsCode> for every event you didn't list.
              </li>
            </ul>
            <p>
              Leave an event out and the part uses its built-in text or icon. Not sure which
              event name to use? Add <DocsCode>{"<AGUILoadingEvent />"}</DocsCode> and it
              prints the name as events arrive.
            </p>
          </>
        }
      >
        <DocsCodeBlock code={BY_EVENT} />
      </DocsSection>

      <DocsSection
        title="Subagents and approvals"
        intro={
          <p>
            For agents that hand work to subagents or stop for an approval. Pass three more
            props to the root: <DocsCode>subagent</DocsCode>, <DocsCode>waiting</DocsCode>{" "}
            and <DocsCode>stopped</DocsCode>. The line then names the subagent behind the
            latest event, and stays on screen while an approval is pending.
          </p>
        }
      >
        <AGUILoadingDocsLoadingAgentsExample />
      </DocsSection>

      <DocsSection
        id="parts"
        title="Parts"
        intro={
          <p>
            Every part also takes the normal props of its HTML element, like{" "}
            <DocsCode>className</DocsCode> and <DocsCode>style</DocsCode>. The parts have no
            colors, so add your own classes. A <span className="text-destructive">*</span>{" "}
            marks a required prop.
          </p>
        }
      >
        {AGUI_LOADING_DOCS_LOADING_PARTS.map((part) => (
          <DocsPartReference key={part.name} part={part} />
        ))}
      </DocsSection>
    </div>
  );
}
