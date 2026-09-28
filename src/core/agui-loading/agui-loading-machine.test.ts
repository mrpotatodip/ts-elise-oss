import { describe, expect, it } from "vitest";

import {
  aguiLoadingReducer,
  EventType,
  initialAGUILoadingState,
  type AGUILoadingStreamEvent,
  type AGUILoadingState,
} from "./agui-loading-machine";

function run(
  events: AGUILoadingStreamEvent[],
  from: AGUILoadingState = initialAGUILoadingState,
): AGUILoadingState {
  return events.reduce(aguiLoadingReducer, from);
}

const START: AGUILoadingStreamEvent = { type: EventType.RUN_STARTED, runId: "run-1" };
const FINISH: AGUILoadingStreamEvent = { type: EventType.RUN_FINISHED, runId: "run-1" };

function toolCall(id: string, result: string): AGUILoadingStreamEvent[] {
  return [
    { type: EventType.TOOL_CALL_START, toolCallId: id, toolCallName: "search" },
    { type: EventType.TOOL_CALL_RESULT, toolCallId: id, content: result },
    { type: EventType.TOOL_CALL_END, toolCallId: id },
  ];
}

function message(id: string, text: string): AGUILoadingStreamEvent[] {
  return [
    { type: EventType.TEXT_MESSAGE_START, messageId: id, role: "assistant" },
    { type: EventType.TEXT_MESSAGE_CONTENT, messageId: id, delta: text },
    { type: EventType.TEXT_MESSAGE_END, messageId: id },
  ];
}

describe("aguiLoadingReducer", () => {
  it("happy path finishes with the answer intact", () => {
    const state = run([START, ...toolCall("call-1", "ok"), ...message("msg-1", "Done."), FINISH]);
    expect(state.status).toBe("done");
    expect(state.toolCallOrder).toEqual(["call-1"]);
    expect(state.messages["msg-1"]).toEqual({ role: "assistant", text: "Done.", done: true });
  });

  it("keeps both tool calls in one run", () => {
    const state = run([START, ...toolCall("call-1", "first"), ...toolCall("call-2", "second")]);
    expect(state.toolCallOrder).toEqual(["call-1", "call-2"]);
    expect(state.toolCalls["call-1"]?.result).toBe("first");
    expect(state.toolCalls["call-2"]?.result).toBe("second");
  });

  it("buffers two messages separately", () => {
    const state = run([START, ...message("msg-1", "Looking…"), ...message("msg-2", "{}")]);
    expect(state.messageOrder).toEqual(["msg-1", "msg-2"]);
    expect(state.messages["msg-1"]?.text).toBe("Looking…");
    expect(state.messages["msg-2"]?.text).toBe("{}");
  });

  it("fails on a mid-stream error instead of loading forever", () => {
    const state = run([
      START,
      ...toolCall("call-1", "ok"),
      { type: EventType.RUN_ERROR, message: "boom", code: "E1" },
    ]);
    expect(state.status).toBe("failed");
    expect(state.error).toEqual({ message: "boom", code: "E1" });
  });

  it("ignores events that arrive after the run finished", () => {
    const finished = run([START, ...message("msg-1", "Done."), FINISH]);
    const late: AGUILoadingStreamEvent[] = [
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "msg-1", delta: " again" },
      ...toolCall("call-late", "late"),
      START,
    ];
    for (const event of late) {
      expect(aguiLoadingReducer(finished, event)).toBe(finished);
    }
  });

  it("RUN_STARTED resets a running state", () => {
    const state = run([START, ...toolCall("call-1", "ok"), { ...START, runId: "run-2" }]);
    expect(state.runId).toBe("run-2");
    expect(state.toolCallOrder).toEqual([]);
  });
});
