import { EventType } from "./agui-loading-machine";

export const DEFAULT_LOADING_TEXTS_KEY = "default";
export const WAITING_LOADING_TEXTS_KEY = "waiting";
export const STOPPED_LOADING_TEXTS_KEY = "stopped";

export type AGUILoadingStatusKey =
  | typeof WAITING_LOADING_TEXTS_KEY
  | typeof STOPPED_LOADING_TEXTS_KEY;

// -----
// TEvent defaults to the real @ag-ui/core EventType,
// so a caller gets compile-time strictness for free —
// eventType and textsByEvent keys can only be actual
// AG-UI events (plus "default"). A caller that genuinely
// needs non-protocol events (a custom synthetic status
// their own stream layer adds on top of AG-UI) opts into
// that explicitly by widening the parameter, e.g.
// AGUILoadingText<EventType | "reconnecting">. Nothing
// here silently downgrades to "any string" — you have to
// ask for it.
// -----
export type AGUILoadingTextsByEvent<TEvent extends string = EventType> = Partial<
  Record<TEvent | AGUILoadingStatusKey | typeof DEFAULT_LOADING_TEXTS_KEY, readonly string[]>
>;

// -----
// Typed as Record (not Partial) over the full
// event set so TypeScript itself catches a missing entry the
// moment @ag-ui/core adds a new event, rather than silently
// falling through to "default" at runtime. Keyed directly by
// the event itself (RUN_STARTED: [...]) rather than [key,
// value] tuples, so it reads the same shape as the
// textsByEvent override prop. "default" lives here too
// instead of as its own constant, since it's really just
// this map's fallback entry.
// -----
export const LOADING_TEXTS_BY_EVENT = {
  [EventType.RUN_STARTED]: [
    "Reaching",
    "Knocking",
    "Unlocking",
    "Summoning",
    "Tuning",
  ],
  [EventType.RUN_FINISHED]: [
    "Wrapping up",
    "Closing out",
    "Finishing",
    "Concluding",
    "Tying off",
  ],
  [EventType.RUN_ERROR]: [
    "Hitting a snag",
    "Running into trouble",
    "Stumbling",
    "Faltering",
    "Struggling",
  ],
  [EventType.STEP_STARTED]: [
    "Starting",
    "Beginning",
    "Kicking off",
    "Launching",
    "Setting off",
  ],
  [EventType.STEP_FINISHED]: [
    "Wrapping step",
    "Finishing step",
    "Closing step",
    "Completing",
    "Checking off",
  ],
  [EventType.TOOL_CALL_START]: [
    "Calling",
    "Dispatching",
    "Querying",
    "Fetching",
    "Invoking",
  ],
  [EventType.TOOL_CALL_ARGS]: [
    "Preparing",
    "Configuring",
    "Filling in",
    "Specifying",
    "Detailing",
  ],
  [EventType.TOOL_CALL_CHUNK]: [
    "Streaming",
    "Relaying",
    "Piecing together",
    "Assembling",
    "Threading",
  ],
  [EventType.TOOL_CALL_END]: [
    "Wrapping up",
    "Closing out",
    "Finalizing",
    "Concluding",
    "Tying off",
  ],
  [EventType.TOOL_CALL_RESULT]: [
    "Ingesting",
    "Absorbing",
    "Unpacking",
    "Weighing",
    "Unfolding",
  ],
  [EventType.TEXT_MESSAGE_START]: [
    "Drafting",
    "Sketching",
    "Noodling",
    "Sharpening",
    "Stirring",
  ],
  [EventType.TEXT_MESSAGE_CONTENT]: [
    "Writing",
    "Narrating",
    "Phrasing",
    "Polishing",
    "Sailing",
  ],
  [EventType.TEXT_MESSAGE_CHUNK]: [
    "Streaming",
    "Relaying",
    "Piecing together",
    "Assembling",
    "Threading",
  ],
  [EventType.TEXT_MESSAGE_END]: [
    "Wrapping",
    "Finishing",
    "Sealing",
    "Tidying",
    "Settling",
  ],
  [EventType.REASONING_START]: [
    "Thinking",
    "Pondering",
    "Mulling",
    "Reasoning",
    "Considering",
  ],
  [EventType.REASONING_MESSAGE_START]: [
    "Thinking",
    "Pondering",
    "Mulling",
    "Reasoning",
    "Considering",
  ],
  [EventType.REASONING_MESSAGE_CONTENT]: [
    "Reasoning through",
    "Working it out",
    "Puzzling",
    "Mulling over",
    "Chewing on",
  ],
  [EventType.REASONING_MESSAGE_CHUNK]: [
    "Reasoning through",
    "Working it out",
    "Puzzling",
    "Mulling over",
    "Chewing on",
  ],
  [EventType.REASONING_MESSAGE_END]: [
    "Landing on it",
    "Settling",
    "Wrapping thought",
    "Finishing thought",
    "Concluding",
  ],
  [EventType.REASONING_END]: [
    "Landing on it",
    "Settling",
    "Wrapping thought",
    "Finishing thought",
    "Concluding",
  ],
  [EventType.REASONING_ENCRYPTED_VALUE]: [
    "Securing",
    "Sealing",
    "Encrypting",
    "Locking",
    "Safeguarding",
  ],
  [EventType.SUBAGENT_STARTED]: [
    "Delegating",
    "Handing off",
    "Calling in help",
    "Briefing",
    "Dispatching",
  ],
  [EventType.SUBAGENT_FINISHED]: [
    "Collecting",
    "Regrouping",
    "Taking it back",
    "Gathering results",
    "Merging",
  ],
  [EventType.SUBAGENT_ERROR]: [
    "Recovering",
    "Rerouting",
    "Regrouping",
    "Adjusting",
    "Retrying",
  ],
  [EventType.STATE_SNAPSHOT]: [
    "Capturing",
    "Snapshotting",
    "Recording",
    "Freezing",
    "Mapping",
  ],
  [EventType.STATE_DELTA]: [
    "Updating",
    "Adjusting",
    "Patching",
    "Syncing",
    "Refreshing",
  ],
  [EventType.MESSAGES_SNAPSHOT]: [
    "Reviewing",
    "Gathering",
    "Collecting",
    "Compiling",
    "Assembling",
  ],
  [EventType.ACTIVITY_SNAPSHOT]: [
    "Checking in",
    "Surveying",
    "Scanning",
    "Observing",
    "Taking stock",
  ],
  [EventType.ACTIVITY_DELTA]: [
    "Tracking",
    "Noting",
    "Logging",
    "Recording",
    "Watching",
  ],
  [EventType.RAW]: [
    "Passing through",
    "Relaying",
    "Forwarding",
    "Routing",
    "Handling",
  ],
  [EventType.CUSTOM]: [
    "Finishing up",
    "Putting it together",
    "Wrapping up",
    "Finalizing",
    "Polishing off",
  ],
  [WAITING_LOADING_TEXTS_KEY]: [
    "Waiting",
    "Idling",
    "Standing by",
    "Holding",
    "Paused",
  ],
  [STOPPED_LOADING_TEXTS_KEY]: [
    "Stopped",
    "Halted",
    "Called off",
    "Cut short",
    "Ended early",
  ],
  [DEFAULT_LOADING_TEXTS_KEY]: [
    "Working",
    "Processing",
    "Preparing",
    "Loading",
    "In progress",
  ],
} satisfies Record<
  EventType | AGUILoadingStatusKey | typeof DEFAULT_LOADING_TEXTS_KEY,
  readonly string[]
