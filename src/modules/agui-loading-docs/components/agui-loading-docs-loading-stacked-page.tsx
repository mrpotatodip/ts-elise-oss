import { DocsCode, DocsCodeBlock, DocsPageHeader, DocsPartReference, DocsSection } from "@/modules/docs";

import { AGUI_LOADING_DOCS_LOADING_STACKED_PARTS } from "../data";
import {
  AGUILoadingDocsLoadingStackedAgentsExample,
  AGUILoadingDocsLoadingStackedExample,
} from "./examples";

const ANATOMY = `
<AGUILoadingStacked>                    // the root: takes the whole state
  <AGUILoadingStackedEarlier />         // "+2 earlier" when rows are hidden
  <AGUILoadingStackedSteps>             // the list: repeats one row per step
    <AGUILoadingStackedStepIcon />      //   spinner, check or "!" for this row
    <AGUILoadingStackedStepSubagent />  //   "researcher ·" on a subagent's rows
    <AGUILoadingStackedStepText />      //   "Calling searchChannels..."
  </AGUILoadingStackedSteps>
  <AGUILoadingStackedSummaryDone />     // one line after a finished run collapses
  <AGUILoadingStackedSummaryFailed />   // one line after a failed run collapses
</AGUILoadingStacked>
`;

const ROW_KINDS: { kind: string; event: string; example: string }[] = [
  { kind: "run", event: "RUN_STARTED", example: "The agent connects" },
  { kind: "tool", event: "TOOL_CALL_START", example: "One tool call, like searchChannels" },
  { kind: "message", event: "TEXT_MESSAGE_START", example: "The agent writes its answer" },
  { kind: "reasoning", event: "REASONING_START", example: "The agent thinks" },
  { kind: "subagent", event: "SUBAGENT_STARTED", example: "A subagent takes over some work" },
  { kind: "error", event: "RUN_ERROR", example: "The run failed" },
];

export function AGUILoadingDocsLoadingStackedPage() {
  return (
    <div className="flex flex-col gap-10">
      <DocsPageHeader title="Loading Stacked">
        <p>
          A list with one row for each step of the run: tool calls, messages and thinking.
          Rows turn to done or failed as they finish, so the user sees the whole run, not
          only the latest event. Press Run below to send fake events.
        </p>
      </DocsPageHeader>

      <DocsSection
        title="How the parts fit"
        intro={
          <>
            <p>
              Same idea as Loading, with one more layer. The root holds the run. Inside it,{" "}
              <DocsCode>{"<AGUILoadingStackedSteps>"}</DocsCode> is the list. You write the
              inside of one row, and the list repeats it for every step.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                <DocsCode>aguiLoadingStackedReducer</DocsCode> reads each AG-UI event and
                keeps a list of steps.
              </li>
              <li>
                <DocsCode>{"<AGUILoadingStacked>"}</DocsCode> gets the whole state in one{" "}
                <DocsCode>state</DocsCode> prop.
              </li>
              <li>
                Row parts (<DocsCode>StepIcon</DocsCode>, <DocsCode>StepText</DocsCode>,{" "}
                <DocsCode>StepSubagent</DocsCode>) go inside Steps and show one row each.
                The other parts go straight inside the root.
              </li>
            </ol>
          </>
        }
      >
        <DocsCodeBlock code={ANATOMY} />
      </DocsSection>

      <DocsSection title="Example">
        <AGUILoadingDocsLoadingStackedExample />
      </DocsSection>

      <DocsSection
        title="What makes a row"
        intro={
          <>
            <p>
              A row is one piece of work, not one event. A message streams hundreds of
              events but stays one row. The event that starts a row is its key in every{" "}
              <DocsCode>...ByEvent</DocsCode> prop, and <DocsCode>default</DocsCode> covers
              the rows you don't list.
            </p>
          </>
        }
      >
        <div className="my-10 overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">data-kind</th>
                <th className="pb-2 pr-4 font-medium">Key in ...ByEvent</th>
                <th className="pb-2 font-medium">The row appears when</th>
              </tr>
            </thead>
            <tbody>
              {ROW_KINDS.map((row) => (
                <tr key={row.kind} className="border-t border-border/60">
                  <td className="py-2 pr-4 font-mono text-xs">{row.kind}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                    EventType.{row.event}
                  </td>
                  <td className="py-2 text-foreground/80">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-3xl text-muted-foreground">
          Each row also has a status: <DocsCode>active</DocsCode> while it works,{" "}
          <DocsCode>waiting</DocsCode> during an approval, then <DocsCode>done</DocsCode> or{" "}
          <DocsCode>failed</DocsCode>. That's why the icon and text have four props each,
          one per status: <DocsCode>busyByEvent</DocsCode>, <DocsCode>waitingByEvent</DocsCode>,{" "}
          <DocsCode>doneByEvent</DocsCode> and <DocsCode>failedByEvent</DocsCode>.
        </p>
      </DocsSection>

      <DocsSection
        title="Subagents and approvals"
        intro={
          <p>
            For agents that hand work to subagents or stop for an approval. The reducer
            tracks both for you, so the root needs no extra props. Each subagent gets its own
            row, its steps carry its name, and rows can wait for an approval and pick back
            up in the next run.
          </p>
        }
      >
        <AGUILoadingDocsLoadingStackedAgentsExample />
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
        {AGUI_LOADING_DOCS_LOADING_STACKED_PARTS.map((part) => (
          <DocsPartReference key={part.name} part={part} />
        ))}
      </DocsSection>
    </div>
  );
}
