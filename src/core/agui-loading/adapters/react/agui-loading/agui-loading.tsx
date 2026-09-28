import { createContext, use, type ComponentProps } from "react";

import type { AGUILoadingPresence, AGUILoadingWhenDone } from "../../..";
import { cn } from "../cn";

import { useAGUILoadingPresence } from "../use-agui-loading-presence";

type AGUILoadingContextValue = {
  active: boolean;
  eventType: string | null;
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
} & AGUILoadingWhenDoneProps;

// -----
// Root of the loader. Put the parts inside in any
// order, with your own elements between them.
// Style each state with data-presence:
// running, lingering or done.
// -----
export function AGUILoading({
  active,
  eventType,
  whenDone,
  lingerMs,
  className,
  children,
  ...props
}: AGUILoadingProps) {
  const presence = useAGUILoadingPresence(active, { whenDone, lingerMs });

  if (presence === "hidden") return null;

  return (
    <AGUILoadingContext value={{ active, eventType, presence }}>
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
