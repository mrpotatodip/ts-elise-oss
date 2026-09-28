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

export type AGUILoadingPresence = "hidden" | "running" | "lingering" | "done";

export type AGUILoadingWhenDone = "hide" | "linger" | "keep";

export const LINGER_MS = 1200;

export type AGUILoadingPresenceOptions = {
  whenDone?: AGUILoadingWhenDone;
  // Only read when whenDone is "linger". 0 hides immediately.
  lingerMs?: number;
};

export function initialAGUILoadingPresence(active: boolean): AGUILoadingPresence {
  return active ? "running" : "hidden";
}

// Only a loader that was actually showing lingers or stays —
// one that was never running has nothing to wind down from.
export function presenceOnActiveChange(
  presence: AGUILoadingPresence,
  active: boolean,
  { whenDone = "linger", lingerMs = LINGER_MS }: AGUILoadingPresenceOptions = {},
): AGUILoadingPresence {
  if (active) return "running";
  if (presence !== "running") return presence;
  if (whenDone === "keep") return "done";
  if (whenDone === "linger" && lingerMs > 0) return "lingering";
  return "hidden";
}

export function presenceOnLingerElapsed(
  presence: AGUILoadingPresence,
): AGUILoadingPresence {
  return presence === "lingering" ? "hidden" : presence;
}
