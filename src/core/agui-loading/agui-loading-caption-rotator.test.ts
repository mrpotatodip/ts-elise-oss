import { describe, expect, it } from "vitest";

import { createAGUILoadingCaptionRotator } from "./agui-loading-caption-rotator";
import { EventType } from "./agui-loading-machine";

const TEXTS = {
  [EventType.RUN_STARTED]: ["a", "b", "c"],
  [EventType.RUN_FINISHED]: ["x", "y"],
};

describe("createAGUILoadingCaptionRotator", () => {
  it("draws every caption once before reshuffling", () => {
    const rotator = createAGUILoadingCaptionRotator();
    const drawn = [1, 2, 3].map(() => rotator.next(EventType.RUN_STARTED, TEXTS));
    expect([...drawn].sort()).toEqual(["a", "b", "c"]);
  });

  it("keeps rotating after the deck runs dry", () => {
    const rotator = createAGUILoadingCaptionRotator();
    for (let i = 0; i < 20; i += 1) {
      expect(rotator.next(EventType.RUN_STARTED, TEXTS)).not.toBeNull();
    }
  });

  it("never repeats a caption back to back across reshuffles", () => {
    const rotator = createAGUILoadingCaptionRotator();
    let previous = rotator.next(EventType.RUN_STARTED, TEXTS);
    for (let i = 0; i < 300; i += 1) {
      const next = rotator.next(EventType.RUN_STARTED, TEXTS);
      expect(next).not.toBe(previous);
      previous = next;
    }
  });

  it("switches decks when the event changes", () => {
    const rotator = createAGUILoadingCaptionRotator();
    rotator.next(EventType.RUN_STARTED, TEXTS);
    expect(["x", "y"]).toContain(rotator.next(EventType.RUN_FINISHED, TEXTS));
  });

  it("falls back to built-in captions when nothing is overridden", () => {
    const rotator = createAGUILoadingCaptionRotator();
    expect(rotator.next(EventType.TOOL_CALL_START)).toEqual(expect.any(String));
    expect(rotator.next(null)).toEqual(expect.any(String));
  });

  it("returns null for an empty caption list", () => {
    const rotator = createAGUILoadingCaptionRotator();
    expect(rotator.next(EventType.RUN_STARTED, { [EventType.RUN_STARTED]: [] })).toBeNull();
  });
});
