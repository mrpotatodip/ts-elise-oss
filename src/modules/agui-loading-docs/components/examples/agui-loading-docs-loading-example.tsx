import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Wrench } from "lucide-react";

import {
  AGUILoading,
  AGUILoadingEvent,
  AGUILoadingIcon,
  AGUILoadingText,
} from "@/core/agui-loading/adapters/react";
import {
  aguiLoadingReducer,
  EventType,
  initialAGUILoadingState,
} from "@/core/agui-loading";

import { useAGUILoadingDocsReplay } from "../../hooks";
import { AGUILoadingDocsCard } from "../agui-loading-docs-card";
import source from "./agui-loading-docs-loading-example.tsx?raw";

// Your own element: seconds since the agent started.
function ElapsedTime({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return <span className="tabular-nums">{seconds}s</span>;
}

export function AGUILoadingDocsLoadingExample() {
  // -----
  // Step 1: keep track of what the agent is doing.
  //
  // In your app, write:
  //   const [state, dispatch] = useReducer(
  //     aguiLoadingReducer,
  //     initialAGUILoadingState,
  //   );
  // then call dispatch(event) for each AG-UI event you
  // receive. Here the docs send fake events for you
  // when you press "Play".
  // -----
  const { state, play, reset } = useAGUILoadingDocsReplay(
    aguiLoadingReducer,
    initialAGUILoadingState,
  );
  const running = state.status === "running";

  return (
    <AGUILoadingDocsCard
      title="<AGUILoading />"
      description="The same loader, built from parts. Put the parts in any order, leave some out, and add your own elements."
      status={state.lastEventType ?? state.status}
      onPlay={() => play("happy-path")}
      onPlayError={() => play("mid-stream-error")}
      onReset={reset}
      source={source}
    >
      {/* Step 2: build the loader from parts. The parts have no colors: add your own classes. */}
      <AGUILoading
        // Required. true while the agent is working.
        active={running}
        // Required. The most recent event.
        eventType={state.lastEventType}
        // What happens when the agent finishes: "linger", "hide" or "keep".
        whenDone="keep"
        // Style each state with data-presence: running, lingering or done.
        className="group text-sm text-muted-foreground data-[presence=done]:opacity-60"
      >
        {/* Icon first. Events you don't list show the fallback spinner. */}
        <AGUILoadingIcon
          byEvent={{
            [EventType.TOOL_CALL_START]: (
              <Wrench className="size-3 animate-pulse" />
            ),
            [EventType.RUN_FINISHED]: (
              <CircleCheck className="size-3 text-emerald-500" />
            ),
            [EventType.RUN_ERROR]: (
              <CircleAlert className="size-3 text-destructive" />
            ),
          }}
        />

        {/* Your own element. CSS hides it when the run is done. */}
        <span className="text-xs text-foreground/40 group-data-[presence=done]:hidden">
          <ElapsedTime running={running} />
        </span>

        {/* Then the text. Add "..." yourself if you want it. */}
        <AGUILoadingText
          animation="slide-up"
          byEvent={{
            [EventType.RUN_STARTED]: ["Waking up..."],
            [EventType.TOOL_CALL_START]: ["Digging through channels..."],
            [EventType.TEXT_MESSAGE_CONTENT]: ["Writing your digest..."],
            [EventType.RUN_FINISHED]: ["Done"],
            [EventType.RUN_ERROR]: ["Something went wrong"],
            default: ["Working on it..."],
          }}
        />

        {/* Optional: the event name, for debugging. Leave it out to hide it. */}
        <AGUILoadingEvent className="font-mono text-xs text-foreground/40" />
      </AGUILoading>
    </AGUILoadingDocsCard>
  );
}
