import type { DocsPart } from "@/modules/docs";

// -----
// Reference for each part of <AGUILoadingStacked />,
// shown under the examples. Keep it in step with the
// prop comments in src/core/agui-loading/adapters/react/agui-loading-stacked/.
// -----

const ROW_KEYS =
  'Keys are the event that started the row (RUN_STARTED, TOOL_CALL_START, TEXT_MESSAGE_START, REASONING_START, SUBAGENT_STARTED, RUN_ERROR) or "default". A value can be a function that gets the row, e.g. (step) => ...';

export const AGUI_LOADING_DOCS_LOADING_STACKED_PARTS: DocsPart[] = [
  {
    name: "AGUILoadingStacked",
    summary:
      "The root. It takes the whole state from aguiLoadingStackedReducer and shares it with the parts inside. It shows nothing before the first event.",
    snippet: `
<AGUILoadingStacked state={state} maxVisible={4} whenDone="collapse">
  {/* parts go here */}
</AGUILoadingStacked>
`,
    props: [
      {
        name: "state",
        type: "AGUILoadingStackedState",
        required: true,
        description: "The state from aguiLoadingStackedReducer. Pass it as is.",
      },
      {
        name: "maxVisible",
        type: "number",
        default: "all rows",
        description:
          "Show only the newest rows. <AGUILoadingStackedEarlier /> counts the ones it hides.",
      },
      {
        name: "whenDone",
        type: '"keep" | "collapse" | "hide"',
        default: '"keep"',
        description:
          'What happens when the run ends. "keep" leaves the rows. "collapse" swaps them for one summary line after lingerMs. "hide" removes everything after lingerMs.',
      },
      {
        name: "lingerMs",
        type: "number",
        default: "1200",
        description:
          'Milliseconds the finished rows stay before they collapse or hide. Only works with "collapse" or "hide".',
      },
    ],
    dataAttributes: [
      {
        name: "data-status",
        values: [
          { value: "running", description: "The agent works." },
          { value: "waiting", description: "The run waits for input, like an approval." },
          { value: "done", description: "The run finished." },
          { value: "failed", description: "The run hit an error." },
          { value: "stopped", description: "Someone cancelled the run." },
        ],
      },
      {
        name: "data-view",
        values: [
          { value: "steps", description: "The rows are on screen." },
          {
            value: "summary",
            description: 'whenDone="collapse" swapped the rows for one summary line.',
          },
        ],
      },
    ],
  },
  {
    name: "AGUILoadingStackedSteps",
    summary:
      "The list of rows. You write the inside of one row as its children, and it repeats for every step. Row parts (icon, text, subagent) only work in here. Each row gets the data attributes below, so style rows through rowClassName.",
    snippet: `
<AGUILoadingStackedSteps rowClassName="data-[status=done]:opacity-60">
  <AGUILoadingStackedStepIcon />
  <AGUILoadingStackedStepText />
</AGUILoadingStackedSteps>
`,
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "The inside of one row. It repeats for each step.",
      },
      {
        name: "rowClassName",
        type: "string",
        description: "Classes for every row. Use the row's data attributes to style each state.",
      },
      {
        name: "animate",
        type: "boolean",
        default: "true",
        description: "New rows slide in and old rows fade out. Set false to turn it off.",
      },
    ],
    dataAttributes: [
      {
        name: "data-status",
        values: [
          { value: "active", description: "This step is working." },
          { value: "waiting", description: "This step waits for an approval." },
          { value: "done", description: "This step finished." },
          {
            value: "failed",
            description: "This step failed, or the run failed or was cancelled while it worked.",
          },
        ],
      },
      {
        name: "data-kind",
        values: [
          { value: "run", description: "The agent connects." },
          { value: "tool", description: "One tool call." },
          { value: "message", description: "The agent writes a message." },
          { value: "reasoning", description: "The agent thinks." },
          { value: "subagent", description: "A subagent takes over some work." },
          { value: "error", description: "The run failed. Added so the error always shows." },
        ],
      },
      {
        name: "data-subagent",
        values: [
          {
            value: "a subagent run id",
            description: "Set on rows that belong to a subagent. Missing on the main agent's rows.",
          },
        ],
      },
    ],
  },
  {
    name: "AGUILoadingStackedStepIcon",
    summary:
      "The icon for one row. It changes as the row changes: a spinner while it works, a check when done, a \"!\" circle when it fails, a pause circle while it waits.",
    snippet: `
<AGUILoadingStackedStepIcon
  busyByEvent={{
    [EventType.TOOL_CALL_START]: <Wrench className="size-3" />,
  }}
  doneFallback={<CircleCheck className="size-3 text-emerald-500" />}
/>
`,
    props: [
      {
        name: "busyByEvent",
        type: "{ [event]: ReactNode }",
        description: `Icon while the row works. ${ROW_KEYS}`,
      },
      {
        name: "doneByEvent",
        type: "{ [event]: ReactNode }",
        description: "Icon when the row is finished. Same keys as busyByEvent.",
      },
      {
        name: "failedByEvent",
        type: "{ [event]: ReactNode }",
        description: "Icon when the row failed. Same keys.",
      },
      {
        name: "waitingByEvent",
        type: "{ [event]: ReactNode }",
        description: "Icon while the row waits for input. Same keys.",
      },
      {
        name: "busyFallback",
        type: "ReactNode",
        default: "spinner",
        description: "Icon for working rows that busyByEvent doesn't list.",
      },
      {
        name: "doneFallback",
        type: "ReactNode",
        default: "check",
        description: "Icon for finished rows that doneByEvent doesn't list.",
      },
      {
        name: "failedFallback",
        type: "ReactNode",
        default: '"!" circle',
        description: "Icon for failed rows that failedByEvent doesn't list.",
      },
      {
        name: "waitingFallback",
        type: "ReactNode",
        default: "pause circle",
        description: "Icon for waiting rows that waitingByEvent doesn't list.",
      },
    ],
  },
  {
    name: "AGUILoadingStackedStepText",
    summary:
      "The text for one row. While the row works, its phrases take turns. When the row ends, it shows one done or failed line, like \"Checked searchChannels\".",
    snippet: `
<AGUILoadingStackedStepText
  busyByEvent={{
    [EventType.TOOL_CALL_START]: (step) => [\`Calling \${step.toolCallName}...\`],
  }}
  doneByEvent={{
    [EventType.TOOL_CALL_START]: (step) => \`Checked \${step.toolCallName}\`,
  }}
/>
`,
    props: [
      {
        name: "busyByEvent",
        type: "{ [event]: string[] }",
        description: `Phrases that take turns while the row works. ${ROW_KEYS}`,
      },
      {
        name: "doneByEvent",
        type: "{ [event]: string }",
        description: "One line when the row is finished. Same keys as busyByEvent.",
      },
      {
        name: "failedByEvent",
        type: "{ [event]: string }",
        description: "One line when the row failed. Same keys.",
      },
      {
        name: "waitingByEvent",
        type: "{ [event]: string[] }",
        description: "Phrases that take turns while the row waits for input. Same keys.",
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
        description:
          "Milliseconds each phrase stays before the next one. The default is 3200 for typing and 2000 for shuffle.",
      },
    ],
  },
  {
    name: "AGUILoadingStackedStepSubagent",
    summary:
      "The name of the subagent this row's work belongs to, followed by a separator. It shows nothing on the main agent's rows, or on the row that starts the subagent.",
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
    name: "AGUILoadingStackedEarlier",
    summary:
      'Shows "+2 earlier" when maxVisible hides older rows. It shows nothing when every row fits. Put it above <AGUILoadingStackedSteps />.',
    props: [],
  },
  {
    name: "AGUILoadingStackedSummaryDone",
    summary:
      'The one line that replaces the rows after a finished run collapses. Only shows with whenDone="collapse". Default text: "Finished · 4 steps". Put an icon in its children and it shows before the text.',
    snippet: `
<AGUILoadingStackedSummaryDone text={(steps) => \`Done in \${steps} steps\`}>
  <CircleCheck className="size-3" />
</AGUILoadingStackedSummaryDone>
`,
    props: [
      {
        name: "text",
        type: "string | (steps: number) => string",
        default: '"Finished · N steps"',
        description: "Your own text. A function gets the number of steps.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Shown before the text. Usually an icon.",
      },
    ],
  },
  {
    name: "AGUILoadingStackedSummaryFailed",
    summary:
      'Same as SummaryDone, but for a run that failed or was stopped. Default text: "Stopped · 4 steps". Use both summaries so each ending has its own line.',
    props: [
      {
        name: "text",
        type: "string | (steps: number) => string",
        default: '"Stopped · N steps"',
        description: "Your own text. A function gets the number of steps.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Shown before the text. Usually an icon.",
      },
    ],
  },
];