>;

// -----
// LOADING_TEXTS_BY_EVENT only ever holds real AG-UI
// keys, so a widened, non-AG-UI TEvent key just misses
// it and falls through to overrides/default — the cast
// only relaxes the lookup, not what's actually in the map.
// -----
export function textsForEventType<TEvent extends string>(
  eventType: TEvent | AGUILoadingStatusKey | null,
  overrides: AGUILoadingTextsByEvent<TEvent> | undefined,
): readonly string[] {
  const key = eventType ?? DEFAULT_LOADING_TEXTS_KEY;
  // SAFETY: indexing with a TEvent key that isn't a real EventType member
  // just misses this object (returns undefined), which the ?? chain below
  // already handles — the cast only widens the key type, not the values.
  const builtIn = LOADING_TEXTS_BY_EVENT as AGUILoadingTextsByEvent<TEvent> & {
    [DEFAULT_LOADING_TEXTS_KEY]: readonly string[];
  };
  return (
    overrides?.[key] ??
    builtIn[key] ??
    overrides?.[DEFAULT_LOADING_TEXTS_KEY] ??
    builtIn[DEFAULT_LOADING_TEXTS_KEY]
  );
}

export function shuffle(items: readonly string[]): string[] {
  const deck = [...items];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = deck[i]!;
    deck[i] = deck[j]!;
    deck[j] = swap;
  }
  return deck;
}
