// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  aguiLoadingStackedReducer,
  EventType,
  initialAGUILoadingStackedState,
  type AGUILoadingStackedEvent,
  type AGUILoadingStackedState,
} from "../../..";

import {
  AGUILoadingStacked,
  AGUILoadingStackedEarlier,
  AGUILoadingStackedStepIcon,
  AGUILoadingStackedSteps,
  AGUILoadingStackedStepSubagent,
  AGUILoadingStackedStepText,
  AGUILoadingStackedSummaryDone,
  AGUILoadingStackedSummaryFailed,
  type AGUILoadingStackedProps,
} from ".";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function stateAfter(...events: AGUILoadingStackedEvent[]): AGUILoadingStackedState {
  return events.reduce(aguiLoadingStackedReducer, initialAGUILoadingStackedState);
}

const started: AGUILoadingStackedEvent = { type: EventType.RUN_STARTED, runId: "r1" };
const toolStart = (id: string, name: string): AGUILoadingStackedEvent => ({
  type: EventType.TOOL_CALL_START,
  toolCallId: id,
  toolCallName: name,
});
const toolEnd = (id: string): AGUILoadingStackedEvent => ({
  type: EventType.TOOL_CALL_END,
  toolCallId: id,
});
const finished: AGUILoadingStackedEvent = { type: EventType.RUN_FINISHED, runId: "r1" };

const running = stateAfter(started, toolStart("a", "search"));
const done = stateAfter(started, toolStart("a", "search"), toolEnd("a"), finished);

function loader(
  state: AGUILoadingStackedState,
  props: Partial<AGUILoadingStackedProps> = {},
  children: ReactNode = (
    <>
      <AGUILoadingStackedSteps>
        <AGUILoadingStackedStepText />
      </AGUILoadingStackedSteps>
      <AGUILoadingStackedSummaryDone />
    </>
  ),
) {
  return (
    <AGUILoadingStacked state={state} {...(props as object)}>
      {children}
    </AGUILoadingStacked>
  );
}

const rows = () => screen.queryAllByRole("listitem");

describe("AGUILoadingStacked", () => {
  it("throws a clear error when a part is outside the root", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AGUILoadingStackedSteps>x</AGUILoadingStackedSteps>)).toThrow(
      "AGUILoadingStackedSteps must be inside AGUILoadingStacked",
    );
  });

  it("throws a clear error when a row part is outside Steps", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(loader(running, {}, <AGUILoadingStackedStepIcon />))).toThrow(
      "AGUILoadingStackedStepIcon must be inside AGUILoadingStackedSteps",
    );
  });

  it("renders nothing before the run starts", () => {
    const { container } = render(loader(initialAGUILoadingStackedState));
    expect(container.innerHTML).toBe("");
  });

  it("repeats the row template once per step, in your order", () => {
    render(
      loader(
        running,
        {},
        <AGUILoadingStackedSteps animate={false}>
          <AGUILoadingStackedStepText data-testid="text" />
          <span data-testid="mine">•</span>
          <AGUILoadingStackedStepIcon data-testid="icon" />
        </AGUILoadingStackedSteps>,
      ),
    );

    expect(rows()).toHaveLength(2);
    const order = [...rows()[1]!.children].map((el) => el.getAttribute("data-testid"));
    expect(order).toEqual(["text", "mine", "icon"]);
  });

  it("sets data-status and data-kind on each row", () => {
    render(loader(running));
    const [runRow, toolRow] = rows();
    expect(runRow!.dataset).toMatchObject({ status: "done", kind: "run" });
    expect(toolRow!.dataset).toMatchObject({ status: "active", kind: "tool" });
  });

  it("keeps the finished rows by default", () => {
    const { rerender } = render(loader(running));
    rerender(loader(done));
    act(() => vi.advanceTimersByTime(60_000));

    expect(rows()).toHaveLength(2);
    expect(screen.getByRole("status").dataset.view).toBe("steps");
  });

  it("folds into the summary after lingerMs with whenDone collapse", () => {
    const props = { whenDone: "collapse", lingerMs: 500 } as const;
    const { rerender } = render(loader(running, props));
    rerender(loader(done, props));
    expect(rows()).toHaveLength(2);

    act(() => vi.advanceTimersByTime(500));
    expect(rows()).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toContain("Finished · 2 steps");
  });

  it("hides everything after lingerMs with whenDone hide", () => {
    const props = { whenDone: "hide", lingerMs: 500 } as const;
    const { rerender } = render(loader(running, props));
    rerender(loader(done, props));
    expect(screen.queryByRole("status")).not.toBeNull();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("merges className over the base layout", () => {
    render(loader(running, { className: "gap-4" }));
    const root = screen.getByRole("status");
    expect(root.className).toContain("gap-4");
    expect(root.className).not.toContain("gap-1.5");
  });
});

