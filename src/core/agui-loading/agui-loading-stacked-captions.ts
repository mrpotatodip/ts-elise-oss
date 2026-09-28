import { valueForEventType } from "./agui-loading-by-event";
import {
  DEFAULT_LOADING_TEXTS_KEY,
  textsForEventType,
  WAITING_LOADING_TEXTS_KEY,
} from "./agui-loading-captions";
import type {
  AGUILoadingStackedState,
  AGUILoadingStackedStep,
  AGUILoadingStackedStepKind,
} from "./agui-loading-stacked-machine";
import { EventType } from "./agui-loading-machine";

// -----
// Every stacked map value is either a plain value or
// a function of the row — e.g. pick an icon or text
// from step.toolCallName. Plain values stay the
// simple case; the function is there when you need it.
// -----
export type AGUILoadingStackedStepValue<TValue> =
  | TValue
  | ((step: AGUILoadingStackedStep) => TValue);

export type AGUILoadingStackedStepTextValue = AGUILoadingStackedStepValue<string>;

// -----
// Keyed by the event that OPENED the row, not its
// latest one — a tool row goes START → ARGS → END →
// RESULT, so keying by the latest event would flip
// its icon and captions mid-row. Only these six open
// rows (RUN_ERROR opens the error row); keying
// anything else is a type error, not a silent miss.
// -----
export type AGUILoadingStackedStartEvent =
  | EventType.RUN_STARTED
  | EventType.TOOL_CALL_START
  | EventType.TEXT_MESSAGE_START
  | EventType.REASONING_START
  | EventType.SUBAGENT_STARTED
  | EventType.RUN_ERROR;

export const STACKED_STEP_START_EVENT = {
  run: EventType.RUN_STARTED,
  tool: EventType.TOOL_CALL_START,
  message: EventType.TEXT_MESSAGE_START,
  reasoning: EventType.REASONING_START,
  subagent: EventType.SUBAGENT_STARTED,
  error: EventType.RUN_ERROR,
} as const satisfies Record<AGUILoadingStackedStepKind, AGUILoadingStackedStartEvent>;

// -----
// The shape of every stacked ...ByEvent prop (busy,
// done, failed; texts and icons): opening events plus
// "default", each a value or a function of the row.
// -----
export type AGUILoadingStackedByEvent<TValue> = Partial<
  Record<
    AGUILoadingStackedStartEvent | typeof DEFAULT_LOADING_TEXTS_KEY,
    AGUILoadingStackedStepValue<TValue>
  >
>;

// -----
// The row's opening-event entry, else "default", else
// undefined — with a function entry already called on
// the row. An explicit null entry comes back as null.
// -----
export function stackedStepValue<TValue>(
  step: AGUILoadingStackedStep,
  byEvent: AGUILoadingStackedByEvent<TValue> | undefined,
): TValue | undefined {
  const entry = valueForEventType(STACKED_STEP_START_EVENT[step.kind], byEvent);
  // SAFETY: values are never functions themselves (text, text lists,
  // React nodes), so a function entry is always the (step) => value form.
  return typeof entry === "function"
    ? (entry as (step: AGUILoadingStackedStep) => TValue)(step)
    : entry;
}

// -----
// Captions for a busy row: yours, else ones that
// name the subagent, else the built-in ones.
// -----
export function stackedStepBusyTexts(
  step: AGUILoadingStackedStep,
  busyTextsByEvent: AGUILoadingStackedByEvent<readonly string[]> | undefined,
): readonly string[] {
  const custom = stackedStepValue(step, busyTextsByEvent);
  if (custom !== undefined) return custom;
  const name = step.kind === "subagent" ? step.subagentName : null;
  if (name) {
    return [
      `Delegating to ${name}`,
      `Handing off to ${name}`,
      `Briefing ${name}`,
      `Calling in ${name}`,
    ];
  }
  return textsForEventType(STACKED_STEP_START_EVENT[step.kind], undefined);
}

