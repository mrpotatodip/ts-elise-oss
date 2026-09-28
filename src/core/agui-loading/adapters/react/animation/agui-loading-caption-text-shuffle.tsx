import { useEffect, useState } from "react";

import {
  SHUFFLE_FRAME_MS,
  shuffleDurationMs,
  shuffleFrame,
  shuffleScramblePool,
} from "../../..";

function ShuffleText({ text }: { text: string }) {
  const [chars, setChars] = useState(() => text.split(""));

  useEffect(() => {
    const pool = shuffleScramblePool(text);
    const totalDuration = shuffleDurationMs(text);
    const startedAt = new Date().getTime();

    const id = setInterval(() => {
      const elapsed = new Date().getTime() - startedAt;
      setChars(shuffleFrame(text, elapsed, pool));
      if (elapsed >= totalDuration) clearInterval(id);
    }, SHUFFLE_FRAME_MS);

    return () => clearInterval(id);
  }, [text]);

  return (
    <span aria-label={text}>
      {chars.map((char, index) => (
        <span key={index} aria-hidden>
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}

export type AGUILoadingCaptionTextShuffleProps = {
  text: string;
};

// -----
// The scramble frame math lives in core. Keying
// ShuffleText by text gives a new caption its own
// fresh timer instead of continuing the previous
// word's scramble.
// -----
export function AGUILoadingCaptionTextShuffle({ text }: AGUILoadingCaptionTextShuffleProps) {
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <ShuffleText key={text} text={text} />
    </span>
  );
}
