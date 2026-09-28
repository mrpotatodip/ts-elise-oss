import type { EventType } from "./agui-loading-machine";
import {
  shuffle,
  textsForEventType,
  type AGUILoadingTextsByEvent,
} from "./agui-loading-captions";

export type AGUILoadingCaptionRotator<TEvent extends string = EventType> = {
  next: (
    eventType: TEvent | null,
    textsByEvent?: AGUILoadingTextsByEvent<TEvent>,
  ) => string | null;
};

// -----
// The deck rules every adapter shares. Adapters
// only own the timer: call next() on each tick
// and on every eventType change, render the result.
// -----
export function createAGUILoadingCaptionRotator<
  TEvent extends string = EventType,
>(): AGUILoadingCaptionRotator<TEvent> {
  let deck: { key: TEvent | null; cards: string[] } | null = null;
  let lastText: string | null = null;

  return {
    next(eventType, textsByEvent) {
      // -----
      // Reshuffle on a new event OR once the current
      // deck runs dry — without the length check, the
      // deck sits at [] forever after its last pop and
      // the caption freezes on the last word.
      // -----
      if (deck == null || deck.key !== eventType || deck.cards.length === 0) {
        const cards = shuffle(textsForEventType(eventType, textsByEvent));
        // -----
        // A fresh deck never repeats the caption that's
        // already on screen. next() pops from the end,
        // so the end is the card that shows first.
        // -----
        const top = cards.length - 1;
        if (cards[top] === lastText && cards.length > 1) {
          const swapIndex = Math.floor(Math.random() * top);
          const swap = cards[top]!;
          cards[top] = cards[swapIndex]!;
          cards[swapIndex] = swap;
        }
        deck = { key: eventType, cards };
      }
      const next = deck.cards.pop() ?? null;
      if (next != null) lastText = next;
      return next;
    },
  };
}
