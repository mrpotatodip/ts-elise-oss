import { describe, expect, it } from "vitest";

import {
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
