import type { ComponentProps } from "react";

import {
  STACKED_STEP_START_EVENT,
  stackedStepBusyTexts,
  stackedStepSettledText,
  stackedStepWaitingTexts,
  TEXT_ANIMATION_ROTATE_MS,
  type AGUILoadingStackedByEvent,
  type AGUILoadingTextAnimation,
} from "../../..";

import { AGUI_LOADING_CAPTION_TEXT_COMPONENTS } from "../animation/agui-loading-caption-text-components";
import { useAGUILoadingCaption } from "../use-agui-loading-caption";
import { useAGUILoadingStackedStep } from "./agui-loading-stacked-steps";

export type AGUILoadingStackedStepTextProps = Omit<ComponentProps<"span">, "children"> & {
  // -----
  // Text per row, keyed by the event that started the
  // row (RUN_STARTED, TOOL_CALL_START, ...) or "default".
  // A value can be a function of the step, e.g.
  // (step) => `Checked ${step.toolCallName}`.
  // Rows you don't list use the built-in text.
  // -----
  // Phrases that rotate while the row works.
  busyByEvent?: AGUILoadingStackedByEvent<readonly string[]>;
  // Text when the row is finished.
  doneByEvent?: AGUILoadingStackedByEvent<string>;
  // Text when the row failed.
  failedByEvent?: AGUILoadingStackedByEvent<string>;
  // Phrases that rotate while the row waits for input.
  waitingByEvent?: AGUILoadingStackedByEvent<readonly string[]>;
  // How the text changes: "slide-up" (default), "slide-down",
  // "slide-left", "slide-right", "typing" or "shuffle".
  animation?: AGUILoadingTextAnimation;
  // Milliseconds each phrase stays on screen.
  rotateEvery?: number;
};

// -----
// Rotates while the row works or waits, then shows
// its done or failed text. Spoken once, not per change.
// -----
export function AGUILoadingStackedStepText({
  busyByEvent,
  doneByEvent,
  failedByEvent,
  waitingByEvent,
  animation = "slide-up",
  rotateEvery,
  ...props
}: AGUILoadingStackedStepTextProps) {
  const step = useAGUILoadingStackedStep("AGUILoadingStackedStepText");
  const openingEvent = STACKED_STEP_START_EVENT[step.kind];
  const waiting = step.status === "waiting";
  const busyTexts = waiting
    ? stackedStepWaitingTexts(step, waitingByEvent)
    : stackedStepBusyTexts(step, busyByEvent);
  // A new key starts a new deck when the row starts or stops waiting.
  const captionKey = waiting ? "waiting" : openingEvent;

  const rotating = useAGUILoadingCaption({
    active: step.status === "active" || waiting,
    eventType: captionKey,
    rotateEvery: rotateEvery ?? TEXT_ANIMATION_ROTATE_MS[animation],
    textsByEvent: { [captionKey]: busyTexts },
  });
  const settled = stackedStepSettledText(step, {
    doneTextsByEvent: doneByEvent,
    failedTextsByEvent: failedByEvent,
  });
  const CaptionText = AGUI_LOADING_CAPTION_TEXT_COMPONENTS[animation];

  return (
    <span {...props}>
      <span aria-hidden>
        <CaptionText text={settled ?? rotating} />
      </span>
      <span className="sr-only">{settled ?? busyTexts[0]}</span>
    </span>
  );
}
