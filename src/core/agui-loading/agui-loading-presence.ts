// -----
// Whether the loader is on screen. What happens when
// a run ends is set by whenDone:
//   "hide"   — gone on the same render
//   "linger" — stays lingerMs on its final caption
//              ("Wrapping up", or the RUN_ERROR one),
//              then hides. Adapters own the timeout.
//   "keep"   — stays on its final caption until the
//              next run replaces it
// -----

export type AGUILoadingPresence = "hidden" | "running" | "waiting" | "lingering" | "done";

export type AGUILoadingWhenDone = "hide" | "linger" | "keep";

export const LINGER_MS = 1200;

export type AGUILoadingPresenceOptions = {
  whenDone?: AGUILoadingWhenDone;
  // Only read when whenDone is "linger". 0 hides immediately.
  lingerMs?: number;
};

export function initialAGUILoadingPresence(
  active: boolean,
  waiting = false,
): AGUILoadingPresence {
  if (active) return "running";
  return waiting ? "waiting" : "hidden";
}

// -----
// A waiting run stays until the next run, whatever
// whenDone says. Only a showing loader winds down.
// -----
export function presenceOnActiveChange(
  presence: AGUILoadingPresence,
  active: boolean,
  { whenDone = "linger", lingerMs = LINGER_MS }: AGUILoadingPresenceOptions = {},
  waiting = false,
): AGUILoadingPresence {
  if (active) return "running";
  if (waiting) return "waiting";
  if (presence !== "running" && presence !== "waiting") return presence;
  if (whenDone === "keep") return "done";
  if (whenDone === "linger" && lingerMs > 0) return "lingering";
  return "hidden";
}

export function presenceOnLingerElapsed(
  presence: AGUILoadingPresence,
): AGUILoadingPresence {
  return presence === "lingering" ? "hidden" : presence;
}
