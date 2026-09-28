import { createContext, use, type ComponentProps } from "react";

import type { AGUILoadingStackedState } from "../../..";
import { cn } from "../cn";

import { useAGUILoadingPresence } from "../use-agui-loading-presence";

// "steps": show the rows. "summary": the run ended and folded into one line.
type AGUILoadingStackedView = "steps" | "summary";

type AGUILoadingStackedContextValue = {
  state: AGUILoadingStackedState;
  view: AGUILoadingStackedView;
  maxVisible: number | undefined;
};

const AGUILoadingStackedContext =
  createContext<AGUILoadingStackedContextValue | null>(null);

// Shared state for the parts. Throws if a part is used outside the root.
export function useAGUILoadingStackedContext(part: string) {
  const context = use(AGUILoadingStackedContext);
  if (!context) throw new Error(`${part} must be inside AGUILoadingStacked`);
  return context;
}

// -----
// What happens when the agent finishes.
// lingerMs can only be set with "collapse" or "hide".
// -----
type AGUILoadingStackedWhenDoneProps =
  | {
      // "keep" (default): the finished rows stay on screen.
      whenDone?: "keep";
      lingerMs?: never;
    }
  | {
      // "collapse": after lingerMs, fold the rows into the summary.
      // "hide": after lingerMs, hide everything.
      whenDone: "collapse" | "hide";
      // How long the finished rows stay first. Default 1200.
      lingerMs?: number;
    };

export type AGUILoadingStackedProps = Omit<ComponentProps<"div">, "role"> & {
  // From aguiLoadingStackedReducer.
  state: AGUILoadingStackedState;
  // Show only the newest N rows. The Earlier part counts the rest.
  maxVisible?: number;
} & AGUILoadingStackedWhenDoneProps;

// -----
// Root of the stacked loader. Style it with data-status:
// running, waiting, done, failed or stopped.
// -----
export function AGUILoadingStacked({
  state,
  maxVisible,
  whenDone = "keep",
  lingerMs,
  className,
  children,
  ...props
}: AGUILoadingStackedProps) {
  const running = state.status === "running";
  const waiting = state.status === "waiting";
  const presence = useAGUILoadingPresence(
    running,
    { whenDone: whenDone === "keep" ? "keep" : "linger", lingerMs },
    waiting,
  );

  if (state.status === "idle") return null;

  // The linger is over: fold into the summary, or hide. A waiting run stays.
  const lingerOver = !running && !waiting && presence === "hidden";
  if (lingerOver && whenDone === "hide") return null;
  const view = lingerOver && whenDone === "collapse" ? "summary" : "steps";

  return (
    <AGUILoadingStackedContext value={{ state, view, maxVisible }}>
      <div
        role="status"
        aria-busy={running}
        data-status={state.status}
        data-view={view}
        className={cn("flex flex-col gap-1.5", className)}
        {...props}
      >
        {children}
      </div>
    </AGUILoadingStackedContext>
  );
}
