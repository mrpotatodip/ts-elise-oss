import {
  EventType,
  type AGUILoadingStreamEvent,
  type LoadingStatus,
} from "./agui-loading-machine";

// -----
// Separate reducer for the stacked loader. It reads
// the same AG-UI events as aguiLoadingReducer but keeps
// its own state, so the single-line loader's state and
// tests never change because of this one.
// -----

export type AGUILoadingStackedEvent =
  | AGUILoadingStreamEvent
  | { type: EventType.REASONING_START; messageId: string }
  | { type: EventType.REASONING_MESSAGE_START; messageId: string }
  | { type: EventType.REASONING_MESSAGE_CONTENT; messageId: string; delta: string }
  | { type: EventType.REASONING_MESSAGE_END; messageId: string }
  | { type: EventType.REASONING_END; messageId: string };

// "error" is the row RUN_ERROR adds so the failure is always visible,
// even when every other row had already finished.
export type AGUILoadingStackedStepKind =
  | "run"
  | "tool"
  | "message"
  | "reasoning"
  | "error";

export type AGUILoadingStackedStepStatus = "active" | "done" | "failed";

// -----
// One row per unit of work, not per event — a message
// streams hundreds of CONTENT deltas but stays one row
// that updates in place until TEXT_MESSAGE_END.
// -----
export type AGUILoadingStackedStep = {
  id: string;
  kind: AGUILoadingStackedStepKind;
  status: AGUILoadingStackedStepStatus;
  // Latest event for this step — drives its captions and icon.
  eventType: EventType;
  toolCallName: string | null;
  // Set on the "error" row only — RUN_ERROR's message.
  errorMessage: string | null;
};

export type AGUILoadingStackedState = {
  status: LoadingStatus;
  runId: string | null;
  lastEventType: EventType | null;
  steps: Record<string, AGUILoadingStackedStep>;
  stepOrder: string[];
  error: { message: string; code?: string } | null;
};

export const initialAGUILoadingStackedState: AGUILoadingStackedState = {
  status: "idle",
  runId: null,
  lastEventType: null,
  steps: {},
  stepOrder: [],
  error: null,
};

const RUN_STEP_ID = "run";
const ERROR_STEP_ID = "error";

// Prefixed so a toolCallId and a messageId can never collide.
const toolStepId = (toolCallId: string) => `tool:${toolCallId}`;
const messageStepId = (messageId: string) => `message:${messageId}`;
const reasoningStepId = (messageId: string) => `reasoning:${messageId}`;

function isTerminal(state: AGUILoadingStackedState): boolean {
  return state.status === "done" || state.status === "failed";
}

// -----
// Adds the step if it's new, otherwise updates it in
// place. Any real work starting also completes the
// run's own "getting started" row.
// -----
function upsertStep(
  state: AGUILoadingStackedState,
  id: string,
  kind: AGUILoadingStackedStepKind,
  eventType: EventType,
  patch: Partial<AGUILoadingStackedStep> = {},
): AGUILoadingStackedState {
  const existing = state.steps[id];
  if (existing && existing.status !== "active") {
    return { ...state, lastEventType: eventType };
  }
  const steps = { ...state.steps };
  const runStep = steps[RUN_STEP_ID];
  if (kind !== "run" && runStep?.status === "active") {
    steps[RUN_STEP_ID] = { ...runStep, status: "done" };
  }
  steps[id] = {
    ...(existing ?? { id, kind, status: "active", toolCallName: null, errorMessage: null }),
    eventType,
    ...patch,
  };
  return {
    ...state,
    lastEventType: eventType,
    steps,
    stepOrder: existing ? state.stepOrder : [...state.stepOrder, id],
  };
}

function settleActiveSteps(
  state: AGUILoadingStackedState,
  status: Exclude<AGUILoadingStackedStepStatus, "active">,
): Record<string, AGUILoadingStackedStep> {
  const steps = { ...state.steps };
  for (const id of state.stepOrder) {
    const step = steps[id]!;
    if (step.status === "active") steps[id] = { ...step, status };
  }
  return steps;
}

// -----
// REASONING_START and REASONING_MESSAGE_START may or
// may not share a messageId. When a reasoning event's
// id has no step yet, it joins the reasoning step
// that's already open instead of stacking a second row.
// -----
function reasoningTarget(state: AGUILoadingStackedState, messageId: string): string {
  const id = reasoningStepId(messageId);
  if (state.steps[id]) return id;
  const open = [...state.stepOrder]
    .reverse()
    .find((stepId) => {
      const step = state.steps[stepId]!;
      return step.kind === "reasoning" && step.status === "active";
    });
  return open ?? id;
}

export function aguiLoadingStackedReducer(
  state: AGUILoadingStackedState,
  event: AGUILoadingStackedEvent,
): AGUILoadingStackedState {
  if (isTerminal(state)) return state;

  switch (event.type) {
    case EventType.RUN_STARTED:
      return upsertStep(
        { ...initialAGUILoadingStackedState, status: "running", runId: event.runId },
        RUN_STEP_ID,
        "run",
        event.type,
      );

    case EventType.TOOL_CALL_START:
      return upsertStep(state, toolStepId(event.toolCallId), "tool", event.type, {
        toolCallName: event.toolCallName,
      });

    // A result is what the user waited for, so it completes the row;
    // TOOL_CALL_END alone (args done, result pending) keeps it active.
    case EventType.TOOL_CALL_RESULT:
      return upsertStep(state, toolStepId(event.toolCallId), "tool", event.type, {
        status: "done",
      });

    case EventType.TOOL_CALL_END:
      return upsertStep(state, toolStepId(event.toolCallId), "tool", event.type);

    case EventType.TEXT_MESSAGE_START:
    case EventType.TEXT_MESSAGE_CONTENT:
      return upsertStep(state, messageStepId(event.messageId), "message", event.type);

    case EventType.TEXT_MESSAGE_END:
      return upsertStep(state, messageStepId(event.messageId), "message", event.type, {
        status: "done",
      });

    case EventType.REASONING_START:
    case EventType.REASONING_MESSAGE_START:
    case EventType.REASONING_MESSAGE_CONTENT:
      return upsertStep(state, reasoningTarget(state, event.messageId), "reasoning", event.type);

    case EventType.REASONING_MESSAGE_END:
    case EventType.REASONING_END:
      return upsertStep(state, reasoningTarget(state, event.messageId), "reasoning", event.type, {
        status: "done",
      });

    // Anything still open when the run ends is treated as finished.
    case EventType.RUN_FINISHED:
      return {
        ...state,
        status: "done",
        lastEventType: event.type,
        steps: settleActiveSteps(state, "done"),
      };

    // -----
    // Rows still in progress fail; finished rows stay
    // done. The error also gets its own row — without
    // it, an error arriving after every row finished
    // (a tool returned, then the run failed) would leave
    // a stack that looks like a clean success.
    // -----
    case EventType.RUN_ERROR:
      return {
        ...state,
        status: "failed",
        lastEventType: event.type,
        steps: {
          ...settleActiveSteps(state, "failed"),
          [ERROR_STEP_ID]: {
            id: ERROR_STEP_ID,
            kind: "error",
            status: "failed",
            eventType: event.type,
            toolCallName: null,
            errorMessage: event.message,
          },
        },
        stepOrder: [...state.stepOrder, ERROR_STEP_ID],
        error: { message: event.message, code: event.code },
      };

    default:
      return state;
  }
}
