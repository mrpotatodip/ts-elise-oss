// -----
// Framework-free timing and frame math for the
// caption animations. Adapters own the timers and
// markup; everything that decides what to show at
// a given moment lives here.
// -----

// "slide-up": new text comes in from below and moves up.
// "slide-down" / "slide-left" / "slide-right": same idea,
// moving down, left or right.
export type AGUILoadingTextAnimation =
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "typing"
  | "shuffle";

export const AGUI_LOADING_TEXT_ANIMATIONS = [
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "typing",
  "shuffle",
] as const satisfies readonly AGUILoadingTextAnimation[];

// -----
// Typing needs longer on screen than a slide/fade swap
// — a long caption can take over a second just to type
// out at TYPE_CHAR_MS/char, so the default 1800ms slide
// rotation would cut it off mid-type.
// -----
export const TEXT_ANIMATION_ROTATE_MS = {
  "slide-up": 1800,
  "slide-down": 1800,
  "slide-left": 1800,
  "slide-right": 1800,
  typing: 3200,
  shuffle: 2000,
} satisfies Record<AGUILoadingTextAnimation, number>;

// -----
// Slide/fade
// -----
export const SLIDE_DURATION_MS = 320;

// -----
// Typing
// -----
export const TYPE_CHAR_MS = 45;

// -----
// A hard on/off blink (steps, no fade) reads as a real
// terminal caret — an eased opacity looks like a glow.
// Shipped as a string so any adapter can inline it.
// -----
export const CARET_BLINK_ANIMATION_NAME = "agui-loading-caret-blink";
export const CARET_BLINK_ANIMATION = `${CARET_BLINK_ANIMATION_NAME} 1s steps(1) infinite`;
export const CARET_KEYFRAMES = `
@keyframes ${CARET_BLINK_ANIMATION_NAME} {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
`;

// -----
// Shuffle
// -----
export const SHUFFLE_FRAME_MS = 35;
export const SHUFFLE_STAGGER_MS = 30;
export const SHUFFLE_SCRAMBLE_MS = 220;

// -----
// Scramble glyphs come from the caption's own letters
// (deduped, case preserved) instead of a fixed A-Z set
// — so the flicker never shows a character that isn't
// actually part of the word being revealed.
// -----
export function shuffleScramblePool(text: string): string[] {
  const unique = [...new Set(text.replace(/\s/g, "").split(""))];
  return unique.length > 0 ? unique : [" "];
}

// Last character's own lock time — the point everything has settled.
export function shuffleDurationMs(text: string): number {
  return Math.max(text.length - 1, 0) * SHUFFLE_STAGGER_MS + SHUFFLE_SCRAMBLE_MS;
}

// -----
// Each letter scrambles before locking to its real
// character, staggered left to right — the leftmost
// letter starts first and locks first, cascading
// rightward. Letters that haven't started yet are blank.
// -----
export function shuffleFrame(
  text: string,
  elapsedMs: number,
  pool: readonly string[] = shuffleScramblePool(text),
): string[] {
  return text.split("").map((char, index) => {
    if (char === " ") return " ";
    const startAt = index * SHUFFLE_STAGGER_MS;
    const lockAt = startAt + SHUFFLE_SCRAMBLE_MS;
    if (elapsedMs >= lockAt) return char;
    if (elapsedMs >= startAt) return pool[Math.floor(Math.random() * pool.length)]!;
    return " ";
  });
}
