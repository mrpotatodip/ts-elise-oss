import type { ComponentProps, ReactNode } from "react";

import { cn } from "../cn";

import { useAGUILoadingStackedStep } from "./agui-loading-stacked-steps";

export type AGUILoadingStackedStepSubagentProps = Omit<ComponentProps<"span">, "children"> & {
  // Shown after the name. Default "·".
  separator?: ReactNode;
};

// -----
// Name of the subagent this row's work belongs to.
// Nothing on the parent's rows or a subagent's own.
// -----
export function AGUILoadingStackedStepSubagent({
  separator = "·",
  className,
  ...props
}: AGUILoadingStackedStepSubagentProps) {
  const step = useAGUILoadingStackedStep("AGUILoadingStackedStepSubagent");

  if (step.kind === "subagent" || !step.subagentName) return null;

  return (
    <span className={cn("inline-flex items-center gap-1", className)} {...props}>
      <span>{step.subagentName}</span>
      <span aria-hidden>{separator}</span>
    </span>
  );
}
