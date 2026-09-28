import { describe, expect, it } from "vitest";

import {
  stackedStepWaitingTexts,
  stackedStepBusyTexts,
  stackedStepSettledText,
  stackedStepValue,
  stackedSummaryText,
} from "./agui-loading-stacked-captions";
import { LOADING_TEXTS_BY_EVENT } from "./agui-loading-captions";
import { initialAGUILoadingStackedState } from "./agui-loading-stacked-machine";
import type { AGUILoadingStackedStep } from "./agui-loading-stacked-machine";
import { EventType } from "./agui-loading-machine";

const tool: AGUILoadingStackedStep = {
  id: "tool:a",
  kind: "tool",
  status: "done",
  eventType: EventType.TOOL_CALL_RESULT,
  toolCallName: "search",
  errorMessage: null,
  subagentRunId: null,
  subagentName: null,
  parentSubagentRunId: null,
  failReason: null,
};

describe("stackedStepSettledText", () => {
  it("is null while the step is active", () => {
    expect(stackedStepSettledText({ ...tool, status: "active" })).toBeNull();
  });

  it("names the tool in the default done and failed text", () => {
    expect(stackedStepSettledText(tool)).toBe("Called search");
    expect(stackedStepSettledText({ ...tool, status: "failed" })).toBe("Stopped calling search");
  });

  it("uses overrides keyed by the row's opening event, as text or a function", () => {
    expect(
      stackedStepSettledText(tool, { doneTextsByEvent: { [EventType.TOOL_CALL_START]: "Looked it up" } }),
    ).toBe("Looked it up");
    expect(
      stackedStepSettledText(tool, {
        doneTextsByEvent: { [EventType.TOOL_CALL_START]: (s) => `Ran ${s.toolCallName}` },
      }),
    ).toBe("Ran search");
  });

  it("falls back to the override's default before the built-in text", () => {
    expect(stackedStepSettledText(tool, { doneTextsByEvent: { default: "Done" } })).toBe("Done");
    expect(
      stackedStepSettledText(tool, { doneTextsByEvent: { [EventType.RUN_STARTED]: "Ready" } }),
    ).toBe("Called search");
  });

  it("shows the error message on the error row, overridable by RUN_ERROR", () => {
    const error: AGUILoadingStackedStep = {
      id: "error",
      kind: "error",
      status: "failed",
      eventType: EventType.RUN_ERROR,
      toolCallName: null,
      errorMessage: "Upstream timed out",
      subagentRunId: null,
      subagentName: null,
      parentSubagentRunId: null,
      failReason: null,
    };
    expect(stackedStepSettledText(error)).toBe("Upstream timed out");
    expect(
      stackedStepSettledText(error, { failedTextsByEvent: { [EventType.RUN_ERROR]: "Try again" } }),
    ).toBe("Try again");
  });

  it("keys failed rows the same way", () => {
    const failed = { ...tool, status: "failed" as const };
    expect(
      stackedStepSettledText(failed, { failedTextsByEvent: { [EventType.TOOL_CALL_START]: "Lookup failed" } }),
    ).toBe("Lookup failed");
  });
});

describe("stackedStepValue", () => {
  it("calls a function entry with the row", () => {
    const icons = {
      [EventType.TOOL_CALL_START]: (step: AGUILoadingStackedStep) =>
        step.toolCallName === "search" ? "magnifier" : "wrench",
    };
    expect(stackedStepValue(tool, icons)).toBe("magnifier");
    expect(stackedStepValue({ ...tool, toolCallName: "other" }, icons)).toBe("wrench");
  });

  it("keeps an explicit null", () => {
    expect(stackedStepValue(tool, { [EventType.TOOL_CALL_START]: null })).toBeNull();
  });

  it("looks up by the row's opening event, then default", () => {
    expect(stackedStepValue(tool, { [EventType.TOOL_CALL_START]: "wrench" })).toBe("wrench");
    expect(stackedStepValue(tool, { default: "check" })).toBe("check");
    expect(stackedStepValue(tool, { [EventType.RUN_STARTED]: "x" })).toBeUndefined();
  });
});

