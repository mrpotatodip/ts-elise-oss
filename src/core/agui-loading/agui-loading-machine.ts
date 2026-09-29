import { EventType } from "@ag-ui/core";

// -----
// Pure AG-UI loader state machine. No DOM, no
// fetch, no timers — a (state, event) => state
// reducer that can lift straight into a real
// hook once the model is validated. Everything
// below is real @ag-ui/core event shapes, not a
// simplified stand-in.
// -----

// -----
// Re-exported so adapters import EventType from
// core instead of depending on @ag-ui/core directly.
// -----
export { EventType };

export type AGUILoadingSubagentTag = { subagentRunId?: string };

export type AGUILoadingInterrupt = {
  id: string;
  subagentRunId?: string;
  toolCallId?: string;
  message?: string;
};

export type AGUILoadingResumeEntry = {
  interruptId: string;
  status: "resolved" | "cancelled";
};

export type AGUILoadingRunOutcome =
  | { type: "success"; pendingToolCallIds?: string[] }
  | { type: "interrupt"; interrupts: AGUILoadingInterrupt[] }
  | { type: "cancelled" };

export type AGUILoadingSubagentOutcome =
  | { type: "success" }
  | { type: "suspended"; interruptIds?: string[] };

export type AGUILoadingStreamEvent =
  | {
      type: EventType.RUN_STARTED;
      runId: string;
      threadId?: string;
      parentRunId?: string;
      input?: { resume?: AGUILoadingResumeEntry[] };
    }
  | ({ type: EventType.TEXT_MESSAGE_START; messageId: string; role: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.TEXT_MESSAGE_CONTENT; messageId: string; delta: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.TEXT_MESSAGE_END; messageId: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.TOOL_CALL_START; toolCallId: string; toolCallName: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.TOOL_CALL_RESULT; toolCallId: string; content: string } & AGUILoadingSubagentTag)
  | ({ type: EventType.TOOL_CALL_END; toolCallId: string } & AGUILoadingSubagentTag)
  | { type: EventType.RUN_FINISHED; runId: string; outcome?: AGUILoadingRunOutcome }
  | { type: EventType.RUN_ERROR; message: string; code?: string }
  | {
      type: EventType.SUBAGENT_STARTED;
      subagentRunId: string;
      name: string;
      description?: string;
      parentSubagentRunId?: string;
      parentToolCallId?: string;
    }
  | {
      type: EventType.SUBAGENT_FINISHED;
      subagentRunId: string;
      outcome?: AGUILoadingSubagentOutcome;
    }
  | { type: EventType.SUBAGENT_ERROR; subagentRunId: string; message: string; code?: string };

export type LoadingStatus = "idle" | "running" | "waiting" | "done" | "failed" | "stopped";

export type LoadingMessage = {
  role: string;
  text: string;
  done: boolean;
};

export type LoadingToolCall = {
  toolCallName: string;
  result: string | null;
};

export type AGUILoadingState = {
  status: LoadingStatus;
  runId: string | null;
  lastEventType: EventType | null;
  messages: Record<string, LoadingMessage>;
  messageOrder: string[];
  toolCalls: Record<string, LoadingToolCall>;
  toolCallOrder: string[];
  error: { message: string; code?: string } | null;
  subagentName: string | null;
  subagentNames: Record<string, string>;
  subagentParentIds: Record<string, string>;
  interruptIds: string[];
};

export const initialAGUILoadingState: AGUILoadingState = {
  status: "idle",
  runId: null,
  lastEventType: null,
  messages: {},
  messageOrder: [],
  toolCalls: {},
  toolCallOrder: [],
  error: null,
  subagentName: null,
  subagentNames: {},
  subagentParentIds: {},
  interruptIds: [],
};

// -----
// A run that has finished or errored is over —
// the protocol has nothing left to say. Late
// events (a straggling delta, a retried tool
// call) are dropped instead of reopening state,
// which is the bug the original hook had: its
// "delta" case set status back to "loading"
// unconditionally, no matter what came before.
// -----
function isTerminal(state: AGUILoadingState): boolean {
  return state.status === "done" || state.status === "failed" || state.status === "stopped";
}

type RunStartedEvent = Extract<AGUILoadingStreamEvent, { type: EventType.RUN_STARTED }>;

// -----
// A resume entry for one of our interrupts, else
// (no input echoed) parentRunId naming our run.
// -----
export function continuesWaitingRun(
  waiting: { status: LoadingStatus; runId: string | null; interruptIds: string[] },
  event: RunStartedEvent,
): boolean {
  if (waiting.status !== "waiting") return false;
  const resume = event.input?.resume;
  if (resume?.length) return resume.some((entry) => waiting.interruptIds.includes(entry.interruptId));
  return event.parentRunId !== undefined && event.parentRunId === waiting.runId;
}

// -----
// The name of a subagent run, or null for
// the parent agent (no id).
// -----
function findSubagentName(state: AGUILoadingState, id: string | undefined): string | null {
  return id === undefined ? null : (state.subagentNames[id] ?? null);
}