// -----
// Captions for a waiting row: yours, else ones that
// name the tool or subagent, else the waiting ones.
// -----
export function stackedStepWaitingTexts(
  step: AGUILoadingStackedStep,
  waitingTextsByEvent: AGUILoadingStackedByEvent<readonly string[]> | undefined,
): readonly string[] {
  const custom = stackedStepValue(step, waitingTextsByEvent);
  if (custom !== undefined) return custom;
  const name = step.kind === "subagent" ? step.subagentName : step.toolCallName;
  if (name) return [`${name} is waiting`, `${name} is on hold`, `${name} is standing by`];
  return textsForEventType(WAITING_LOADING_TEXTS_KEY, undefined);
}

export const LOADING_STACKED_DONE_TEXTS = {
  [EventType.RUN_STARTED]: "Started",
  [EventType.TOOL_CALL_START]: (step) =>
    step.toolCallName ? `Called ${step.toolCallName}` : "Called a tool",
  [EventType.TEXT_MESSAGE_START]: "Wrote a response",
  [EventType.REASONING_START]: "Thought it through",
  [EventType.SUBAGENT_STARTED]: (step) =>
    step.subagentName ? `Asked ${step.subagentName}` : "Asked a subagent",
  // The error row is always failed; this entry only completes the map.
  [EventType.RUN_ERROR]: "Something went wrong",
} satisfies Record<AGUILoadingStackedStartEvent, AGUILoadingStackedStepTextValue>;

export const LOADING_STACKED_FAILED_TEXTS = {
  [EventType.RUN_STARTED]: "Couldn't start",
  [EventType.TOOL_CALL_START]: (step) =>
    step.toolCallName ? `Stopped calling ${step.toolCallName}` : "Tool call stopped",
  [EventType.TEXT_MESSAGE_START]: "Response cut off",
  [EventType.REASONING_START]: "Stopped thinking",
  [EventType.SUBAGENT_STARTED]: (step) =>
    step.errorMessage || (step.subagentName ? `${step.subagentName} failed` : "Subagent failed"),
  [EventType.RUN_ERROR]: (step) => step.errorMessage || "Something went wrong",
} satisfies Record<AGUILoadingStackedStartEvent, AGUILoadingStackedStepTextValue>;

// -----
// Your text, else why it stopped, else built-in.
// Null for busy or waiting rows: those rotate.
// -----
export function stackedStepSettledText(
  step: AGUILoadingStackedStep,
  overrides?: {
    doneTextsByEvent?: AGUILoadingStackedByEvent<string>;
    failedTextsByEvent?: AGUILoadingStackedByEvent<string>;
  },
): string | null {
  if (step.status === "active" || step.status === "waiting") return null;
  const [custom, builtIn] =
    step.status === "done"
      ? [overrides?.doneTextsByEvent, LOADING_STACKED_DONE_TEXTS]
      : [overrides?.failedTextsByEvent, LOADING_STACKED_FAILED_TEXTS];
  const customText = stackedStepValue(step, custom);
  if (customText !== undefined) return customText;
  if (step.status === "failed" && step.failReason) {
    return step.failReason === "stopped" ? "Stopped" : "Cancelled";
  }
  const builtInText = builtIn[STACKED_STEP_START_EVENT[step.kind]];
  return typeof builtInText === "function" ? builtInText(step) : builtInText;
}

// -----
// The one-line summary a finished stack collapses to
// (whenDone="collapse"), e.g. "Finished · 4 steps".
// -----
export function stackedSummaryText(state: AGUILoadingStackedState): string {
  const count = stackedStepCount(state);
  const steps = `${count} ${count === 1 ? "step" : "steps"}`;
  return state.status === "done" ? `Finished · ${steps}` : `Stopped · ${steps}`;
}

// Rows of work in the stack. The error row isn't a step of work, so it isn't counted.
export function stackedStepCount(state: AGUILoadingStackedState): number {
  return state.stepOrder.filter((id) => state.steps[id]?.kind !== "error").length;
}
