import { useEffect, useState } from "react";

import {
  initialAGUILoadingPresence,
  LINGER_MS,
  presenceOnActiveChange,
  presenceOnLingerElapsed,
  type AGUILoadingPresence,
  type AGUILoadingPresenceOptions,
} from "../..";

// -----
// React binding for the core presence rules. The
// active change is applied during render (not in an
// effect) so the loader never flashes hidden for a
// frame before lingering; only the timeout is an effect.
// -----
export function useAGUILoadingPresence(
  active: boolean,
  { whenDone = "linger", lingerMs = LINGER_MS }: AGUILoadingPresenceOptions = {},
): AGUILoadingPresence {
  const [presence, setPresence] = useState(() => initialAGUILoadingPresence(active));
  const [prevActive, setPrevActive] = useState(active);

  if (active !== prevActive) {
    setPrevActive(active);
    setPresence(presenceOnActiveChange(presence, active, { whenDone, lingerMs }));
  }

  useEffect(() => {
    if (presence !== "lingering") return;
    const id = setTimeout(() => setPresence(presenceOnLingerElapsed), lingerMs);
    return () => clearTimeout(id);
  }, [presence, lingerMs]);

  return presence;
}