describe("stackedStepBusyTexts", () => {
  const busy = { ...tool, status: "active" as const, eventType: EventType.TOOL_CALL_END };

  it("keys by the opening event, not the latest one", () => {
    const texts = { [EventType.TOOL_CALL_START]: ["Looking it up"] };
    expect(stackedStepBusyTexts(busy, texts)).toEqual(["Looking it up"]);
  });

  it("accepts a function of the row", () => {
    const texts = {
      [EventType.TOOL_CALL_START]: (step: AGUILoadingStackedStep) => [
        `Running ${step.toolCallName}`,
      ],
    };
    expect(stackedStepBusyTexts(busy, texts)).toEqual(["Running search"]);
  });

  it("falls back to the built-in captions for the opening event", () => {
    expect(stackedStepBusyTexts(busy, undefined)).toEqual(
      LOADING_TEXTS_BY_EVENT[EventType.TOOL_CALL_START],
    );
  });
});

describe("stackedSummaryText", () => {
  it("counts steps and reflects the outcome", () => {
    const base = { ...initialAGUILoadingStackedState, stepOrder: ["run", "tool:a"] };
    expect(stackedSummaryText({ ...base, status: "done" })).toBe("Finished · 2 steps");
    expect(stackedSummaryText({ ...base, status: "failed", stepOrder: ["run"] })).toBe("Stopped · 1 step");
  });
});

const researcher: AGUILoadingStackedStep = {
  ...tool,
  id: "subagent:sub-1",
  kind: "subagent",
  status: "active",
  eventType: EventType.SUBAGENT_STARTED,
  toolCallName: null,
  subagentRunId: "sub-1",
  subagentName: "researcher",
};

describe("subagent rows", () => {
  it("names the subagent while it works", () => {
    expect(stackedStepBusyTexts(researcher, undefined)).toContain("Delegating to researcher");
  });

  it("uses the built-in delegating captions when the subagent has no name", () => {
    expect(stackedStepBusyTexts({ ...researcher, subagentName: null }, undefined)).toEqual(
      LOADING_TEXTS_BY_EVENT[EventType.SUBAGENT_STARTED],
    );
  });

  it("names the subagent when it's done or failed", () => {
    expect(stackedStepSettledText({ ...researcher, status: "done" })).toBe("Asked researcher");
    expect(stackedStepSettledText({ ...researcher, status: "failed" })).toBe("researcher failed");
    expect(
      stackedStepSettledText({ ...researcher, status: "failed", errorMessage: "Rate limited" }),
    ).toBe("Rate limited");
  });

  it("takes overrides keyed by SUBAGENT_STARTED", () => {
    expect(
      stackedStepSettledText(
        { ...researcher, status: "done" },
        { doneTextsByEvent: { [EventType.SUBAGENT_STARTED]: (s) => `${s.subagentName} is back` } },
      ),
    ).toBe("researcher is back");
  });
});

describe("waiting rows", () => {
  it("has no settled text while it waits", () => {
    expect(stackedStepSettledText({ ...tool, status: "waiting" })).toBeNull();
  });

  it("names the tool or subagent that waits", () => {
    expect(stackedStepWaitingTexts({ ...tool, status: "waiting" }, undefined)).toContain(
      "search is waiting",
    );
    expect(stackedStepWaitingTexts({ ...researcher, status: "waiting" }, undefined)).toContain(
      "researcher is waiting",
    );
  });

  it("falls back to the waiting captions for a row with no name", () => {
    const message = { ...tool, kind: "message" as const, toolCallName: null, status: "waiting" as const };
    expect(stackedStepWaitingTexts(message, undefined)).toEqual(LOADING_TEXTS_BY_EVENT.waiting);
  });

  it("uses your waiting texts keyed by the opening event", () => {
    const texts = { [EventType.TOOL_CALL_START]: (s: AGUILoadingStackedStep) => [`Approve ${s.toolCallName}?`] };
    expect(stackedStepWaitingTexts({ ...tool, status: "waiting" }, texts)).toEqual(["Approve search?"]);
  });
});

describe("stopped and cancelled rows", () => {
  it("says why the row failed", () => {
    expect(stackedStepSettledText({ ...tool, status: "failed", failReason: "stopped" })).toBe("Stopped");
    expect(stackedStepSettledText({ ...tool, status: "failed", failReason: "cancelled" })).toBe(
      "Cancelled",
    );
  });

  it("still prefers your failed text", () => {
    expect(
      stackedStepSettledText(
        { ...tool, status: "failed", failReason: "stopped" },
        { failedTextsByEvent: { default: "Nope" } },
      ),
    ).toBe("Nope");
  });

  it("summarizes a stopped run", () => {
    const base = { ...initialAGUILoadingStackedState, stepOrder: ["run", "tool:a"] };
    expect(stackedSummaryText({ ...base, status: "stopped" })).toBe("Stopped · 2 steps");
  });
});