// -----
// Only a new run gets past a waiting one. Other
// events name their owner in subagentName.
// -----
export function aguiLoadingReducer(
  state: AGUILoadingState,
  event: AGUILoadingStreamEvent,
): AGUILoadingState {
  if (isTerminal(state)) return state;
  if (state.status === "waiting" && event.type !== EventType.RUN_STARTED) return state;

  const next = reduceStreamEvent(state, event);
  if (event.type === EventType.RUN_STARTED || next.status === "waiting") return next;
  if (event.type === EventType.RUN_FINISHED || event.type === EventType.RUN_ERROR) {
    return { ...next, subagentName: null };
  }
  // -----
  // A finished subagent hands the line back to
  // whoever started it: a parent subagent, or none.
  // -----
  if (event.type === EventType.SUBAGENT_FINISHED && event.outcome?.type !== "suspended") {
    const parentId = next.subagentParentIds[event.subagentRunId];
    return { ...next, subagentName: findSubagentName(next, parentId) };
  }
  const ownerId = "subagentRunId" in event ? event.subagentRunId : undefined;
  return { ...next, subagentName: findSubagentName(next, ownerId) };
}

function reduceStreamEvent(
  state: AGUILoadingState,
  event: AGUILoadingStreamEvent,
): AGUILoadingState {
  switch (event.type) {
    case EventType.RUN_STARTED:
      if (continuesWaitingRun(state, event)) {
        return {
          ...state,
          status: "running",
          runId: event.runId,
          lastEventType: event.type,
          interruptIds: [],
          subagentName: null,
        };
      }
      return {
        ...initialAGUILoadingState,
        status: "running",
        runId: event.runId,
        lastEventType: event.type,
      };

    case EventType.SUBAGENT_STARTED:
      return {
        ...state,
        lastEventType: event.type,
        subagentNames: { ...state.subagentNames, [event.subagentRunId]: event.name },
        subagentParentIds:
          event.parentSubagentRunId === undefined
            ? state.subagentParentIds
            : { ...state.subagentParentIds, [event.subagentRunId]: event.parentSubagentRunId },
      };

    case EventType.SUBAGENT_FINISHED:
    case EventType.SUBAGENT_ERROR:
      return { ...state, lastEventType: event.type };

    case EventType.TEXT_MESSAGE_START: {
      if (state.messages[event.messageId]) {
        return { ...state, lastEventType: event.type };
      }
      return {
        ...state,
        lastEventType: event.type,
        messages: {
          ...state.messages,
          [event.messageId]: { role: event.role, text: "", done: false },
        },
        messageOrder: [...state.messageOrder, event.messageId],
      };
    }

    case EventType.TEXT_MESSAGE_CONTENT: {
      // -----
      // Every messageId gets its own buffer. The
      // original hook locked onto whichever message
      // first streamed a `{` and silently dropped
      // deltas for any other id — a preamble message
      // plus the structured answer in the same run
      // would lose one of them.
      // -----
      const existing = state.messages[event.messageId] ?? {
        role: "assistant",
        text: "",
        done: false,
      };
      if (existing.done) return { ...state, lastEventType: event.type };
      return {
        ...state,
        lastEventType: event.type,
        messages: {
          ...state.messages,
          [event.messageId]: { ...existing, text: existing.text + event.delta },
        },
        messageOrder: state.messageOrder.includes(event.messageId)
          ? state.messageOrder
          : [...state.messageOrder, event.messageId],
      };
    }

    case EventType.TEXT_MESSAGE_END: {
      const existing = state.messages[event.messageId];
      if (!existing) return { ...state, lastEventType: event.type };
      return {
        ...state,
        lastEventType: event.type,
        messages: {
          ...state.messages,
          [event.messageId]: { ...existing, done: true },
        },
      };
    }

    case EventType.TOOL_CALL_START: {
      // -----
      // Additive by toolCallId. The original hook
      // reset its whole communications[] list on every
      // TOOL_CALL_START, so a second tool call in the
      // same run wiped out the first call's result.
      // -----
      return {
        ...state,
        lastEventType: event.type,
        toolCalls: {
          ...state.toolCalls,
          [event.toolCallId]: { toolCallName: event.toolCallName, result: null },
        },
        toolCallOrder: state.toolCallOrder.includes(event.toolCallId)
          ? state.toolCallOrder
          : [...state.toolCallOrder, event.toolCallId],
      };
    }

    case EventType.TOOL_CALL_RESULT: {
      const existing = state.toolCalls[event.toolCallId];
      return {
        ...state,
        lastEventType: event.type,
        toolCalls: {
          ...state.toolCalls,
          [event.toolCallId]: {
            toolCallName: existing?.toolCallName ?? "unknown",
            result: event.content,
          },
        },
        toolCallOrder: state.toolCallOrder.includes(event.toolCallId)
          ? state.toolCallOrder
          : [...state.toolCallOrder, event.toolCallId],
      };
    }

    case EventType.TOOL_CALL_END:
      return { ...state, lastEventType: event.type };

    case EventType.RUN_FINISHED: {
      // -----
      // Completion is the protocol's own signal. An
      // interrupt waits for input; cancelled stops.
      // -----
      const outcome = event.outcome;
      if (outcome?.type === "interrupt") {
        const waitingSubagent = outcome.interrupts.find((i) => i.subagentRunId)?.subagentRunId;
        return {
          ...state,
          status: "waiting",
          lastEventType: event.type,
          interruptIds: outcome.interrupts.map((interrupt) => interrupt.id),
          subagentName: waitingSubagent ? (state.subagentNames[waitingSubagent] ?? null) : null,
        };
      }
      const status = outcome?.type === "cancelled" ? "stopped" : "done";
      return { ...state, status, lastEventType: event.type };
    }

    case EventType.RUN_ERROR:
      // -----
      // The bug this exists to fix: the original hook
      // had no RUN_ERROR branch at all, so a mid-stream
      // error left status stuck on "loading" forever.
      // -----
      return {
        ...state,
        status: "failed",
        lastEventType: event.type,
        error: { message: event.message, code: event.code },
      };

    default:
      return state;
  }
}
