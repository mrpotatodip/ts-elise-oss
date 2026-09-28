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

export type AGUILoadingStreamEvent =
  | { type: EventType.RUN_STARTED; runId: string }
  | { type: EventType.TEXT_MESSAGE_START; messageId: string; role: string }
  | { type: EventType.TEXT_MESSAGE_CONTENT; messageId: string; delta: string }
  | { type: EventType.TEXT_MESSAGE_END; messageId: string }
  | { type: EventType.TOOL_CALL_START; toolCallId: string; toolCallName: string }
  | { type: EventType.TOOL_CALL_RESULT; toolCallId: string; content: string }
  | { type: EventType.TOOL_CALL_END; toolCallId: string }
  | { type: EventType.RUN_FINISHED; runId: string }
  | { type: EventType.RUN_ERROR; message: string; code?: string };

export type LoadingStatus = "idle" | "running" | "done" | "failed";

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
  return state.status === "done" || state.status === "failed";
}

export function aguiLoadingReducer(
  state: AGUILoadingState,
  event: AGUILoadingStreamEvent,
): AGUILoadingState {
  if (isTerminal(state)) return state;

  switch (event.type) {
    case EventType.RUN_STARTED:
      return {
        ...initialAGUILoadingState,
        status: "running",
        runId: event.runId,
        lastEventType: event.type,
      };

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

    case EventType.RUN_FINISHED:
      // -----
      // Completion is the protocol's own signal, not a
      // regex scraped off accumulated JSON text.
      // -----
      return { ...state, status: "done", lastEventType: event.type };

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
