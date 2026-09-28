import {
  AGUILoadingStacked,
  AGUILoadingStackedStepIcon,
  AGUILoadingStackedSteps,
  AGUILoadingStackedStepSubagent,
  AGUILoadingStackedStepText,
} from "@/core/agui-loading/adapters/react";
import {
  aguiLoadingStackedReducer,
  EventType,
  initialAGUILoadingStackedState,
} from "@/core/agui-loading";

import { useAGUILoadingDocsReplay } from "../../hooks";
import { aguiLoadingDocsAgentPlays } from "../../utils";
import { AGUILoadingDocsCard } from "../agui-loading-docs-card";
import source from "./agui-loading-docs-loading-stacked-agents-example.tsx?raw";

export function AGUILoadingDocsLoadingStackedAgentsExample() {
  // -----
  // Step 1: the same reducer as the basic example.
  // It also gives each subagent its own row, and
  // marks rows that wait for an approval.
  // -----
  const { state, play, playNext, reset } = useAGUILoadingDocsReplay(
    aguiLoadingStackedReducer,
    initialAGUILoadingStackedState,
  );

  return (
    <AGUILoadingDocsCard
      title="Subagents and approvals"
      description="Each subagent gets a row, and its own steps are marked so you can indent them. In tool mode, the tool call becomes the subagent's row. Press Approval, then Approve or Cancel."
      status={state.lastEventType ?? state.status}
      plays={aguiLoadingDocsAgentPlays({ status: state.status, play, playNext })}
      onReset={reset}
      source={source}
    >
      {/* The root stays on screen while the run waits (data-status="waiting"). */}
      <AGUILoadingStacked state={state} className="text-sm text-muted-foreground">
        {/* -----
            Row attributes for agents:
              data-kind="subagent"  a subagent's own row
              data-subagent         set on rows that belong to a subagent
              data-status="waiting" the row waits for an approval
            Here, a subagent's steps are indented.
            ----- */}
        <AGUILoadingStackedSteps rowClassName="group/row data-[subagent]:pl-5 data-[status=done]:text-foreground/60 data-[status=failed]:text-destructive data-[status=waiting]:text-amber-600">
          {/* A waiting row shows a still pause circle. Change it with waitingByEvent. */}
          <AGUILoadingStackedStepIcon className="group-data-[status=done]/row:text-emerald-500" />

          {/* The subagent a row belongs to, e.g. "researcher ·". */}
          <AGUILoadingStackedStepSubagent className="text-foreground/40" />

          {/* -----
              Subagent rows are keyed by SUBAGENT_STARTED.
              waitingByEvent: phrases while the row waits for input
              Rows you don't list show the built-in text, e.g.
              "Delegating to researcher", "Asked researcher".
              ----- */}
          <AGUILoadingStackedStepText
            busyByEvent={{
              [EventType.TOOL_CALL_START]: (step) => [`Calling ${step.toolCallName}...`],
            }}
            waitingByEvent={{
              [EventType.TOOL_CALL_START]: (step) => [`Approve ${step.toolCallName}?`],
            }}
            doneByEvent={{
              [EventType.RUN_STARTED]: "Connected",
              [EventType.TOOL_CALL_START]: (step) => `Checked ${step.toolCallName}`,
            }}
          />
        </AGUILoadingStackedSteps>
      </AGUILoadingStacked>
    </AGUILoadingDocsCard>
  );
}
