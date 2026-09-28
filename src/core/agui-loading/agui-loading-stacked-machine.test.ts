import { describe, expect, it } from "vitest";

import {
  aguiLoadingStackedReducer,
  initialAGUILoadingStackedState,
  type AGUILoadingStackedEvent,
  type AGUILoadingStackedState,
} from "./agui-loading-stacked-machine";
import { EventType } from "./agui-loading-machine";

function run(events: AGUILoadingStackedEvent[]): AGUILoadingStackedState {
  return events.reduce(aguiLoadingStackedReducer, initialAGUILoadingStackedState);
}

function rows(state: AGUILoadingStackedState) {
  return state.stepOrder.map((id) => {
    const step = state.steps[id]!;
    return `${step.kind}:${step.status}`;
  });
}

const START: AGUILoadingStackedEvent = { type: EventType.RUN_STARTED, runId: "run-1" };
const FINISH: AGUILoadingStackedEvent = { type: EventType.RUN_FINISHED, runId: "run-1" };

function toolCall(id: string): AGUILoadingStackedEvent[] {
  return [
    { type: EventType.TOOL_CALL_START, toolCallId: id, toolCallName: "search" },
    { type: EventType.TOOL_CALL_RESULT, toolCallId: id, content: "ok" },
    { type: EventType.TOOL_CALL_END, toolCallId: id },
  ];
}

function message(id: string, chunks: number): AGUILoadingStackedEvent[] {
  return [
    { type: EventType.TEXT_MESSAGE_START, messageId: id, role: "assistant" },
    ...Array.from({ length: chunks }, () => ({
      type: EventType.TEXT_MESSAGE_CONTENT as const,
      messageId: id,
      delta: "x",
    })),
    { type: EventType.TEXT_MESSAGE_END, messageId: id },
  ];
}

describe("aguiLoadingStackedReducer", () => {
  it("stacks one row per unit of work, in the order it started", () => {
    const state = run([START, ...toolCall("a"), ...toolCall("b"), ...message("m", 3), FINISH]);
    expect(rows(state)).toEqual(["run:done", "tool:done", "tool:done", "message:done"]);
    expect(state.status).toBe("done");
  });

  it("keeps a streaming message as one row no matter how many chunks", () => {
    const state = run([START, ...message("m", 200)]);
    expect(rows(state)).toEqual(["run:done", "message:done"]);
  });

  it("completes the run row as soon as real work starts", () => {
    const state = run([
      START,
      { type: EventType.TOOL_CALL_START, toolCallId: "a", toolCallName: "search" },
    ]);
    expect(rows(state)).toEqual(["run:done", "tool:active"]);
  });

  it("keeps a tool row active until its result arrives", () => {
    const state = run([
      START,
      { type: EventType.TOOL_CALL_START, toolCallId: "a", toolCallName: "search" },
      { type: EventType.TOOL_CALL_END, toolCallId: "a" },
    ]);
    expect(state.steps["tool:a"]?.status).toBe("active");
    expect(state.steps["tool:a"]?.toolCallName).toBe("search");
  });

  it("merges reasoning start and message events into one row", () => {
    const state = run([
      START,
      { type: EventType.REASONING_START, messageId: "r1" },
      { type: EventType.REASONING_MESSAGE_START, messageId: "r1-msg" },
      { type: EventType.REASONING_MESSAGE_CONTENT, messageId: "r1-msg", delta: "hmm" },
      { type: EventType.REASONING_MESSAGE_END, messageId: "r1-msg" },
      { type: EventType.REASONING_END, messageId: "r1" },
    ]);
    expect(rows(state)).toEqual(["run:done", "reasoning:done"]);
  });

  it("fails only the rows still in progress on RUN_ERROR", () => {
    const state = run([
      START,
      ...toolCall("a"),
      { type: EventType.TEXT_MESSAGE_START, messageId: "m", role: "assistant" },
      { type: EventType.RUN_ERROR, message: "boom" },
    ]);
    expect(rows(state)).toEqual(["run:done", "tool:done", "message:failed", "error:failed"]);
    expect(state.error).toEqual({ message: "boom", code: undefined });
  });

  it("still shows the error when every row had already finished", () => {
    // The docs' "Play error" scenario: the tool returns, then the run fails.
    const state = run([
      START,
      ...toolCall("a"),
      { type: EventType.RUN_ERROR, message: "Something went wrong upstream" },
    ]);
    expect(rows(state)).toEqual(["run:done", "tool:done", "error:failed"]);
    expect(state.steps["error"]?.errorMessage).toBe("Something went wrong upstream");
  });

  it("settles open rows as done on RUN_FINISHED", () => {
    const state = run([
      START,
      { type: EventType.TOOL_CALL_START, toolCallId: "a", toolCallName: "search" },
      FINISH,
    ]);
    expect(rows(state)).toEqual(["run:done", "tool:done"]);
  });

  it("ignores events after the run is over", () => {
    const finished = run([START, ...toolCall("a"), FINISH]);
    for (const event of [...toolCall("late"), ...message("late", 1), START]) {
      expect(aguiLoadingStackedReducer(finished, event)).toBe(finished);
    }
  });

  it("doesn't reopen a finished row on a duplicate event", () => {
    const state = run([START, ...toolCall("a"), ...toolCall("a")]);
    expect(rows(state)).toEqual(["run:done", "tool:done"]);
  });
});
