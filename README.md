# Elise UI

Composable UI for AI agents. Components read
[AG-UI protocol](https://github.com/ag-ui-protocol/ag-ui) events (run started,
tool calls, streaming text messages, errors, etc.) and show what the agent is
actually doing, instead of a generic spinner.

Works with any AG-UI stream, including
[TanStack AI](https://tanstack.com/ai), whose chat streams are AG-UI events.

The first component is the loading indicator: `AGUILoading` (one line) and
`AGUILoadingStacked` (one row per step).

**Docs and live demos:** [ui.helloelise.app](https://ui.helloelise.app)

## Install

With the [shadcn CLI](https://ui.shadcn.com/docs/cli), in a project that has a
`components.json`:

```bash
npx shadcn@latest add https://ui.helloelise.app/r/agui-loading.json
# or straight from GitHub
npx shadcn@latest add mrpotatodip/ts-elise-oss/agui-loading
```

To use the short `@elise` name, add the registry to your `components.json`:

```json
{
  "registries": {
    "@elise": "https://ui.helloelise.app/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @elise/agui-loading
```

This copies the engine and the React adapter into
`<your components alias>/agui-loading/` (usually `src/components/agui-loading/`)
and installs `@ag-ui/core`, `motion`, `clsx` and `tailwind-merge`. Import from
there, e.g. `@/components/agui-loading` and
`@/components/agui-loading/adapters/react`.

Or copy `src/core/agui-loading/` from this repo by hand (see below).

## What's here

- **`src/core/agui-loading/`**: everything you need, in one folder. The engine
  files at the top import nothing from React or any other UI framework; its
  only runtime dependency is `@ag-ui/core`.
  - `agui-loading-machine.ts`: a pure `(state, event) => state` reducer over
    real `@ag-ui/core` events. No DOM, no `fetch`, no timers.
  - `agui-loading-captions.ts`: per-event-type caption text ("Calling",
    "Streaming", "Wrapping up", …) and the lookup with fallbacks.
  - `agui-loading-caption-rotator.ts`: the caption deck rules (shuffle, no
    back-to-back repeats, reshuffle when empty, reset on a new event).
    Adapters only run the timer and call `next()`.
  - `agui-loading-by-event.ts`: the lookup for any per-event override map
    (event entry, then `default`), used for per-event icons.
  - `agui-loading-presence.ts`: when the loader is on screen. When a run ends
    it hides, lingers briefly (`LINGER_MS`, 1200 ms) on the final caption
    ("Wrapping up", or the error caption) before hiding, or keeps that caption
    until the next run.
  - `agui-loading-stacked-machine.ts` and
    `agui-loading-stacked-captions.ts`: a separate reducer for the
    stacked loader (one row per tool call, message or reasoning block) and the
    past-tense wording for finished rows ("Called search"). The single-line
    loader's reducer is untouched by it.
  - `agui-loading-animations.ts`: timings and frame math for the caption
    animations (slide, typing, shuffle).
- **`src/core/agui-loading/adapters/react/`**: the React adapter, with the
  `AGUILoading` and `AGUILoadingStacked` components (each built
  from small parts you arrange yourself), the `useAGUILoadingCaption` hook and the
  caption animations. It also needs `react`, `motion`, `clsx` and
  `tailwind-merge`.
- **`src/modules/agui-loading-docs/`**: the docs site, not needed to use the
  loader. There's one file per component in `components/examples/`. Each file
  sets up its state with the real core reducer, renders the component with
  every prop listed (commented lines show the defaults), and is shown under its
  own preview via `?raw`. The Play buttons replay event sequences from
  `data/agui-loading-docs-scenarios.ts`.

To use it in another project, copy the `src/core/agui-loading/` folder to any
place in your project. All imports inside it are relative, so no path alias
is needed. Nothing in it imports from the docs.

## Running it

```bash
pnpm install
pnpm dev    # docs
pnpm test   # core tests
```

Opens the docs at `http://localhost:3200`. `pnpm run deploy` builds and deploys
them to Cloudflare Workers at `ui.helloelise.app` (set in `wrangler.jsonc`).
Everything is synthetic — no
network calls, no backend, no environment variables needed.

## Using the engine in your own app (React)

```ts
import { useReducer } from "react";
import { aguiLoadingReducer, initialAGUILoadingState } from "@/core/agui-loading";
import {
  AGUILoading,
  AGUILoadingIcon,
  AGUILoadingText,
} from "@/core/agui-loading/adapters/react";

const [state, dispatch] = useReducer(aguiLoadingReducer, initialAGUILoadingState);

// dispatch(event) for every AG-UI event your stream layer receives, then:
<AGUILoading active={state.status === "running"} eventType={state.lastEventType}>
  <AGUILoadingIcon />
  <AGUILoadingText />
</AGUILoading>
```

The parts go in any order, with your own elements between them. Override text
per event type with `byEvent` on `AGUILoadingText` and icons with
`byEvent` on `AGUILoadingIcon` (same keys, plus `default`; map an event
to `null` for no icon), or swap the text animation with
`animation="slide-up" | "slide-down" | "slide-left" | "slide-right" | "typing" | "shuffle"`. Add `<AGUILoadingEvent />`
to show the event name. What happens when `active` turns false is set by
`whenDone` on the root:

- `"linger"` (default): stays for `lingerMs` (default 1200) on the finish or
  error caption with its icon paused, then hides. `lingerMs` is only accepted
  with this option.
- `"hide"`: disappears as soon as the run ends.
- `"keep"`: stays on the finish or error caption, icon paused, until the next
  run starts.

## Status

Extracted from a private product's prototype exploration. The engine itself
is stable and dependency-light; the surrounding app scaffold (routing,
styling) is intentionally minimal.

## License

[MIT](LICENSE) © 2026 Elise
