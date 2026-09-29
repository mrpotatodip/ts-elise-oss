import {
  continuesWaitingRun,
  EventType,
  type AGUILoadingInterrupt,
  type AGUILoadingResumeEntry,
  type AGUILoadingStreamEvent,
  type AGUILoadingSubagentTag,
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
  | ({ type: EventType.REASONING_START; messageId: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.REASONING_MESSAGE_START; messageId: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.REASONING_MESSAGE_CONTENT; messageId: string; delta: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.REASONING_MESSAGE_END; messageId: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.REASONING_END; messageId: string } & AGUILoadingSubagentTag);

// "error" is the row RUN_ERROR adds so the failure is always visible,
// even when every other row had already finished.
export type AGUILoadingStackedStepKind =
  | "run"
  | "tool"
  | "message"
  | "reasoning"
  | "subagent"
  | "error";

export type AGUILoadingStackedStepStatus = "active" | "waiting" | "done" | "failed";

export type AGUILoadingStackedFailReason = "stopped" | "cancelled";

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
  // Set on the "error" row, and on a failed subagent row.
  errorMessage: string | null;
  subagentRunId: string | null;
  subagentName: string | null;
  parentSubagentRunId: string | null;
  failReason: AGUILoadingStackedFailReason | null;
};

export type AGUILoadingStackedState = {
  status: LoadingStatus;
  runId: string | null;
  lastEventType: EventType | null;
  steps: Record<string, AGUILoadingStackedStep>;
  stepOrder: string[];
  error: { message: string; code?: string } | null;
  subagentNames: Record<string, string>;
  subagentStepIds: Record<string, string>;
  interruptIds: string[];
  interruptStepIds: Record<string, string[]>;
};

export const initialAGUILoadingStackedState: AGUILoadingStackedState = {
  status: "idle",
  runId: null,
  lastEventType: null,
  steps: {},
  stepOrder: [],
  error: null,
  subagentNames: {},
  subagentStepIds: {},
  interruptIds: [],
  interruptStepIds: {},
};

const RUN_STEP_ID = "run";
const ERROR_STEP_ID = "error";

// Prefixed so a toolCallId and a messageId can never collide.
const toolStepId = (toolCallId: string) => `tool:${toolCallId}`;
const messageStepId = (messageId: string) => `message:${messageId}`;
const reasoningStepId = (messageId: string) => `reasoning:${messageId}`;
const subagentStepId = (subagentRunId: string) => `subagent:${subagentRunId}`;

type StepOwner = Pick<AGUILoadingStackedStep, "subagentRunId" | "subagentName">;

const PARENT_OWNER: StepOwner = { subagentRunId: null, subagentName: null };

function isTerminal(state: AGUILoadingStackedState): boolean {
  return state.status === "done" || state.status === "failed" || state.status === "stopped";
}

// -----
// The subagent a tagged event belongs to, with its
// name if SUBAGENT_STARTED announced it.
// -----
function findOwner(state: AGUILoadingStackedState, event: AGUILoadingStackedEvent): StepOwner {
  const id = "subagentRunId" in event ? event.subagentRunId : undefined;
  if (id === undefined) return PARENT_OWNER;
  return { subagentRunId: id, subagentName: state.subagentNames[id] ?? null };
}

