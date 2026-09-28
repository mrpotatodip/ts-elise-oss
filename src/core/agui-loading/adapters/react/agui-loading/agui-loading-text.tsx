import type { ComponentProps } from "react";

import {
  TEXT_ANIMATION_ROTATE_MS,
  textsForEventType,
  type AGUILoadingTextAnimation,
  type AGUILoadingTextsByEvent,
  type EventType,
} from "../../..";

import { AGUI_LOADING_CAPTION_TEXT_COMPONENTS } from "../animation/agui-loading-caption-text-components";
import { useAGUILoadingCaption } from "../use-agui-loading-caption";
import { useAGUILoadingContext } from "./agui-loading";

export type AGUILoadingTextProps<TEvent extends string = EventType> = Omit<
  ComponentProps<"span">,
  "children"
> & {
  // Phrases to show per event. Unlisted events use the built-in text.
  byEvent?: AGUILoadingTextsByEvent<TEvent>;
  // How the text changes: "slide-up" (default), "slide-down",
  // "slide-left", "slide-right", "typing" or "shuffle".
  animation?: AGUILoadingTextAnimation;
  // Milliseconds each phrase stays on screen.
  rotateEvery?: number;
};

// -----
// The text for the latest event. It changes every
// few seconds while the agent works. Screen readers
// hear it one time for each event, not on each change.
// -----
export function AGUILoadingText<TEvent extends string = EventType>({
  byEvent,
  animation = "slide-up",
  rotateEvery,
  ...props
}: AGUILoadingTextProps<TEvent>) {
  const { active, eventType } = useAGUILoadingContext("AGUILoadingText");
  const text = useAGUILoadingCaption({
    active,
    eventType: eventType as TEvent | null,
    rotateEvery: rotateEvery ?? TEXT_ANIMATION_ROTATE_MS[animation],
    textsByEvent: byEvent,
  });
  const spokenText = textsForEventType(eventType as TEvent | null, byEvent)[0];
  const CaptionText = AGUI_LOADING_CAPTION_TEXT_COMPONENTS[animation];

  return (
    <span {...props}>
      <span aria-hidden>
        <CaptionText text={text} />
      </span>
      <span className="sr-only">{spokenText}</span>
    </span>
  );
}
