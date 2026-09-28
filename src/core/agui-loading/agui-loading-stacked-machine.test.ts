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

const subagent = (
  id: string,
  name: string,
  extra: { parentToolCallId?: string; parentSubagentRunId?: string } = {},
): AGUILoadingStackedEvent => ({
  type: EventType.SUBAGENT_STARTED,
  subagentRunId: id,
  name,
  ...extra,
});

const toolStart = (id: string, name: string, subagentRunId?: string): AGUILoadingStackedEvent => ({
  type: EventType.TOOL_CALL_START,
  toolCallId: id,
  toolCallName: name,
  ...(subagentRunId && { subagentRunId }),
});

const toolResult = (id: string, subagentRunId?: string): AGUILoadingStackedEvent => ({
  type: EventType.TOOL_CALL_RESULT,
  toolCallId: id,
  content: "ok",
  ...(subagentRunId && { subagentRunId }),
});

const subagentDone = (id: string): AGUILoadingStackedEvent => ({
  type: EventType.SUBAGENT_FINISHED,
  subagentRunId: id,
});

function step(state: AGUILoadingStackedState, id: string) {
  return state.steps[id]!;
}

describe("aguiLoadingStackedReducer subagents", () => {
  it("adds a named row when a subagent starts, done when it finishes", () => {
    const running = run([START, subagent("sub-1", "researcher")]);
    expect(rows(running)).toEqual(["run:done", "subagent:active"]);
    expect(step(running, "subagent:sub-1").subagentName).toBe("researcher");

    const finished = aguiLoadingStackedReducer(running, subagentDone("sub-1"));
    expect(step(finished, "subagent:sub-1").status).toBe("done");
  });

  it("tags a subagent's own rows with its id and name", () => {
    const state = run([START, subagent("sub-1", "researcher"), toolStart("tc-1", "search", "sub-1")]);
    expect(step(state, "tool:tc-1")).toMatchObject({
      subagentRunId: "sub-1",
      subagentName: "researcher",
    });
  });

  it("leaves the parent's rows untagged", () => {
    const state = run([START, subagent("sub-1", "researcher"), toolStart("tc-1", "search")]);
    expect(step(state, "tool:tc-1")).toMatchObject({ subagentRunId: null, subagentName: null });
  });

  it("tags rows of a subagent that was never announced, with no name", () => {
    const state = run([START, toolStart("tc-1", "search", "sub-9")]);
    expect(step(state, "tool:tc-1")).toMatchObject({ subagentRunId: "sub-9", subagentName: null });
  });

  it("turns the tool call that started a subagent into its row, in place", () => {
    const state = run([
      START,
      toolStart("tc-9", "researcher"),
      toolStart("tc-2", "other"),
      subagent("sub-1", "researcher", { parentToolCallId: "tc-9" }),
      subagentDone("sub-1"),
      toolResult("tc-9"),
    ]);
    expect(state.stepOrder).toEqual(["run", "tool:tc-9", "tool:tc-2"]);
    expect(step(state, "tool:tc-9")).toMatchObject({
      kind: "subagent",
      status: "done",
      subagentRunId: "sub-1",
      subagentName: "researcher",
    });
  });

  it("keeps the parent subagent of a nested subagent", () => {
    const state = run([
      START,
      subagent("sub-1", "researcher"),
      subagent("sub-2", "fetcher", { parentSubagentRunId: "sub-1" }),
    ]);
    expect(step(state, "subagent:sub-2").parentSubagentRunId).toBe("sub-1");
  });

  it("fails only the subagent and its own work when it errors", () => {
    const state = run([
      START,
      subagent("sub-1", "researcher"),
      subagent("sub-2", "seo"),
      subagent("sub-3", "fetcher", { parentSubagentRunId: "sub-1" }),
      toolStart("tc-1", "search", "sub-1"),
      toolStart("tc-3", "fetch", "sub-3"),
      toolStart("tc-2", "rank", "sub-2"),
      toolStart("tc-0", "plan"),
      { type: EventType.SUBAGENT_ERROR, subagentRunId: "sub-1", message: "boom" },
    ]);
    expect(state.status).toBe("running");
    expect(step(state, "subagent:sub-1")).toMatchObject({ status: "failed", errorMessage: "boom" });
    expect(step(state, "subagent:sub-3").status).toBe("failed");
    expect(step(state, "tool:tc-1").status).toBe("failed");
    expect(step(state, "tool:tc-3").status).toBe("failed");
    expect(step(state, "subagent:sub-2").status).toBe("active");
    expect(step(state, "tool:tc-2").status).toBe("active");
    expect(step(state, "tool:tc-0").status).toBe("active");
  });
});

