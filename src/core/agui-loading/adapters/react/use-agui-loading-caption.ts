import { useEffect, useRef, useState } from "react";

import {
  createAGUILoadingCaptionRotator,
  type AGUILoadingTextsByEvent,
  type EventType,
} from "../..";

export type UseAGUILoadingCaptionOptions<TEvent extends string = EventType> = {
  active: boolean;
  eventType: TEvent | null;
  rotateEvery?: number;
  textsByEvent?: AGUILoadingTextsByEvent<TEvent>;
};

// -----
// React binding for the core caption rotator. The
// deck rules live in core; this only owns the timer.
// eventType is a dependency so a new event redraws
// immediately instead of waiting for the next tick.
// -----
export function useAGUILoadingCaption<TEvent extends string = EventType>({
  active,
  eventType,
  rotateEvery = 1800,
  textsByEvent,
}: UseAGUILoadingCaptionOptions<TEvent>): string {
  const [rotator] = useState(() => createAGUILoadingCaptionRotator<TEvent>());
  const [text, setText] = useState("");

  // -----
  // Read through a ref, not a dependency: an inline
  // textsByEvent={{...}} is a new object every render,
  // which would restart the timer and skip to the next
  // caption on any unrelated re-render.
  // -----
  const textsByEventRef = useRef(textsByEvent);
  useEffect(() => {
    textsByEventRef.current = textsByEvent;
  }, [textsByEvent]);

  useEffect(() => {
    const draw = () => {
      const next = rotator.next(eventType, textsByEventRef.current);
      if (next != null) setText(next);
    };

    draw();
    if (!active) return;
    const id = setInterval(draw, rotateEvery);
    return () => clearInterval(id);
  }, [rotator, active, eventType, rotateEvery]);

  return text;
}
