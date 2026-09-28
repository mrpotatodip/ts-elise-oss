import type { ReactNode } from "react";

import { DocsCodeBlock } from "./docs-code-block";
import { DocsPageHeader } from "./docs-page-header";

const REGISTRY_URL_ADD = `npx shadcn@latest add https://ui.helloelise.app/r/agui-loading.json`;

const REGISTRY_GITHUB_ADD = `npx shadcn@latest add mrpotatodip/ts-elise-oss/agui-loading`;

const REGISTRY_NAMESPACE = `
{
  "registries": {
    "@elise": "https://ui.helloelise.app/r/{name}.json"
  }
}
`;

const REGISTRY_NAMESPACE_ADD = `npx shadcn@latest add @elise/agui-loading`;

const INSTALL = `pnpm add @ag-ui/core motion clsx tailwind-merge`;

const USAGE = `
import { useReducer } from "react";
import { aguiLoadingReducer, initialAGUILoadingState } from "@/components/agui-loading";
import {
  AGUILoading,
  AGUILoadingIcon,
  AGUILoadingText,
} from "@/components/agui-loading/adapters/react";

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
        <p>Add the files with the shadcn CLI, or copy one folder by hand.</p>
      </DocsPageHeader>

      <DocsStep number={1} title="Add the files">
        <h3 className="font-medium text-foreground">With the shadcn registry (recommended)</h3>
        <p>
          You need a <code className="font-mono text-sm">components.json</code> in your
          project. Run <code className="font-mono text-sm">npx shadcn@latest init</code> if
          you don't have one. Then add the component:
        </p>
        <DocsCodeBlock code={REGISTRY_URL_ADD} />
        <p>Or add it straight from the GitHub repo:</p>
        <DocsCodeBlock code={REGISTRY_GITHUB_ADD} />
        <p>
          To use the short <code className="font-mono text-sm">@elise</code> name, add the
          registry to your <code className="font-mono text-sm">components.json</code>:
        </p>
        <DocsCodeBlock code={REGISTRY_NAMESPACE} />
        <DocsCodeBlock code={REGISTRY_NAMESPACE_ADD} />
        <p>
          The files go to <code className="font-mono text-sm">agui-loading/</code> in your
          components folder, usually{" "}
          <code className="font-mono text-sm">src/components/agui-loading/</code>. The CLI
          also installs <code className="font-mono text-sm">@ag-ui/core</code>,{" "}
          <code className="font-mono text-sm">motion</code>,{" "}
          <code className="font-mono text-sm">clsx</code> and{" "}
          <code className="font-mono text-sm">tailwind-merge</code>.
        </p>

        <h3 className="mt-2 font-medium text-foreground">By hand</h3>
        <p>
          Copy <code className="font-mono text-sm">src/core/agui-loading/</code> from the
          repo to any place in your project. All imports inside it are relative, so you
          don't need a path alias. Then install the packages:
        </p>
        <DocsCodeBlock code={INSTALL} />
        <p>You also need React 19.</p>
      </DocsStep>

      <DocsStep number={2} title="Set up Tailwind CSS v4">
        <p>
          The components use Tailwind classes for their layout, the spinner, and the
          text for screen readers. Without Tailwind v4, the text shows two times and the
          spinner doesn't show.
        </p>
      </DocsStep>

      <DocsStep number={3} title="Use it">
        <p>
          Keep the agent state with the reducer, and pass it to the component. This
          example imports from where the shadcn CLI puts the folder. If you copied it by
          hand, change the import paths to match.
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