describe("aguiLoadingStackedReducer waiting", () => {
  const waiting = run([
    START,
    subagent("sub-1", "researcher"),
    toolStart("tc-1", "deleteFile", "sub-1"),
    toolStart("tc-0", "plan"),
    {
      type: EventType.SUBAGENT_FINISHED,
      subagentRunId: "sub-1",
      outcome: { type: "suspended", interruptIds: ["int-1"] },
    },
    {
      type: EventType.RUN_FINISHED,
      runId: "run-1",
      outcome: {
        type: "interrupt",
        interrupts: [{ id: "int-1", subagentRunId: "sub-1", toolCallId: "tc-1" }],
      },
    },
  ]);

  it("waits on the rows the interrupts name and finishes the rest", () => {
    expect(waiting.status).toBe("waiting");
    expect(step(waiting, "subagent:sub-1").status).toBe("waiting");
    expect(step(waiting, "tool:tc-1").status).toBe("waiting");
    expect(step(waiting, "tool:tc-0").status).toBe("done");
  });

  it("waits on a parent tool call with no subagent", () => {
    const state = run([
      START,
      toolStart("tc-1", "deleteFile"),
      {
        type: EventType.RUN_FINISHED,
        runId: "run-1",
        outcome: { type: "interrupt", interrupts: [{ id: "int-1", toolCallId: "tc-1" }] },
      },
    ]);
    expect(state.status).toBe("waiting");
    expect(step(state, "tool:tc-1").status).toBe("waiting");
  });

  it("ignores stream events while it waits", () => {
    expect(aguiLoadingStackedReducer(waiting, toolStart("tc-5", "late"))).toBe(waiting);
  });

  it("keeps the rows and reopens resolved ones when the next run resumes", () => {
    const state = aguiLoadingStackedReducer(waiting, {
      type: EventType.RUN_STARTED,
      runId: "run-2",
      input: { resume: [{ interruptId: "int-1", status: "resolved" }] },
    });
    expect(state.status).toBe("running");
    expect(state.runId).toBe("run-2");
    expect(state.stepOrder).toEqual(waiting.stepOrder);
    expect(step(state, "subagent:sub-1").status).toBe("active");
    expect(step(state, "tool:tc-1").status).toBe("active");
    expect(step(state, "tool:tc-0").status).toBe("done");
  });

  it("fails the rows of a cancelled interrupt", () => {
    const state = aguiLoadingStackedReducer(waiting, {
      type: EventType.RUN_STARTED,
      runId: "run-2",
      input: { resume: [{ interruptId: "int-1", status: "cancelled" }] },
    });
    expect(step(state, "tool:tc-1")).toMatchObject({ status: "failed", failReason: "cancelled" });
    expect(step(state, "subagent:sub-1")).toMatchObject({ status: "failed", failReason: "cancelled" });
  });

  it("reopens every waiting row when the next run only names its parent run", () => {
    const state = aguiLoadingStackedReducer(waiting, {
      type: EventType.RUN_STARTED,
      runId: "run-2",
      parentRunId: "run-1",
    });
    expect(step(state, "subagent:sub-1").status).toBe("active");
    expect(step(state, "tool:tc-1").status).toBe("active");
  });

  it("reuses the subagent row when the same subagent starts again", () => {
    const resumed = aguiLoadingStackedReducer(waiting, {
      type: EventType.RUN_STARTED,
      runId: "run-2",
      parentRunId: "run-1",
    });
    const state = aguiLoadingStackedReducer(resumed, subagent("sub-1", "researcher"));
    expect(state.stepOrder).toEqual(waiting.stepOrder);
    expect(step(state, "subagent:sub-1").status).toBe("active");
  });

  it("starts a new list when the next run doesn't continue it", () => {
    const state = aguiLoadingStackedReducer(waiting, { type: EventType.RUN_STARTED, runId: "run-2" });
    expect(rows(state)).toEqual(["run:active"]);
  });
});

describe("aguiLoadingStackedReducer outcomes", () => {
  it("stops a cancelled run and fails its open rows", () => {
    const state = run([
      START,
      toolStart("tc-1", "search"),
      { type: EventType.RUN_FINISHED, runId: "run-1", outcome: { type: "cancelled" } },
    ]);
    expect(state.status).toBe("stopped");
    expect(step(state, "tool:tc-1")).toMatchObject({ status: "failed", failReason: "stopped" });
  });
});
