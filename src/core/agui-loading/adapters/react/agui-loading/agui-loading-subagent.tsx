import type { ComponentProps, ReactNode } from "react";

import { cn } from "../cn";

import { useAGUILoadingContext } from "./agui-loading";

export type AGUILoadingSubagentProps = Omit<ComponentProps<"span">, "children"> & {
  // Shown after the name. Default "·".
  separator?: ReactNode;
};

// -----
// Name of the subagent behind the latest event.
// Nothing while the parent agent works.
// -----
export function AGUILoadingSubagent({
  separator = "·",
  className,
  ...props
}: AGUILoadingSubagentProps) {
  const { subagent } = useAGUILoadingContext("AGUILoadingSubagent");

  if (!subagent) return null;

  return (
    <span className={cn("inline-flex items-center gap-1", className)} {...props}>
      <span>{subagent}</span>
      <span aria-hidden>{separator}</span>
    </span>
  );
}