describe("AGUILoadingStackedEarlier", () => {
  const three = stateAfter(started, toolStart("a", "one"), toolStart("b", "two"));

  it("counts the rows maxVisible hides", () => {
    render(
      loader(
        three,
        { maxVisible: 1 },
        <>
          <AGUILoadingStackedEarlier data-testid="earlier" />
          <AGUILoadingStackedSteps animate={false}>
            <AGUILoadingStackedStepText />
          </AGUILoadingStackedSteps>
        </>,
      ),
    );
    expect(screen.getByTestId("earlier").textContent).toBe("+2 earlier");
    expect(rows()).toHaveLength(1);
  });

  it("shows nothing when all rows fit", () => {
    render(loader(three, {}, <AGUILoadingStackedEarlier data-testid="earlier" />));
    expect(screen.queryByTestId("earlier")).toBeNull();
  });
});

describe("AGUILoadingStackedStepText", () => {
  it("shows done text from a function of the step, with no suffix", () => {
    render(
      loader(
        done,
        {},
        <AGUILoadingStackedSteps animate={false}>
          <AGUILoadingStackedStepText
            data-testid="text"
            doneByEvent={{ [EventType.TOOL_CALL_START]: (step) => `Checked ${step.toolCallName}` }}
          />
        </AGUILoadingStackedSteps>,
      ),
    );
    const toolText = screen.getAllByTestId("text")[1]!.textContent;
    expect(toolText).toContain("Checked search");
    expect(toolText).not.toContain("...");
  });
});

describe("AGUILoadingStackedStepIcon", () => {
  it("picks the icon by row status", () => {
    render(
      loader(
        running,
        {},
        <AGUILoadingStackedSteps animate={false}>
          <AGUILoadingStackedStepIcon
            data-testid="icon"
            busyFallback={<i>busy</i>}
            doneFallback={<i>done</i>}
          />
        </AGUILoadingStackedSteps>,
      ),
    );
    const [runIcon, toolIcon] = screen.getAllByTestId("icon");
    expect(runIcon!.textContent).toBe("done");
    expect(toolIcon!.textContent).toBe("busy");
  });
});

describe("AGUILoadingStackedSummaryDone and SummaryFailed", () => {
  const collapse = { whenDone: "collapse", lingerMs: 500 } as const;
  const failed = stateAfter(started, toolStart("a", "search"), {
    type: EventType.RUN_ERROR,
    message: "boom",
  });
  const summaries = (
    <>
      <AGUILoadingStackedSummaryDone
        data-testid="done"
        text={(steps) => `All set in ${steps} moves`}
      />
      <AGUILoadingStackedSummaryFailed data-testid="failed" text="Gave up" />
    </>
  );

  function renderFolded(end: AGUILoadingStackedState, summary: ReactNode = summaries) {
    const { rerender } = render(loader(running, collapse, summary));
    rerender(loader(end, collapse, summary));
    act(() => vi.advanceTimersByTime(500));
  }

  it("shows only the done part after a finished run, with text from the step count", () => {
    renderFolded(done);
    expect(screen.getByTestId("done").textContent).toBe("All set in 2 moves");
    expect(screen.queryByTestId("failed")).toBeNull();
  });

  it("shows only the failed part after a failed run", () => {
    renderFolded(failed);
    expect(screen.getByTestId("failed").textContent).toBe("Gave up");
    expect(screen.queryByTestId("done")).toBeNull();
  });

  it("uses the built-in text when text is left out", () => {
    renderFolded(done, <AGUILoadingStackedSummaryDone data-testid="done" />);
    expect(screen.getByTestId("done").textContent).toBe("Finished · 2 steps");
  });

  it("shows nothing while the rows are visible", () => {
    render(loader(done, {}, summaries));
    expect(screen.queryByTestId("done")).toBeNull();
  });
});

