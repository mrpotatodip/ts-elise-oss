import type { ComponentProps } from "react";

import { stackedStepCount, stackedSummaryText } from "../../..";
import { cn } from "../cn";

import { useAGUILoadingStackedContext } from "./agui-loading-stacked";

export type AGUILoadingStackedSummaryProps = ComponentProps<"span"> & {
  // Fixed text, or a function that gets the number of steps.
  text?: string | ((steps: number) => string);
};

// Shows only after the rows fold, and only for this result.
function AGUILoadingStackedSummary({
  part,
  result,
  text,
  children,
  className,
  ...props
}: AGUILoadingStackedSummaryProps & { part: string; result: "done" | "failed" }) {
  const { state, view } = useAGUILoadingStackedContext(part);

  if (view !== "summary" || state.status !== result) return null;

  const summary =
    text === undefined
      ? stackedSummaryText(state)
      : typeof text === "function"
        ? text(stackedStepCount(state))
        : text;

  return (
    <span className={cn("flex items-center gap-2", className)} {...props}>
      {children}
      {summary}
    </span>
  );
}

// -----
// One line after a finished run folds (whenDone="collapse").
// Default text: "Finished · 4 steps". Put an icon
// in children; it shows before the text.
// -----
export function AGUILoadingStackedSummaryDone(
  props: AGUILoadingStackedSummaryProps,
) {
  return (
    <AGUILoadingStackedSummary
      part="AGUILoadingStackedSummaryDone"
      result="done"
      {...props}
    />
  );
}

// -----
// One line after a failed run folds (whenDone="collapse").
// Default text: "Stopped · 4 steps". Put an icon
// in children; it shows before the text.
// -----
export function AGUILoadingStackedSummaryFailed(
  props: AGUILoadingStackedSummaryProps,
) {
  return (
    <AGUILoadingStackedSummary
      part="AGUILoadingStackedSummaryFailed"
      result="failed"
      {...props}
    />
  );
}
