import { describe, expect, it } from "vitest";

import {
  aguiLoadingReducer,
  aguiLoadingStackedReducer,
  initialAGUILoadingStackedState,
  initialAGUILoadingState,
  type AGUILoadingStackedState,
} from "@/core/agui-loading";

import { aguiLoadingDocsScenarioEvents } from "../utils";

function stacked(...scenarioIds: string[]): AGUILoadingStackedState {
  return scenarioIds
    .flatMap(aguiLoadingDocsScenarioEvents)
    .reduce(aguiLoadingStackedReducer, initialAGUILoadingStackedState);
}

function rows(state: AGUILoadingStackedState) {
  return state.stepOrder.map((id) => `${state.steps[id]!.kind}:${state.steps[id]!.status}`);
}

describe("docs subagent scenarios", () => {
  it("subagent: one named subagent row owns the work", () => {
    const state = stacked("subagent");
    expect(state.status).toBe("done");
    expect(rows(state)).toEqual(["run:done", "subagent:done", "tool:done", "message:done"]);
    expect(state.steps["tool:call-1"]!.subagentName).toBe("researcher");
  });

  it("tool mode: the tool row becomes the subagent row", () => {
    const state = stacked("subagent-tool-mode");
    expect(rows(state)).toEqual(["run:done", "subagent:done", "message:done", "message:done"]);
  });

  it("parallel: both subagents finish", () => {
    const state = stacked("subagents-parallel");
    expect(state.steps["subagent:sub-1"]!.status).toBe("done");
    expect(state.steps["subagent:sub-2"]!.status).toBe("done");
  });

  it("approval: waits, then approve or cancel continues the same rows", () => {
    const waiting = stacked("subagent-approval");
    expect(waiting.status).toBe("waiting");
    expect(rows(waiting)).toEqual(["run:done", "subagent:waiting", "tool:waiting"]);

    const approved = stacked("subagent-approval", "subagent-approval-approved");
    expect(approved.status).toBe("done");
    expect(rows(approved)).toEqual(["run:done", "subagent:done", "tool:done"]);

    const cancelled = stacked("subagent-approval", "subagent-approval-cancelled");
    expect(rows(cancelled)).toEqual(["run:done", "subagent:failed", "tool:failed", "message:done"]);
    expect(cancelled.steps["tool:call-1"]!.failReason).toBe("cancelled");
  });

  it("the single-line loader waits and names the subagent", () => {
    const state = aguiLoadingDocsScenarioEvents("subagent-approval").reduce(
      aguiLoadingReducer,
      initialAGUILoadingState,
    );
    expect(state.status).toBe("waiting");
    expect(state.subagentName).toBe("cleaner");
  });
});