const subagentStart = (id: string, name: string): AGUILoadingStackedEvent => ({
  type: EventType.SUBAGENT_STARTED,
  subagentRunId: id,
  name,
});

const childTool = (id: string, name: string, subagentRunId: string): AGUILoadingStackedEvent => ({
  type: EventType.TOOL_CALL_START,
  toolCallId: id,
  toolCallName: name,
  subagentRunId,
});

const waitingState = stateAfter(
  started,
  toolStart("a", "deleteFile"),
  {
    type: EventType.RUN_FINISHED,
    runId: "r1",
    outcome: { type: "interrupt", interrupts: [{ id: "int-1", toolCallId: "a" }] },
  },
);

describe("AGUILoadingStacked waiting", () => {
  const waitingLoader = (state: AGUILoadingStackedState) =>
    loader(
      state,
      { whenDone: "hide", lingerMs: 0 },
      <AGUILoadingStackedSteps animate={false}>
        <AGUILoadingStackedStepIcon data-testid="icon" />
        <AGUILoadingStackedStepText
          data-testid="text"
          waitingByEvent={{ [EventType.TOOL_CALL_START]: ["Approve delete?"] }}
        />
      </AGUILoadingStackedSteps>,
    );

  it("stays on screen while the run waits, whatever whenDone says", () => {
    const { rerender } = render(waitingLoader(running));
    rerender(waitingLoader(waitingState));
    act(() => vi.advanceTimersByTime(60_000));

    const root = screen.getByRole("status");
    expect(root.dataset.status).toBe("waiting");
    expect(root.getAttribute("aria-busy")).toBe("false");
  });

  it("marks the waiting row and rotates its waiting text", () => {
    render(waitingLoader(waitingState));
    const row = rows()[1]!;
    expect(row.dataset.status).toBe("waiting");
    expect(row.textContent).toContain("Approve delete?");
  });

  it("shows a still pause icon on the waiting row", () => {
    render(waitingLoader(waitingState));
    const icon = screen.getAllByTestId("icon")[1]!;
    expect(icon.querySelector(".animate-spin")).toBeNull();
    expect(icon.querySelector("svg")).not.toBeNull();
  });
});

describe("AGUILoadingStacked subagents", () => {
  const withSubagent = stateAfter(
    started,
    subagentStart("sub-1", "researcher"),
    childTool("t1", "search", "sub-1"),
    { type: EventType.SUBAGENT_FINISHED, subagentRunId: "sub-1" },
  );

  it("names the subagent on its row when it's done", () => {
    render(loader(withSubagent));
    const row = rows()[1]!;
    expect(row.dataset.kind).toBe("subagent");
    expect(row.textContent).toContain("Asked researcher");
  });

  it("marks rows that belong to a subagent with data-subagent", () => {
    render(loader(withSubagent));
    const [runRow, subagentRow, toolRow] = rows();
    expect(runRow!.dataset.subagent).toBeUndefined();
    expect(subagentRow!.dataset.subagent).toBeUndefined();
    expect(toolRow!.dataset.subagent).toBe("sub-1");
  });

  it("shows the owning subagent's name on its rows only", () => {
    render(
      loader(
        withSubagent,
        {},
        <AGUILoadingStackedSteps animate={false}>
          <AGUILoadingStackedStepSubagent data-testid="owner" />
        </AGUILoadingStackedSteps>,
      ),
    );
    const owners = screen.getAllByTestId("owner");
    expect(owners).toHaveLength(1);
    expect(owners[0]!.textContent).toBe("researcher·");
  });
});
