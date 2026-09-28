import type { DocsPart } from "@/modules/docs";

// -----
// Reference for each part of <AGUILoading />, shown
// under the examples. Keep it in step with the prop
// comments in src/core/agui-loading/adapters/react/agui-loading/.
// -----
export const AGUI_LOADING_DOCS_LOADING_PARTS: DocsPart[] = [
  {
    name: "AGUILoading",
    summary:
      "The root. It decides when the loader is on screen and tells the parts inside it which event came last. It draws nothing by itself, so put at least one part inside.",
    snippet: `
<AGUILoading active={state.status === "running"} eventType={state.lastEventType}>
  {/* parts go here */}
</AGUILoading>
`,
    props: [
      {
        name: "active",
        type: "boolean",
        required: true,
        description: "true while the agent works. Pass state.status === \"running\".",
      },
      {
        name: "eventType",
        type: "string | null",
        required: true,
        description:
          "The latest AG-UI event, e.g. TOOL_CALL_START. The icon and text use it to pick what to show. Pass state.lastEventType.",
      },
      {
        name: "whenDone",
        type: '"linger" | "hide" | "keep"',
        default: '"linger"',
        description:
          'What happens when the run ends. "linger" shows the last text for lingerMs, then hides. "hide" hides at once. "keep" leaves the last text until the next run.',
      },
      {
        name: "lingerMs",
        type: "number",
        default: "1200",
        description: 'Milliseconds the last text stays. Only works with whenDone="linger".',
      },
      {
        name: "waiting",
        type: "boolean",
        default: "false",
        description:
          'true while the run waits for input, like an approval. Pass state.status === "waiting". The loader stays on screen and shows the "waiting" text and icon.',
      },
      {
        name: "stopped",
        type: "boolean",
        default: "false",
        description:
          'true when someone cancelled the run. Pass state.status === "stopped". The parts show the "stopped" text and icon.',
      },
      {
        name: "subagent",
        type: "string | null",
        default: "null",
        description:
          "Name of the subagent that sent the latest event. Pass state.subagentName. Only <AGUILoadingSubagent /> reads it.",
      },
    ],
    dataAttributes: [
      {
        name: "data-presence",
        values: [
          { value: "running", description: "The agent works." },
          {
            value: "waiting",
            description:
              "The run waits for input, like an approval. It stays until the next run, whatever whenDone says.",
          },
          {
            value: "lingering",
            description:
              'The run ended (finished, failed or cancelled) and whenDone="linger". After lingerMs the loader removes itself.',
          },
          {
            value: "done",
            description:
              'The run ended and whenDone="keep". The last text stays until the next run.',
          },
        ],
      },
    ],
  },
  {
    name: "AGUILoadingIcon",
    summary:
      "A small icon for the latest event. With no byEvent it shows a spinner. The spinner stops when the run ends, and a pause circle replaces it while the run waits.",
    snippet: `
<AGUILoadingIcon
  byEvent={{
    [EventType.TOOL_CALL_START]: <Wrench className="size-3" />,
    [EventType.RUN_FINISHED]: <CircleCheck className="size-3" />,
  }}
/>
`,
    props: [
      {
        name: "byEvent",
        type: "{ [event]: ReactNode }",
        description:
          'An icon per event. Keys can also be "waiting", "stopped" or "default". Use null to show no icon for that event.',
      },
      {
        name: "fallback",
        type: "ReactNode",
        default: "spinner",
        description: "The icon for events that byEvent doesn't list.",
      },
      {
        name: "waitingFallback",
        type: "ReactNode",
        default: "pause circle",
        description: 'The icon while the run waits, if byEvent has no "waiting" key.',
      },
    ],
  },
  {
    name: "AGUILoadingText",
    summary:
      "Short text for the latest event, like \"Searching...\". If you give one event several phrases, they take turns. Screen readers hear the first phrase once, not every change.",
    snippet: `
<AGUILoadingText
  animation="typing"
  byEvent={{
    [EventType.RUN_STARTED]: ["Waking up..."],
    [EventType.TOOL_CALL_START]: ["Searching...", "Still searching..."],
    default: ["Working on it..."],
  }}
/>
`,
    props: [
      {
        name: "byEvent",
        type: "{ [event]: string[] }",
        description:
          'Phrases per event. Keys can also be "waiting", "stopped" or "default". Events you leave out use the built-in text.',
      },
      {
        name: "animation",
        type: '"slide-up" | "slide-down" | "slide-left" | "slide-right" | "typing" | "shuffle"',
        default: '"slide-up"',
        description: "How one phrase changes into the next.",
      },
      {
        name: "rotateEvery",
        type: "number",
        default: "1800",
        description: "Milliseconds each phrase stays before the next one. The default is 3200 for typing and 2000 for shuffle.",
      },
    ],
  },
  {
    name: "AGUILoadingSubagent",
    summary:
      "The name of the subagent behind the latest event, followed by a separator, like \"researcher ·\". It shows nothing while the main agent works. Needs the subagent prop on the root.",
    snippet: `
<AGUILoading subagent={state.subagentName} /* ... */>
  <AGUILoadingSubagent className="font-medium" />
  <AGUILoadingText />
</AGUILoading>
`,
    props: [
      {
        name: "separator",
        type: "ReactNode",
        default: '"·"',
        description: "Shown after the name. Pass null for none.",
      },
    ],
  },
  {
    name: "AGUILoadingEvent",
    summary:
      "The raw name of the latest event, e.g. TOOL_CALL_START. Handy while you build, so you can see which key to put in byEvent. Screen readers skip it.",
    props: [],
  },
];
