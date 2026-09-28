import type { ComponentProps, ReactNode } from "react";

import { valueForEventType, type AGUILoadingByEvent, type EventType } from "../../..";
import { cn } from "../cn";

import { useAGUILoadingContext } from "./agui-loading";

// Spinning circle, used when no icon is given.
const DEFAULT_FALLBACK = (
  <span className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

export type AGUILoadingIconProps<TEvent extends string = EventType> = Omit<
  ComponentProps<"span">,
  "children"
> & {
  // Icon per event. Use null to show no icon.
  byEvent?: AGUILoadingByEvent<ReactNode, TEvent>;
  // Icon for events with no entry in byEvent. Default: a spinner.
  fallback?: ReactNode;
};

// -----
// The icon for the latest event.
// It stops moving when the run is over.
// -----
export function AGUILoadingIcon<TEvent extends string = EventType>({
  byEvent,
  fallback = DEFAULT_FALLBACK,
  className,
  ...props
}: AGUILoadingIconProps<TEvent>) {
  const { eventType, presence } = useAGUILoadingContext("AGUILoadingIcon");
  const icon = valueForEventType(eventType as TEvent | null, byEvent);
  const ended = presence === "lingering" || presence === "done";

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0",
        ended && "**:[animation-play-state:paused]",
        className,
      )}
      {...props}
    >
      {icon === undefined ? fallback : icon}
    </span>
  );
}
