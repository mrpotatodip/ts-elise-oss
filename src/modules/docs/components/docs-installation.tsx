import type { ReactNode } from "react";

import { DocsCodeBlock } from "./docs-code-block";
import { DocsPageHeader } from "./docs-page-header";

const INSTALL = `pnpm add @ag-ui/core motion clsx tailwind-merge`;

const USAGE = `
import { useReducer } from "react";
import { aguiLoadingReducer, initialAGUILoadingState } from "./agui-loading";
import {
  AGUILoading,
  AGUILoadingIcon,
  AGUILoadingText,
} from "./agui-loading/adapters/react";

export function AgentStatus() {
  const [state, dispatch] = useReducer(aguiLoadingReducer, initialAGUILoadingState);

  // Call dispatch(event) for each AG-UI event your agent sends.

  return (
    <AGUILoading active={state.status === "running"} eventType={state.lastEventType}>
      <AGUILoadingIcon />
      <AGUILoadingText />
    </AGUILoading>
  );
}
`;

export function DocsInstallation() {
  return (
    <div className="flex flex-col gap-8">
      <DocsPageHeader title="Installation">
        <p>Copy one folder into your project. There is no package to install yet.</p>
      </DocsPageHeader>

      <DocsStep number={1} title="Copy the folder">
        <p>
          Copy <code className="font-mono text-sm">src/core/agui-loading/</code> to any
          place in your project. All imports inside it are relative, so you don't need a
          path alias.
        </p>
      </DocsStep>

      <DocsStep number={2} title="Install the packages">
        <DocsCodeBlock code={INSTALL} />
        <p>You also need React 19.</p>
      </DocsStep>

      <DocsStep number={3} title="Set up Tailwind CSS v4">
        <p>
          The components use Tailwind classes for their layout, the spinner, and the
          text for screen readers. Without Tailwind v4, the text shows two times and the
          spinner doesn't show.
        </p>
      </DocsStep>

      <DocsStep number={4} title="Use it">
        <p>
          Keep the agent state with the reducer, and pass it to the component. This
          example puts the folder at <code className="font-mono text-sm">./agui-loading</code>.
        </p>
        <DocsCodeBlock code={USAGE} />
      </DocsStep>
    </div>
  );
}

function DocsStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex max-w-3xl flex-col gap-3">
      <h2 className="text-xl font-semibold">
        <span className="mr-2 text-muted-foreground">{number}.</span>
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-foreground/80">{children}</div>
    </section>
  );
}
