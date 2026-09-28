import {
  CircleAlert,
  CircleCheck,
  Inbox,
  Search,
  type LucideIcon,
} from "lucide-react";

import {
  AGUILoadingStacked,
  AGUILoadingStackedEarlier,
  AGUILoadingStackedStepIcon,
  AGUILoadingStackedSteps,
  AGUILoadingStackedStepText,
  AGUILoadingStackedSummaryDone,
  AGUILoadingStackedSummaryFailed,
} from "@/core/agui-loading/adapters/react";
import {
  aguiLoadingStackedReducer,
  EventType,
  initialAGUILoadingStackedState,
} from "@/core/agui-loading";

import { useAGUILoadingDocsReplay } from "../../hooks";
import { AGUILoadingDocsCard } from "../agui-loading-docs-card";
import source from "./agui-loading-docs-loading-stacked-example.tsx?raw";

// An icon for each tool, found by the tool's name.
const TOOL_ICONS: Record<string, LucideIcon> = {
  listCommunications: Inbox,
  searchChannels: Search,
};

export function AGUILoadingDocsLoadingStackedExample() {
  // -----
  // Step 1: keep track of what the agent is doing.
  //
  // In your app, write:
  //   const [state, dispatch] = useReducer(
  //     aguiLoadingStackedReducer,
  //     initialAGUILoadingStackedState,
  //   );
  // then call dispatch(event) for each AG-UI event you
  // receive. Here the docs send fake events for you
  // when you press "Play".
  // -----
  const { state, play, reset } = useAGUILoadingDocsReplay(
    aguiLoadingStackedReducer,
    initialAGUILoadingStackedState,
  );

  return (
    <AGUILoadingDocsCard
      title="<AGUILoadingStacked />"
      description="The stacked loader, built from parts. Write one row; it repeats for each step. The parts have no colors: style rows with data-status and data-kind."
      status={state.lastEventType ?? state.status}
      onPlay={() => play("two-tool-calls")}
      onPlayError={() => play("mid-stream-error")}
      onReset={reset}
      source={source}
    >
      {/* Step 2: build the loader from parts. Put them in any order. */}
      <AGUILoadingStacked
        // Required. The state from step 1.
        state={state}
        // Show only the 4 newest rows.
        maxVisible={4}
        // When the agent finishes:
        //   "keep"     the rows stay (default)
        //   "collapse" the rows shrink into one line
        //   "hide"     everything goes away
        // whenDone="collapse"
        // Wait this many milliseconds before "collapse" or "hide".
        // lingerMs={1500}
        className="text-sm text-muted-foreground"
      >
        {/* Shows "+2 earlier" when some rows don't fit. */}
        <AGUILoadingStackedEarlier className="pl-5 text-xs text-foreground/40" />

        {/* -----
            One row. Write it one time; it repeats for each step.
            Each row has two attributes you can style with:
              data-status: active, done or failed
              data-kind:   run, tool, message, reasoning or error
            ----- */}
        <AGUILoadingStackedSteps rowClassName="group/row data-[status=done]:text-foreground/60 data-[status=failed]:text-destructive">
          {/* -----
              The icon. Pick one per event that started the row.
              busyByEvent: while the row works
              doneByEvent / failedByEvent: when it ends
              Rows you don't list show a spinner, a check or "!".
              ----- */}
          <AGUILoadingStackedStepIcon
            className="group-data-[status=done]/row:text-emerald-500"
            busyByEvent={{
              // A function gets the row, so each tool can have its own icon.
              [EventType.TOOL_CALL_START]: (step) => {
                const ToolIcon = TOOL_ICONS[step.toolCallName ?? ""];
                return ToolIcon ? (
                  <ToolIcon className="size-3 animate-pulse" />
                ) : undefined;
              },
            }}
          />

          {/* -----
              The text. Same keys as the icon.
              busyByEvent: phrases that change while the row works
              doneByEvent: the text when the row is finished
              Rows you don't list show the built-in text.
              ----- */}
          <AGUILoadingStackedStepText
            busyByEvent={{
              [EventType.TOOL_CALL_START]: (step) => [
                `Calling ${step.toolCallName}...`,
              ],
              [EventType.TEXT_MESSAGE_START]: ["Writing your answer..."],
            }}
            doneByEvent={{
              [EventType.RUN_STARTED]: "Connected",
              [EventType.TOOL_CALL_START]: (step) =>
                `Checked ${step.toolCallName}`,
              [EventType.TEXT_MESSAGE_START]: "Answer ready",
            }}
          />

          {/* Your own element. This one shows "tool" on tool rows only. */}
          <span className="hidden text-xs text-foreground/40 group-data-[kind=tool]/row:inline">
            tool
          </span>
        </AGUILoadingStackedSteps>

        {/* -----
            The one line after the rows collapse.
            SummaryDone shows when the run finished.
            SummaryFailed shows when the run failed.
            text: your words. A function gets the number of steps.
            children: an icon before the text.
            ----- */}
        <AGUILoadingStackedSummaryDone
          text={(steps) => `Done · ${steps} steps`}
        >
          <CircleCheck className="size-3 text-emerald-500" />
        </AGUILoadingStackedSummaryDone>

        <AGUILoadingStackedSummaryFailed
          text={(steps) => `Stopped after ${steps} steps`}
        >
          <CircleAlert className="size-3 text-destructive" />
        </AGUILoadingStackedSummaryFailed>
      </AGUILoadingStacked>
    </AGUILoadingDocsCard>
  );
}
