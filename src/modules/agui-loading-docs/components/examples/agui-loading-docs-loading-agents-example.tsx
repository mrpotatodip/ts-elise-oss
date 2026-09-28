import { CircleCheck } from "lucide-react";

import {
  AGUILoading,
  AGUILoadingIcon,
  AGUILoadingSubagent,
  AGUILoadingText,
} from "@/core/agui-loading/adapters/react";
import {
  aguiLoadingReducer,
  EventType,
  initialAGUILoadingState,
} from "@/core/agui-loading";

import { useAGUILoadingDocsReplay } from "../../hooks";
import { aguiLoadingDocsAgentPlays } from "../../utils";
import { AGUILoadingDocsCard } from "../agui-loading-docs-card";
import source from "./agui-loading-docs-loading-agents-example.tsx?raw";

export function AGUILoadingDocsLoadingAgentsExample() {
  // -----
  // Step 1: the same reducer as the basic example.
  // It also tracks subagents and approvals for you:
  //   state.subagentName  the subagent behind the latest event
  //   state.status        "waiting" while an approval is pending,
  //                       "stopped" when the run was cancelled
  // -----
  const { state, play, playNext, reset } = useAGUILoadingDocsReplay(
    aguiLoadingReducer,
    initialAGUILoadingState,
  );

  return (
    <AGUILoadingDocsCard
      title="Subagents and approvals"
      description="The same loader with a subagent's name in front of the text. When the run stops for an approval, it waits on screen until the next run. Press Approval, then Approve or Cancel."
      status={state.lastEventType ?? state.status}
      plays={aguiLoadingDocsAgentPlays({ status: state.status, play, playNext })}
      onReset={reset}
      source={source}
    >
      {/* Step 2: pass three more props to the root. */}
      <AGUILoading
        active={state.status === "running"}
        eventType={state.lastEventType}
        // true while the run waits for input, e.g. an approval.
        // The loader stays on screen until the next run, whatever whenDone says.
        waiting={state.status === "waiting"}
        // true when the run was cancelled. Shows the "stopped" text.
        stopped={state.status === "stopped"}
        // The subagent behind the latest event, for <AGUILoadingSubagent />.
        subagent={state.subagentName}
        whenDone="keep"
        // data-presence is "waiting" while it waits.
        className="text-sm text-muted-foreground data-[presence=done]:opacity-60 data-[presence=waiting]:text-amber-600"
      >
        {/* While it waits, the icon is a still pause circle. Change it with the "waiting" key. */}
        <AGUILoadingIcon
          byEvent={{
            [EventType.RUN_FINISHED]: <CircleCheck className="size-3 text-emerald-500" />,
          }}
        />

        {/* The subagent's name, e.g. "researcher ·". Nothing while the parent works. */}
        <AGUILoadingSubagent className="font-medium text-foreground/80" />

        <AGUILoadingText
          byEvent={{
            [EventType.SUBAGENT_STARTED]: ["Handing off..."],
            [EventType.SUBAGENT_FINISHED]: ["Gathering results..."],
            [EventType.TOOL_CALL_START]: ["Using a tool..."],
            [EventType.TEXT_MESSAGE_START]: ["Writing..."],
            [EventType.RUN_FINISHED]: ["Done"],
            // "waiting" and "stopped" are keys too, like "default".
            waiting: ["Waiting for your approval...", "Standing by..."],
            stopped: ["Stopped"],
            default: ["Working on it..."],
          }}
        />
      </AGUILoading>
    </AGUILoadingDocsCard>
  );
}
