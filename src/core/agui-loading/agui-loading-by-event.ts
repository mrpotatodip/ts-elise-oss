import { DEFAULT_LOADING_TEXTS_KEY, type AGUILoadingStatusKey } from "./agui-loading-captions";
import type { EventType } from "./agui-loading-machine";

// -----
// Any per-event override map (icons, colors, …) —
// same keys as textsByEvent, so it shares the same
// strict-by-default TEvent and "default" fallback.
// TValue is whatever the adapter renders (a ReactNode,
// a Vue component, a class name); core never looks inside.
// -----
export type AGUILoadingByEvent<TValue, TEvent extends string = EventType> = Partial<
  Record<TEvent | AGUILoadingStatusKey | typeof DEFAULT_LOADING_TEXTS_KEY, TValue>
>;

// -----
// The event's own entry, else "default", else
// undefined for the adapter's built-in fallback.
// Checks key presence rather than ??, so a caller
// can map an event to null to mean "nothing here"
// instead of it silently falling through.
// -----
export function valueForEventType<TValue, TEvent extends string = EventType>(
  eventType: TEvent | AGUILoadingStatusKey | null,
  byEvent: AGUILoadingByEvent<TValue, TEvent> | undefined,
): TValue | undefined {
  if (!byEvent) return undefined;
  if (eventType != null && Object.hasOwn(byEvent, eventType)) return byEvent[eventType];
  if (Object.hasOwn(byEvent, DEFAULT_LOADING_TEXTS_KEY)) {
    return byEvent[DEFAULT_LOADING_TEXTS_KEY];
  }
  return undefined;
}
