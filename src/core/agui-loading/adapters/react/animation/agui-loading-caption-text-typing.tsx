import { useEffect, useState } from "react";

import {
  CARET_BLINK_ANIMATION,
  CARET_KEYFRAMES,
  TYPE_CHAR_MS,
} from "../../..";

function TypingText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function step(length: number) {
      if (cancelled) return;
      if (length >= text.length) {
        setTyping(false);
        return;
      }
      setDisplayText(text.slice(0, length + 1));
      setTimeout(() => step(length + 1), TYPE_CHAR_MS);
    }

    const id = setTimeout(() => step(0), TYPE_CHAR_MS);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [text]);

  return (
    <>
      <style>{CARET_KEYFRAMES}</style>
      <span>{displayText}</span>
      {/* Solid while actively typing; only blinks once idle, like a real terminal caret. */}
      <span
        aria-hidden
        className="ml-0.5 inline-block h-[0.9em] w-px bg-current align-middle"
        style={typing ? undefined : { animation: CARET_BLINK_ANIMATION }}
      />
    </>
  );
}

export type AGUILoadingCaptionTextTypingProps = {
  text: string;
};

// -----
// Terminal-style typing indicator: on a new caption,
// clears instantly and types the new text in from
// scratch (no backspacing the old one). Keying
// TypingText by text remounts it on every change,
// resetting its local state for free instead of
// calling setState synchronously inside an effect.
// -----
export function AGUILoadingCaptionTextTyping({ text }: AGUILoadingCaptionTextTypingProps) {
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <TypingText key={text} text={text} />
    </span>
  );
}
