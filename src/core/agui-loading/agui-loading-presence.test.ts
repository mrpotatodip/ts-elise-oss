import { describe, expect, it } from "vitest";

import {
  initialAGUILoadingPresence,
  presenceOnActiveChange,
  presenceOnLingerElapsed,
} from "./agui-loading-presence";

describe("loader presence", () => {
  it("starts from the initial active flag", () => {
    expect(initialAGUILoadingPresence(true)).toBe("running");
    expect(initialAGUILoadingPresence(false)).toBe("hidden");
  });

  it("lingers by default when a running loader ends, then hides", () => {
    const lingering = presenceOnActiveChange("running", false);
    expect(lingering).toBe("lingering");
    expect(presenceOnLingerElapsed(lingering)).toBe("hidden");
  });

  it("hides immediately when lingerMs is 0", () => {
    expect(presenceOnActiveChange("running", false, { lingerMs: 0 })).toBe("hidden");
  });

  it("hides immediately when whenDone is hide", () => {
    expect(presenceOnActiveChange("running", false, { whenDone: "hide" })).toBe("hidden");
  });

  it("stays done when whenDone is keep, and no linger timeout hides it", () => {
    const done = presenceOnActiveChange("running", false, { whenDone: "keep" });
    expect(done).toBe("done");
    expect(presenceOnLingerElapsed(done)).toBe("done");
  });

  it("ignores lingerMs unless whenDone is linger", () => {
    expect(presenceOnActiveChange("running", false, { whenDone: "keep", lingerMs: 0 })).toBe(
      "done",
    );
  });

  it("never lingers or keeps a loader that wasn't showing", () => {
    expect(presenceOnActiveChange("hidden", false)).toBe("hidden");
    expect(presenceOnActiveChange("hidden", false, { whenDone: "keep" })).toBe("hidden");
  });

  it("a new run during the linger or after done shows it again", () => {
    expect(presenceOnActiveChange("lingering", true)).toBe("running");
    expect(presenceOnActiveChange("done", true, { whenDone: "keep" })).toBe("running");
  });

  it("a stale linger timeout doesn't hide a running loader", () => {
    expect(presenceOnLingerElapsed("running")).toBe("running");
  });
});
