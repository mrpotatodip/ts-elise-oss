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
// Core presence rules, applied during render so it
// never flashes hidden. Only the timeout is an effect.
// -----
export function useAGUILoadingPresence(
  active: boolean,
  { whenDone = "linger", lingerMs = LINGER_MS }: AGUILoadingPresenceOptions = {},
  waiting = false,
): AGUILoadingPresence {
  const [presence, setPresence] = useState(() => initialAGUILoadingPresence(active, waiting));
  const [prev, setPrev] = useState({ active, waiting });

  if (active !== prev.active || waiting !== prev.waiting) {
    setPrev({ active, waiting });
    setPresence(presenceOnActiveChange(presence, active, { whenDone, lingerMs }, waiting));
  }

  useEffect(() => {
    if (presence !== "lingering") return;
    const id = setTimeout(() => setPresence(presenceOnLingerElapsed), lingerMs);
    return () => clearTimeout(id);
  }, [presence, lingerMs]);

  return presence;
}
