import { describe, expect, it } from "vitest";

import {
  SHUFFLE_SCRAMBLE_MS,
  SHUFFLE_STAGGER_MS,
  shuffleDurationMs,
  shuffleFrame,
  shuffleScramblePool,
} from "./agui-loading-animations";

describe("shuffle animation", () => {
  it("builds the scramble pool from the caption's own letters", () => {
    expect(shuffleScramblePool("aab b").sort()).toEqual(["a", "b"]);
    expect(shuffleScramblePool("   ")).toEqual([" "]);
  });

  it("starts blank and ends on the real text", () => {
    expect(shuffleFrame("Loading", 0).slice(1).every((c) => c === " ")).toBe(true);
    expect(shuffleFrame("Loading", shuffleDurationMs("Loading")).join("")).toBe("Loading");
  });

  it("locks letters left to right", () => {
    const text = "abcd";
    const frame = shuffleFrame(text, SHUFFLE_SCRAMBLE_MS + SHUFFLE_STAGGER_MS, ["?"]);
    expect(frame).toEqual(["a", "b", "?", "?"]);
  });

  it("keeps spaces as spaces", () => {
    expect(shuffleFrame("a b", 0, ["?"])[1]).toBe(" ");
  });
});
