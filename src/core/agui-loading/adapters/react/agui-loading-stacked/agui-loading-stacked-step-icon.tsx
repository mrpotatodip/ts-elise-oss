import type { ComponentProps, ReactNode } from "react";

import { stackedStepValue, type AGUILoadingStackedByEvent } from "../../..";
import { cn } from "../cn";

import { useAGUILoadingStackedStep } from "./agui-loading-stacked-steps";

// -----
// Default icons. They use the text color, so you
// color them from the row, e.g.
// data-[status=done]:text-emerald-500.
// -----
const BUSY_ICON = (
  <span className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

const DONE_ICON = (
  <svg viewBox="0 0 16 16" className="size-3 shrink-0">
    <path
      d="M3.5 8.5l3 3 6-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FAILED_ICON = (
  <svg viewBox="0 0 16 16" className="size-3 shrink-0">
    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 4.5v4M8 11v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export type AGUILoadingStackedStepIconProps = Omit<ComponentProps<"span">, "children"> & {
  // -----
  // Icon per row, keyed by the event that started the
  // row (RUN_STARTED, TOOL_CALL_START, ...) or "default".
  // A value can be a function of the step. Use null for no icon.
  // -----
  // While the row works.
  busyByEvent?: AGUILoadingStackedByEvent<ReactNode>;
  // When the row is finished.
  doneByEvent?: AGUILoadingStackedByEvent<ReactNode>;
  // When the row failed.
  failedByEvent?: AGUILoadingStackedByEvent<ReactNode>;
  // Icons for rows with no entry. Defaults: spinner, check, "!" circle.
  busyFallback?: ReactNode;
  doneFallback?: ReactNode;
  failedFallback?: ReactNode;
};

// The icon for this row. It changes when the row finishes or fails.
export function AGUILoadingStackedStepIcon({
  busyByEvent,
  doneByEvent,
  failedByEvent,
  busyFallback = BUSY_ICON,
  doneFallback = DONE_ICON,
  failedFallback = FAILED_ICON,
  className,
  ...props
}: AGUILoadingStackedStepIconProps) {
  const step = useAGUILoadingStackedStep("AGUILoadingStackedStepIcon");

  const [byEvent, fallback] =
    step.status === "done"
      ? [doneByEvent, doneFallback]
      : step.status === "failed"
        ? [failedByEvent, failedFallback]
        : [busyByEvent, busyFallback];
  const icon = stackedStepValue(step, byEvent);

  return (
    <span aria-hidden className={cn("inline-flex shrink-0", className)} {...props}>
      {icon === undefined ? fallback : icon}
    </span>
  );
}
