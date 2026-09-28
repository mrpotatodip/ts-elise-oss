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

type SubagentTag = { subagentRunId?: string };

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
  | ({ type: EventType.TEXT_MESSAGE_START; messageId: string; role: string } & SubagentTag)
  | ({ type: EventType.TEXT_MESSAGE_CONTENT; messageId: string; delta: string } & SubagentTag)
  | ({ type: EventType.TEXT_MESSAGE_END; messageId: string } & SubagentTag)
  | ({ type: EventType.TOOL_CALL_START; toolCallId: string; toolCallName: string } & SubagentTag)
  | ({ type: EventType.TOOL_CALL_RESULT; toolCallId: string; content: string } & SubagentTag)
  | ({ type: EventType.TOOL_CALL_END; toolCallId: string } & SubagentTag)
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
  if (resume) return resume.some((entry) => waiting.interruptIds.includes(entry.interruptId));
  return event.parentRunId !== undefined && event.parentRunId === waiting.runId;
}

// -----
// Name of the subagent that owns the event: its
// tag's name, or null for the parent's own events.
// -----
function ownerName(state: AGUILoadingState, event: AGUILoadingStreamEvent): string | null {
  const id = "subagentRunId" in event ? event.subagentRunId : undefined;
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
  // -----
  // An ended run, or a subagent that succeeded, hands
  // the line back to the parent: no name.
  // -----
  const handsBack =
    event.type === EventType.RUN_FINISHED ||
    event.type === EventType.RUN_ERROR ||
    (event.type === EventType.SUBAGENT_FINISHED && event.outcome?.type !== "suspended");
  return { ...next, subagentName: handsBack ? null : ownerName(next, event) };
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
