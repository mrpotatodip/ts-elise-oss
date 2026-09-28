// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventType } from "../../..";

import {
  AGUILoading,
  AGUILoadingEvent,
  AGUILoadingIcon,
  AGUILoadingText,
  type AGUILoadingProps,
} from ".";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderLoading(props: AGUILoadingProps) {
  return render(<AGUILoading {...props} />);
}

function loader(
  active: boolean,
  done: Pick<AGUILoadingProps, "whenDone" | "lingerMs"> = {},
  children: ReactNode = <AGUILoadingText byEvent={{ default: ["Working"] }} />,
) {
  return (
    <AGUILoading
      active={active}
      eventType={active ? EventType.RUN_STARTED : EventType.RUN_FINISHED}
      {...(done as object)}
    >
      {children}
    </AGUILoading>
  );
}

describe("AGUILoading", () => {
  it("throws a clear error when a part is outside the root", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AGUILoadingIcon />)).toThrow(
      "AGUILoadingIcon must be inside AGUILoading",
    );
  });

  it("renders the parts and your own elements in the order you write them", () => {
    renderLoading({
      active: true,
      eventType: EventType.TOOL_CALL_START,
      children: (
        <>
          <AGUILoadingText
            data-testid="text"
            byEvent={{ [EventType.TOOL_CALL_START]: ["Searching"] }}
          />
          <span data-testid="timer">3s</span>
          <AGUILoadingIcon data-testid="icon" />
        </>
      ),
    });

    const order = [...screen.getByRole("status").children].map((el) =>
      el.getAttribute("data-testid"),
    );
    expect(order).toEqual(["text", "timer", "icon"]);
    expect(screen.getByTestId("text").textContent).toContain("Searching");
  });

  it("merges className over the base row layout", () => {
    renderLoading({ active: true, eventType: null, className: "gap-4 text-red-500" });
    const root = screen.getByRole("status");
    expect(root.className).toContain("gap-4");
    expect(root.className).not.toContain("gap-2");
  });

  it("renders nothing before the agent starts", () => {
    const { container } = render(loader(false));
    expect(container.innerHTML).toBe("");
  });

  it("lingers by default, then hides", () => {
    const { rerender } = render(loader(true));
    rerender(loader(false));
    expect(screen.getByRole("status").dataset.presence).toBe("lingering");

    act(() => vi.advanceTimersByTime(1200));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("uses lingerMs for the linger time", () => {
    const { rerender } = render(loader(true, { lingerMs: 3000 }));
    rerender(loader(false, { lingerMs: 3000 }));

    act(() => vi.advanceTimersByTime(1200));
    expect(screen.queryByRole("status")).not.toBeNull();
    act(() => vi.advanceTimersByTime(1800));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("hides right away with whenDone hide", () => {
    const { rerender } = render(loader(true, { whenDone: "hide" }));
    rerender(loader(false, { whenDone: "hide" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps the last text with whenDone keep", () => {
    const { rerender } = render(loader(true, { whenDone: "keep" }));
    rerender(loader(false, { whenDone: "keep" }));

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole("status").dataset.presence).toBe("done");
  });

  it("marks the root busy only while running", () => {
    const { rerender } = render(loader(true, { whenDone: "keep" }));
    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
    rerender(loader(false, { whenDone: "keep" }));
    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("false");
  });
});

describe("AGUILoadingIcon", () => {
  it("shows the icon for the event, else the fallback", () => {
    const { rerender } = renderLoading({
      active: true,
      eventType: EventType.TOOL_CALL_START,
      children: (
        <AGUILoadingIcon
          data-testid="icon"
          byEvent={{ [EventType.TOOL_CALL_START]: <b>tool</b> }}
          fallback={<i>fallback</i>}
        />
      ),
    });
    expect(screen.getByTestId("icon").textContent).toBe("tool");

    rerender(
      <AGUILoading active eventType={EventType.RUN_STARTED}>
        <AGUILoadingIcon
          data-testid="icon"
          byEvent={{ [EventType.TOOL_CALL_START]: <b>tool</b> }}
          fallback={<i>fallback</i>}
        />
      </AGUILoading>,
    );
    expect(screen.getByTestId("icon").textContent).toBe("fallback");
  });
});

describe("AGUILoadingText", () => {
  it("adds no suffix to the text", () => {
    renderLoading({
      active: true,
      eventType: EventType.RUN_STARTED,
      children: (
        <AGUILoadingText
          data-testid="text"
          byEvent={{ [EventType.RUN_STARTED]: ["Waking up"] }}
        />
      ),
    });
    expect(screen.getByTestId("text").textContent).not.toContain("...");
  });

  it("gives screen readers one stable phrase per event", () => {
    renderLoading({
      active: true,
      eventType: EventType.RUN_STARTED,
      children: (
        <AGUILoadingText byEvent={{ [EventType.RUN_STARTED]: ["Waking up", "Starting"] }} />
      ),
    });
    const spoken = screen.getByText("Waking up", { selector: ".sr-only" });

    act(() => vi.advanceTimersByTime(10_000));
    expect(spoken.textContent).toBe("Waking up");
  });
});

describe("AGUILoadingEvent", () => {
  it("shows the event name without brackets", () => {
    renderLoading({
      active: true,
      eventType: EventType.TOOL_CALL_START,
      children: <AGUILoadingEvent data-testid="event" />,
    });
    expect(screen.getByTestId("event").textContent).toBe("TOOL_CALL_START");
  });

  it("shows nothing before the first event", () => {
    renderLoading({
      active: true,
      eventType: null,
      children: <AGUILoadingEvent data-testid="event" />,
    });
    expect(screen.queryByTestId("event")).toBeNull();
  });
});
