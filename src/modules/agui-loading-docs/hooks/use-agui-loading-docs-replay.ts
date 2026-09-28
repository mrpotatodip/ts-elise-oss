import { useEffect, useReducer, useState } from "react";

import type { AGUILoadingStreamEvent } from "@/core/agui-loading";

import { aguiLoadingDocsScenarioEvents } from "../utils";

// Long enough for a typing caption to finish before the next event.
const PLAY_STEP_MS = 1400;

type ReplayAction = { kind: "event"; event: AGUILoadingStreamEvent } | { kind: "reset" };

// -----
// Docs-only: feeds a scenario's events into whichever
// core reducer you pass, one every PLAY_STEP_MS. In an
// app you'd useReducer(reducer, initialState) and
// dispatch real AG-UI events instead.
// -----
export function useAGUILoadingDocsReplay<TState>(
  reducer: (state: TState, event: AGUILoadingStreamEvent) => TState,
  initialState: TState,
) {
  const [state, send] = useReducer(
    (current: TState, action: ReplayAction) =>
      action.kind === "reset" ? initialState : reducer(current, action.event),
    initialState,
  );
  const [queue, setQueue] = useState<readonly AGUILoadingStreamEvent[]>([]);

  useEffect(() => {
    const [next, ...rest] = queue;
    if (!next) return;
    const id = setTimeout(() => {
      send({ kind: "event", event: next });
      setQueue(rest);
    }, PLAY_STEP_MS);
    return () => clearTimeout(id);
  }, [queue]);

  function dispatch(event: AGUILoadingStreamEvent) {
    send({ kind: "event", event });
  }

  function reset() {
    setQueue([]);
    send({ kind: "reset" });
  }

  function play(scenarioId: string) {
    reset();
    setQueue(aguiLoadingDocsScenarioEvents(scenarioId));
  }

  // -----
  // Plays a scenario on top of the current state, e.g.
  // the run that answers an approval.
  // -----
  function playNext(scenarioId: string) {
    setQueue(aguiLoadingDocsScenarioEvents(scenarioId));
  }

  return { state, dispatch, reset, play, playNext, playing: queue.length > 0 };
}
