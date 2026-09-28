import { AnimatePresence, motion } from "motion/react";

import { SLIDE_DURATION_MS } from "../../..";

const CAPTION_TRANSITION = {
  duration: SLIDE_DURATION_MS / 1000,
  ease: "easeInOut",
} as const;

export type AGUILoadingCaptionTextSlideDirection = "up" | "down" | "left" | "right";

// Where new text starts, and where old text leaves to.
const SLIDE_OFFSETS = {
  up: { enter: { y: "100%" }, exit: { y: "-100%" } },
  down: { enter: { y: "-100%" }, exit: { y: "100%" } },
  left: { enter: { x: "100%" }, exit: { x: "-100%" } },
  right: { enter: { x: "-100%" }, exit: { x: "100%" } },
} satisfies Record<
  AGUILoadingCaptionTextSlideDirection,
  { enter: Record<string, string>; exit: Record<string, string> }
>;

export type AGUILoadingCaptionTextSlideFadeProps = {
  text: string;
  // Which way the text moves. Default "up".
  direction?: AGUILoadingCaptionTextSlideDirection;
};

// -----
// Incoming text stays in normal flow so it sizes the
// wrapper; only the exiting element becomes
// position: absolute, applied instantly at exit start
// rather than tweened. Without that, both layers being
// absolute at once leaves nothing in flow to size the
// box, clipping it down to one character.
// -----
export function AGUILoadingCaptionTextSlideFade({
  text,
  direction = "up",
}: AGUILoadingCaptionTextSlideFadeProps) {
  const offset = SLIDE_OFFSETS[direction];

  return (
    <span className="relative inline-block h-[1.2em] overflow-hidden align-bottom leading-none">
      <AnimatePresence>
        <motion.span
          key={text}
          className="block whitespace-nowrap"
          initial={{ x: "0%", y: "0%", ...offset.enter, opacity: 0 }}
          animate={{ x: "0%", y: "0%", opacity: 1 }}
          exit={{ ...offset.exit, opacity: 0, position: "absolute", inset: 0 }}
          transition={CAPTION_TRANSITION}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
