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

const subagentStarted = (id: string, name: string): AGUILoadingStreamEvent => ({
  type: EventType.SUBAGENT_STARTED,
  subagentRunId: id,
  name,
});

const taggedTool = (toolCallId: string, subagentRunId?: string): AGUILoadingStreamEvent => ({
  type: EventType.TOOL_CALL_START,
  toolCallId,
  toolCallName: "search",
  ...(subagentRunId && { subagentRunId }),
});

const interrupted = (
  interrupts: { id: string; subagentRunId?: string; toolCallId?: string }[],
): AGUILoadingStreamEvent => ({
  type: EventType.RUN_FINISHED,
  runId: "run-1",
  outcome: { type: "interrupt", interrupts },
});

describe("aguiLoadingReducer subagents", () => {
  it("names the subagent that sent the latest event", () => {
    const state = run([START, subagentStarted("sub-1", "researcher"), taggedTool("tc-1", "sub-1")]);
    expect(state.lastEventType).toBe(EventType.TOOL_CALL_START);
    expect(state.subagentName).toBe("researcher");
  });

  it("clears the name when the parent sends an untagged event", () => {
    const state = run([START, subagentStarted("sub-1", "researcher"), taggedTool("tc-1")]);
    expect(state.subagentName).toBeNull();
  });

  it("follows the owner of each event when subagents run in parallel", () => {
    const state = run([
      START,
      subagentStarted("sub-1", "researcher"),
      subagentStarted("sub-2", "seo"),
      taggedTool("tc-1", "sub-1"),
      taggedTool("tc-2", "sub-2"),
    ]);
    expect(state.subagentName).toBe("seo");
  });

  it("has no name for a subagent that was never announced", () => {
    const state = run([START, taggedTool("tc-1", "sub-9")]);
    expect(state.status).toBe("running");
    expect(state.subagentName).toBeNull();
  });

  it("drops the name when the subagent finishes, and when the run ends", () => {
    const finished = run([
      START,
      subagentStarted("sub-1", "researcher"),
      { type: EventType.SUBAGENT_FINISHED, subagentRunId: "sub-1" },
    ]);
    expect(finished.subagentName).toBeNull();

    const ended = run([START, subagentStarted("sub-1", "researcher"), FINISH]);
    expect(ended.subagentName).toBeNull();
  });

  it("keeps the name of a subagent that suspends", () => {
    const state = run([
      START,
      subagentStarted("sub-1", "researcher"),
      {
        type: EventType.SUBAGENT_FINISHED,
        subagentRunId: "sub-1",
        outcome: { type: "suspended", interruptIds: ["int-1"] },
      },
    ]);
    expect(state.subagentName).toBe("researcher");
  });

  it("keeps the run going when a subagent fails", () => {
    const state = run([
      START,
      subagentStarted("sub-1", "researcher"),
      { type: EventType.SUBAGENT_ERROR, subagentRunId: "sub-1", message: "boom" },
    ]);
    expect(state.status).toBe("running");
    expect(state.lastEventType).toBe(EventType.SUBAGENT_ERROR);
    expect(state.subagentName).toBe("researcher");
  });
});

describe("aguiLoadingReducer waiting", () => {
  const waiting = run([
    START,
    subagentStarted("sub-1", "researcher"),
    taggedTool("tc-1", "sub-1"),
    {
      type: EventType.SUBAGENT_FINISHED,
      subagentRunId: "sub-1",
      outcome: { type: "suspended", interruptIds: ["int-1"] },
    },
    interrupted([{ id: "int-1", subagentRunId: "sub-1", toolCallId: "tc-1" }]),
  ]);

  it("waits when the run ends with an interrupt", () => {
    expect(waiting.status).toBe("waiting");
    expect(waiting.interruptIds).toEqual(["int-1"]);
    expect(waiting.subagentName).toBe("researcher");
  });

  it("waits for a parent interrupt with no subagent", () => {
    const state = run([START, taggedTool("tc-1"), interrupted([{ id: "int-1", toolCallId: "tc-1" }])]);
    expect(state.status).toBe("waiting");
    expect(state.subagentName).toBeNull();
  });

  it("ignores stream events while it waits", () => {
    expect(aguiLoadingReducer(waiting, taggedTool("tc-2"))).toBe(waiting);
  });

  it("continues when the next run resumes one of its interrupts", () => {
    const state = aguiLoadingReducer(waiting, {
      type: EventType.RUN_STARTED,
      runId: "run-2",
      input: { resume: [{ interruptId: "int-1", status: "resolved" }] },
    });
    expect(state.status).toBe("running");
    expect(state.runId).toBe("run-2");
    expect(state.interruptIds).toEqual([]);
    expect(state.toolCallOrder).toEqual(["tc-1"]);
  });

  it("continues when the next run names it as its parent run", () => {
    const state = aguiLoadingReducer(waiting, {
      type: EventType.RUN_STARTED,
      runId: "run-2",
      parentRunId: "run-1",
    });
    expect(state.status).toBe("running");
    expect(state.toolCallOrder).toEqual(["tc-1"]);
  });

  it("starts fresh when the next run doesn't continue it", () => {
    const state = aguiLoadingReducer(waiting, { type: EventType.RUN_STARTED, runId: "run-2" });
    expect(state.status).toBe("running");
    expect(state.toolCallOrder).toEqual([]);
    expect(state.subagentName).toBeNull();
  });
});

describe("aguiLoadingReducer outcomes", () => {
  it("stops when the run is cancelled", () => {
    const state = run([
      START,
      { type: EventType.RUN_FINISHED, runId: "run-1", outcome: { type: "cancelled" } },
    ]);
    expect(state.status).toBe("stopped");
  });

  it("finishes on a success outcome", () => {
    const state = run([
      START,
      { type: EventType.RUN_FINISHED, runId: "run-1", outcome: { type: "success" } },
    ]);
    expect(state.status).toBe("done");
  });
});
