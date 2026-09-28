import type { ComponentProps, ReactNode } from "react";

import {
  valueForEventType,
  type AGUILoadingByEvent,
  type AGUILoadingStatusKey,
  type EventType,
} from "../../..";
import { cn } from "../cn";

import { AGUI_LOADING_WAITING_ICON } from "../agui-loading-waiting-icon";
import { useAGUILoadingContext } from "./agui-loading";

// Spinning circle, used when no icon is given.
const DEFAULT_FALLBACK = (
  <span className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

export type AGUILoadingIconProps<TEvent extends string = EventType> = Omit<
  ComponentProps<"span">,
  "children"
> & {
  // Icon per event, plus "waiting" and "stopped". Use null to show no icon.
  byEvent?: AGUILoadingByEvent<ReactNode, TEvent>;
  // Icon for events with no entry in byEvent. Default: a spinner.
  fallback?: ReactNode;
  // Icon while the run waits, if byEvent has no "waiting". Default: a pause circle.
  waitingFallback?: ReactNode;
};

// -----
// The icon for the latest event. It pauses when
// the run is over, and is still while it waits.
// -----
export function AGUILoadingIcon<TEvent extends string = EventType>({
  byEvent,
  fallback = DEFAULT_FALLBACK,
  waitingFallback = AGUI_LOADING_WAITING_ICON,
  className,
  ...props
}: AGUILoadingIconProps<TEvent>) {
  const { captionKey, presence } = useAGUILoadingContext("AGUILoadingIcon");
  const icon = valueForEventType(captionKey as TEvent | AGUILoadingStatusKey | null, byEvent);
  const ended = presence === "lingering" || presence === "done";
  const shownFallback = presence === "waiting" ? waitingFallback : fallback;

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
      {icon === undefined ? shownFallback : icon}
    </span>
  );
}
