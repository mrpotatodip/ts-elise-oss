import { Link } from "@tanstack/react-router";

import { DocsPageHeader } from "./docs-page-header";

export function DocsIntroduction() {
  return (
    <div className="flex flex-col gap-8">
      <DocsPageHeader title="Introduction">
        <p>
          Elise UI is composable UI for AI agents. The components read{" "}
          <a
            className="underline underline-offset-4"
            href="https://github.com/ag-ui-protocol/ag-ui"
          >
            AG-UI
          </a>{" "}
          events and show what the agent is doing: starting a run, calling a tool,
          writing an answer, or failing. Not a generic spinner.
        </p>
      </DocsPageHeader>

      <section className="flex max-w-3xl flex-col gap-3">
        <h2 className="text-xl font-semibold">Works with any AG-UI stream</h2>
        <p className="text-foreground/80">
          Any agent that sends AG-UI events works, including{" "}
          <a className="underline underline-offset-4" href="https://tanstack.com/ai">
            TanStack AI
          </a>
          , whose chat streams are AG-UI events.
        </p>
      </section>

      <section className="flex max-w-3xl flex-col gap-3">
        <h2 className="text-xl font-semibold">Built from parts</h2>
        <p className="text-foreground/80">
          Each component is a root and a few small parts. Put the parts in any order,
          leave some out, and add your own elements between them. The parts have no
          colors, so they take your design.
        </p>
      </section>

      <section className="flex max-w-3xl flex-col gap-3">
        <h2 className="text-xl font-semibold">Components</h2>
        <ul className="flex flex-col gap-2 text-foreground/80">
          <li>
            <Link className="font-medium text-foreground underline underline-offset-4" to="/components/loading">
              Loading
            </Link>{" "}
            — one line that follows the latest event.
          </li>
          <li>
            <Link
              className="font-medium text-foreground underline underline-offset-4"
              to="/components/loading-stacked"
            >
              Loading Stacked
            </Link>{" "}
            — one row for each step: tool calls, messages, thinking.
          </li>
        </ul>
      </section>
    </div>
  );
}