// -----
// Adds the step if new, else updates it in place.
// Real work also completes the run's own row.
// -----
function upsertStep(
  state: AGUILoadingStackedState,
  id: string,
  kind: AGUILoadingStackedStepKind,
  eventType: EventType,
  patch: Partial<AGUILoadingStackedStep> = {},
  owner: StepOwner = PARENT_OWNER,
): AGUILoadingStackedState {
  const existing = state.steps[id];
  if (existing && existing.status !== "active" && existing.status !== "waiting") {
    return { ...state, lastEventType: eventType };
  }
  const steps = { ...state.steps };
  const runStep = steps[RUN_STEP_ID];
  if (kind !== "run" && runStep?.status === "active") {
    steps[RUN_STEP_ID] = { ...runStep, status: "done" };
  }
  steps[id] = {
    ...(existing ?? {
      id,
      kind,
      status: "active",
      toolCallName: null,
      errorMessage: null,
      parentSubagentRunId: null,
      failReason: null,
      ...owner,
    }),
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

function updateSteps(
  state: AGUILoadingStackedState,
  update: (step: AGUILoadingStackedStep) => AGUILoadingStackedStep,
): Record<string, AGUILoadingStackedStep> {
  const steps = { ...state.steps };
  for (const id of state.stepOrder) steps[id] = update(steps[id]!);
  return steps;
}

// -----
// Ends every open row: working, or waiting on a
// suspended subagent that no interrupt followed.
// -----
function settleOpenSteps(
  state: AGUILoadingStackedState,
  status: "done" | "failed",
  failReason: AGUILoadingStackedFailReason | null = null,
): Record<string, AGUILoadingStackedStep> {
  return updateSteps(state, (step) =>
    step.status === "active" || step.status === "waiting" ? { ...step, status, failReason } : step,
  );
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

// -----
// The subagent and every subagent nested under it,
// found through parentSubagentRunId links.
// -----
function collectSubagentFamily(state: AGUILoadingStackedState, rootId: string): Set<string> {
  const family = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const id of state.stepOrder) {
      const step = state.steps[id]!;
      const child = step.kind === "subagent" ? step.subagentRunId : null;
      if (child && step.parentSubagentRunId && family.has(step.parentSubagentRunId) && !family.has(child)) {
        family.add(child);
        grew = true;
      }
    }
  }
  return family;
}

// -----
// Reuses the tool call that started it (tool mode),
// or its own row after a resume; else a new row.
// -----
function startSubagent(
  state: AGUILoadingStackedState,
  event: Extract<AGUILoadingStackedEvent, { type: EventType.SUBAGENT_STARTED }>,
): AGUILoadingStackedState {
  const parentToolStepId =
    event.parentToolCallId !== undefined ? toolStepId(event.parentToolCallId) : undefined;
  const id =
    state.subagentStepIds[event.subagentRunId] ??
    (parentToolStepId && state.steps[parentToolStepId]
      ? parentToolStepId
      : subagentStepId(event.subagentRunId));
  const next = upsertStep(
    state,
    id,
    "subagent",
    event.type,
    {
      kind: "subagent",
      status: "active",
      subagentRunId: event.subagentRunId,
      subagentName: event.name,
      parentSubagentRunId: event.parentSubagentRunId ?? null,
    },
  );
  return {
    ...next,
    subagentNames: { ...next.subagentNames, [event.subagentRunId]: event.name },
    subagentStepIds: { ...next.subagentStepIds, [event.subagentRunId]: id },
  };
}

// -----
// The run waits: rows the interrupts name wait with
// it, the rest of the open rows are done.
// -----
function waitForInterrupts(
  state: AGUILoadingStackedState,
  eventType: EventType,
  interrupts: AGUILoadingInterrupt[],
): AGUILoadingStackedState {
  const interruptStepIds: Record<string, string[]> = {};
  for (const interrupt of interrupts) {
    const ids: string[] = [];
    const subagentRow =
      interrupt.subagentRunId !== undefined ? state.subagentStepIds[interrupt.subagentRunId] : undefined;
    if (subagentRow) ids.push(subagentRow);
    const toolRow = interrupt.toolCallId !== undefined ? toolStepId(interrupt.toolCallId) : undefined;
    if (toolRow && state.steps[toolRow] && toolRow !== subagentRow) ids.push(toolRow);
    interruptStepIds[interrupt.id] = ids;
  }
  const waitingIds = new Set(Object.values(interruptStepIds).flat());
  return {
    ...state,
    status: "waiting",
    lastEventType: eventType,
    steps: updateSteps(state, (step) => {
      if (waitingIds.has(step.id)) return { ...step, status: "waiting" };
      return step.status === "active" ? { ...step, status: "done" } : step;
    }),
    interruptIds: interrupts.map((interrupt) => interrupt.id),
    interruptStepIds,
  };
}

// -----
// Picks the waiting run back up: a cancelled
// interrupt fails its rows, the rest are active.
// -----
function resumeRun(
  state: AGUILoadingStackedState,
  runId: string,
  resume: AGUILoadingResumeEntry[] | undefined,
): AGUILoadingStackedState {
  const cancelledIds = new Set(
    (resume ?? [])
      .filter((entry) => entry.status === "cancelled")
      .flatMap((entry) => state.interruptStepIds[entry.interruptId] ?? []),
  );
  return {
    ...state,
    status: "running",
    runId,
    lastEventType: EventType.RUN_STARTED,
    steps: updateSteps(state, (step) => {
      if (step.status !== "waiting") return step;
      return cancelledIds.has(step.id)
        ? { ...step, status: "failed", failReason: "cancelled" }
        : { ...step, status: "active" };
    }),
    interruptIds: [],
    interruptStepIds: {},
  };
}

// -----
// A waiting run is closed but not over: only a new
// run gets through, and it may resume this one.
// -----
export function aguiLoadingStackedReducer(
  state: AGUILoadingStackedState,
  event: AGUILoadingStackedEvent,
): AGUILoadingStackedState {
  if (isTerminal(state)) return state;
  if (state.status === "waiting" && event.type !== EventType.RUN_STARTED) return state;

  switch (event.type) {
    case EventType.RUN_STARTED:
      if (continuesWaitingRun(state, event)) {
        return resumeRun(state, event.runId, event.input?.resume);
      }
      return upsertStep(
        { ...initialAGUILoadingStackedState, status: "running", runId: event.runId },
        RUN_STEP_ID,
        "run",
        event.type,
      );

    case EventType.TOOL_CALL_START:
      return upsertStep(
        state,
        toolStepId(event.toolCallId),
        "tool",
        event.type,
        { toolCallName: event.toolCallName },
        findOwner(state, event),
      );

    // A result is what the user waited for, so it completes the row;
    // TOOL_CALL_END alone (args done, result pending) keeps it active.
    case EventType.TOOL_CALL_RESULT:
      return upsertStep(
        state,
        toolStepId(event.toolCallId),
        "tool",
        event.type,
        { status: "done" },
        findOwner(state, event),
      );

    case EventType.TOOL_CALL_END:
      return upsertStep(
        state,
        toolStepId(event.toolCallId),
        "tool",
        event.type,
        {},
        findOwner(state, event),
      );

    case EventType.TEXT_MESSAGE_START:
    case EventType.TEXT_MESSAGE_CONTENT:
      return upsertStep(
        state,
        messageStepId(event.messageId),
        "message",
        event.type,
        {},
        findOwner(state, event),
      );

    case EventType.TEXT_MESSAGE_END:
      return upsertStep(
        state,
        messageStepId(event.messageId),
        "message",
        event.type,
        { status: "done" },
        findOwner(state, event),
      );

    case EventType.REASONING_START:
    case EventType.REASONING_MESSAGE_START:
    case EventType.REASONING_MESSAGE_CONTENT:
      return upsertStep(
        state,
        reasoningTarget(state, event.messageId),
        "reasoning",
        event.type,
        {},
        findOwner(state, event),
      );

    case EventType.REASONING_MESSAGE_END:
    case EventType.REASONING_END:
      return upsertStep(
        state,
        reasoningTarget(state, event.messageId),
        "reasoning",
        event.type,
        { status: "done" },
        findOwner(state, event),
      );

    case EventType.SUBAGENT_STARTED:
      return startSubagent(state, event);

    // A suspended subagent waits for input; any other end is done.
    case EventType.SUBAGENT_FINISHED: {
      const id = state.subagentStepIds[event.subagentRunId];
      if (!id) return { ...state, lastEventType: event.type };
      const status = event.outcome?.type === "suspended" ? "waiting" : "done";
      return upsertStep(state, id, "subagent", event.type, { status });
    }

    // -----
    // Only this subagent and its own work fail. The
    // run, the parent and other subagents go on.
    // -----
    case EventType.SUBAGENT_ERROR: {
      const family = collectSubagentFamily(state, event.subagentRunId);
      const id = state.subagentStepIds[event.subagentRunId];
      const failed: AGUILoadingStackedState = {
        ...state,
        lastEventType: event.type,
        steps: updateSteps(state, (step) =>
          step.status === "active" && step.subagentRunId !== null && family.has(step.subagentRunId)
            ? { ...step, status: "failed" }
            : step,
        ),
      };
      if (!id) return failed;
      return {
        ...failed,
        steps: {
          ...failed.steps,
          [id]: { ...failed.steps[id]!, eventType: event.type, errorMessage: event.message },
        },
      };
    }

    // -----
    // Anything still open when the run ends is done;
    // an interrupt waits, a cancelled run stops.
    // -----
    case EventType.RUN_FINISHED: {
      const outcome = event.outcome;
      if (outcome?.type === "interrupt") {
        return waitForInterrupts(state, event.type, outcome.interrupts);
      }
      if (outcome?.type === "cancelled") {
        return {
          ...state,
          status: "stopped",
          lastEventType: event.type,
          steps: settleOpenSteps(state, "failed", "stopped"),
        };
      }
      return {
        ...state,
        status: "done",
        lastEventType: event.type,
        steps: settleOpenSteps(state, "done"),
      };
    }

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
          ...settleOpenSteps(state, "failed"),
          [ERROR_STEP_ID]: {
            id: ERROR_STEP_ID,
            kind: "error",
            status: "failed",
            eventType: event.type,
            toolCallName: null,
            errorMessage: event.message,
            parentSubagentRunId: null,
            failReason: null,
            ...PARENT_OWNER,
          },
        },
        stepOrder: [...state.stepOrder, ERROR_STEP_ID],
        error: { message: event.message, code: event.code },
      };

    default:
      return state;
  }
}
