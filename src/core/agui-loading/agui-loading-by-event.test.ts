import { describe, expect, it } from "vitest";

import { valueForEventType, type AGUILoadingByEvent } from "./agui-loading-by-event";
import { EventType } from "./agui-loading-machine";

describe("valueForEventType", () => {
  const byEvent: AGUILoadingByEvent<string | null> = {
    [EventType.TOOL_CALL_START]: "wrench",
    [EventType.RUN_FINISHED]: null,
    default: "sparkles",
  };

  it("uses the event's own entry", () => {
    expect(valueForEventType(EventType.TOOL_CALL_START, byEvent)).toBe("wrench");
  });

  it("falls back to default for unmapped events and null", () => {
    expect(valueForEventType(EventType.RUN_STARTED, byEvent)).toBe("sparkles");
    expect(valueForEventType(null, byEvent)).toBe("sparkles");
  });

  it("keeps an explicit null instead of falling through", () => {
    expect(valueForEventType(EventType.RUN_FINISHED, byEvent)).toBeNull();
  });

  it("returns undefined with no map or no default", () => {
    const noDefault: AGUILoadingByEvent<string> = { [EventType.RUN_ERROR]: "x" };
    expect(valueForEventType(EventType.RUN_STARTED, undefined)).toBeUndefined();
    expect(valueForEventType(EventType.RUN_STARTED, noDefault)).toBeUndefined();
  });
});
