import { createContext, use, type ComponentProps } from "react";

import type { AGUILoadingPresence, AGUILoadingStatusKey, AGUILoadingWhenDone } from "../../..";
import { cn } from "../cn";

import { useAGUILoadingPresence } from "../use-agui-loading-presence";

type AGUILoadingContextValue = {
  active: boolean;
  waiting: boolean;
  eventType: string | null;
  captionKey: string | AGUILoadingStatusKey | null;
  subagent: string | null;
  presence: AGUILoadingPresence;
};

const AGUILoadingContext = createContext<AGUILoadingContextValue | null>(null);

// Shared state for the parts. Throws if a part is used outside the root.
export function useAGUILoadingContext(part: string) {
  const context = use(AGUILoadingContext);
  if (!context) throw new Error(`${part} must be inside AGUILoading`);
  return context;
}

// -----
// What happens when the agent finishes.
// lingerMs can only be set with "linger".
// -----
type AGUILoadingWhenDoneProps =
  | {
      // "linger" (default): show the last text, then hide.
      whenDone?: Extract<AGUILoadingWhenDone, "linger">;
      // How long to show the last text. Default 1200. 0 hides right away.
      lingerMs?: number;
    }
  | {
      // "hide": hide right away.
      // "keep": show the last text until the next run.
      whenDone: Exclude<AGUILoadingWhenDone, "linger">;
      lingerMs?: never;
    };

export type AGUILoadingProps = Omit<ComponentProps<"div">, "role"> & {
  // true while the agent is working.
  active: boolean;
  // The latest event. Picks which text and icon the parts show.
  eventType: string | null;
  // true while the run waits for input (state.status === "waiting").
  waiting?: boolean;
  // true when the run was cancelled (state.status === "stopped").
  stopped?: boolean;
  // Name of the subagent that sent the latest event (state.subagentName).
  subagent?: string | null;
} & AGUILoadingWhenDoneProps;

// -----
// Root of the loader; parts go inside in any order.
// data-presence: running, waiting, lingering, done.
// -----
export function AGUILoading({
  active,
  eventType,
  waiting = false,
  stopped = false,
  subagent = null,
  whenDone,
  lingerMs,
  className,
  children,
  ...props
}: AGUILoadingProps) {
  const presence = useAGUILoadingPresence(active, { whenDone, lingerMs }, waiting);

  if (presence === "hidden") return null;

  // -----
  // Waiting and stopped have their own captions and
  // icons, keyed "waiting" and "stopped".
  // -----
  const captionKey = waiting ? "waiting" : stopped && !active ? "stopped" : eventType;

  return (
    <AGUILoadingContext value={{ active, waiting, eventType, captionKey, subagent, presence }}>
      <div
        role="status"
        aria-busy={presence === "running"}
        data-presence={presence}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </AGUILoadingContext>
  );
}
