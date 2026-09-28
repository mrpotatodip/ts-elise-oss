import type { ComponentProps } from "react";

import { useAGUILoadingContext } from "./agui-loading";

export type AGUILoadingEventProps = Omit<ComponentProps<"span">, "children">;

// -----
// The name of the latest event, e.g. TOOL_CALL_START.
// Shows nothing before the first event.
// -----
export function AGUILoadingEvent(props: AGUILoadingEventProps) {
  const { eventType } = useAGUILoadingContext("AGUILoadingEvent");

  if (eventType == null) return null;

  return (
    <span aria-hidden {...props}>
      {eventType}
    </span>
  );
}
