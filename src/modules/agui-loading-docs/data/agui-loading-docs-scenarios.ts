import { EventType } from "@/core/agui-loading";

import type { AGUILoadingDocsScenario } from "../types";

// -----
// Event sequences that break naive loaders. Used by
// the example Play buttons — demo data, never part of core.
// -----
export const AGUI_LOADING_DOCS_SCENARIOS: AGUILoadingDocsScenario[] = [
  {
    id: "happy-path",
    title: "Happy path",
    description:
      "One tool call, one answer, a clean finish. The baseline every other scenario deviates from.",
    watchFor:
      "Status goes idle → running → done, and the answer text is intact.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED — status flips to running, everything resets.",
        event: { type: EventType.RUN_STARTED, runId: "run-1" },
      },
      {
        label: "Model calls a tool",
        note: "TOOL_CALL_START — the agent reaches for listCommunications.",
        event: {
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "listCommunications",
        },
      },
      {
        label: "Tool returns",
        note: "TOOL_CALL_RESULT — 3 communications come back.",
        event: {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-1",
          content: "3 communications found across 2 channels",
        },
      },
      {
        label: "Answer starts streaming",
        note: "TEXT_MESSAGE_START — the assistant message begins.",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
        },
      },
      {
        label: "Answer streams in",
        note: "TEXT_MESSAGE_CONTENT — the digest text arrives in one delta.",
        event: {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: "Here's your digest: 3 updates across 2 channels this week.",
        },
      },
      {
        label: "Answer finishes",
        note: "TEXT_MESSAGE_END — this message is done.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-1" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED — the protocol's own completion signal.",
        event: { type: EventType.RUN_FINISHED, runId: "run-1" },
      },
    ],
  },
  {
    id: "two-tool-calls",
    title: "Two tool calls, one run",
    description:
      "The agent calls two tools before answering — plausible any time it needs more than one lookup.",
    watchFor:
      "Both call-1 and call-2 stay visible at the end. A naive implementation would wipe call-1's result the moment call-2 started.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED.",
        event: { type: EventType.RUN_STARTED, runId: "run-2" },
      },
      {
        label: "First tool call starts",
        note: "TOOL_CALL_START — checking channel A.",
        event: {
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "listCommunications",
        },
      },
      {
        label: "First tool call returns",
        note: "TOOL_CALL_RESULT — 2 communications from channel A.",
        event: {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-1",
          content: "channel A: 2 communications",
        },
      },
      {
        label: "Second tool call starts",
        note: "TOOL_CALL_START — searching channel B. A naive reducer would reset the whole list here.",
        event: {
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-2",
          toolCallName: "searchChannels",
        },
      },
      {
        label: "Second tool call returns",
        note: "TOOL_CALL_RESULT — 4 communications from channel B.",
        event: {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-2",
          content: "channel B: 4 communications",
        },
      },
      {
        label: "Answer starts",
        note: "TEXT_MESSAGE_START.",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
        },
      },
      {
        label: "Answer streams",
        note: "TEXT_MESSAGE_CONTENT — summarizing both channels.",
        event: {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: "6 communications total across channels A and B.",
        },
      },
      {
        label: "Answer finishes",
        note: "TEXT_MESSAGE_END.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-1" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED.",
        event: { type: EventType.RUN_FINISHED, runId: "run-2" },
      },
    ],
  },
  {
    id: "two-messages",
    title: "Two messages in one run",
    description:
      "The model sends a short preamble message, then a separate message with the real answer.",
    watchFor:
      "Both msg-1 and msg-2 keep their own text. A naive implementation that locks onto whichever message first streamed a token would silently drop the other.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED.",
        event: { type: EventType.RUN_STARTED, runId: "run-3" },
      },
      {
        label: "Preamble starts",
        note: "TEXT_MESSAGE_START — a short heads-up message.",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
        },
      },
      {
        label: "Preamble streams",
        note: "TEXT_MESSAGE_CONTENT on msg-1.",
        event: {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: "Let me pull that together…",
        },
      },
      {
        label: "Preamble finishes",
        note: "TEXT_MESSAGE_END on msg-1.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-1" },
      },
      {
        label: "Real answer starts",
        note: "TEXT_MESSAGE_START — a second, unrelated messageId.",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-2",
          role: "assistant",
        },
      },
      {
        label: "Real answer streams",
        note: "TEXT_MESSAGE_CONTENT on msg-2.",
        event: {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-2",
          delta: "Here's your digest: 5 updates since Monday.",
        },
      },
      {
        label: "Real answer finishes",
        note: "TEXT_MESSAGE_END on msg-2.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-2" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED.",
        event: { type: EventType.RUN_FINISHED, runId: "run-3" },
      },
    ],
  },
  {
    id: "mid-stream-error",
    title: "Run fails mid-stream",
    description:
      "A tool result already landed, then the upstream model call times out before an answer ever streams.",
    watchFor:
      "Status flips straight to failed with the error message surfaced. A reducer with no RUN_ERROR branch would leave the spinner running forever.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED.",
        event: { type: EventType.RUN_STARTED, runId: "run-4" },
      },
      {
        label: "Tool call starts",
        note: "TOOL_CALL_START.",
        event: {
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "listCommunications",
        },
      },
      {
        label: "Tool call returns",
        note: "TOOL_CALL_RESULT — data already gathered before the failure.",
        event: {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-1",
          content: "2 communications found",
        },
      },
      {
        label: "Upstream call fails",
        note: "RUN_ERROR — the model call itself timed out.",
        event: {
          type: EventType.RUN_ERROR,
          message: "Upstream model request timed out after 30s",
          code: "upstream_timeout",
        },
      },
    ],
  },
  {
    id: "events-after-finish",
    title: "Events after the run is over",
    description:
      "A straggling delta and a stray tool call arrive after RUN_FINISHED — a duplicate delivery, a race, a retried chunk.",
    watchFor:
      "State stays exactly as it was at RUN_FINISHED. Nothing here should be legal — the run is over, so it's dropped rather than reopening the loader.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED.",
        event: { type: EventType.RUN_STARTED, runId: "run-5" },
      },
      {
        label: "Answer starts",
        note: "TEXT_MESSAGE_START.",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
        },
      },
      {
        label: "Answer streams",
        note: "TEXT_MESSAGE_CONTENT.",
        event: {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: "All caught up, nothing new.",
        },
      },
      {
        label: "Answer finishes",
        note: "TEXT_MESSAGE_END.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-1" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED — the run is now over.",
        event: { type: EventType.RUN_FINISHED, runId: "run-5" },
      },
      {
        label: "Illegal: a late delta arrives",
        note: "TEXT_MESSAGE_CONTENT after RUN_FINISHED — should be a no-op.",
        event: {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: " (duplicate chunk)",
        },
      },
      {
        label: "Illegal: a late tool call arrives",
        note: "TOOL_CALL_START after RUN_FINISHED — should also be a no-op.",
        event: {
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-late",
          toolCallName: "listCommunications",
        },
      },
    ],
  },
  {
    id: "subagent",
    title: "A subagent does the work",
    description:
      "A router hands the turn to a researcher subagent. Its tool call and text carry its subagentRunId.",
    watchFor:
      "The researcher's name shows next to its work. The parent never answers: the subagent owns the turn.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED.",
        event: { type: EventType.RUN_STARTED, runId: "run-6" },
      },
      {
        label: "Subagent starts",
        note: "SUBAGENT_STARTED — the router picked the researcher.",
        event: { type: EventType.SUBAGENT_STARTED, subagentRunId: "sub-1", name: "researcher" },
      },
      {
        label: "Subagent calls a tool",
        note: "TOOL_CALL_START tagged with subagentRunId sub-1.",
        event: {
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "searchChannels",
          subagentRunId: "sub-1",
        },
      },
      {
        label: "Tool returns",
        note: "TOOL_CALL_RESULT, tagged.",
        event: {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-1",
          content: "2 channels",
          subagentRunId: "sub-1",
        },
      },
      {
        label: "Subagent writes",
        note: "TEXT_MESSAGE_START, tagged.",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
          subagentRunId: "sub-1",
        },
      },
      {
        label: "Subagent's answer ends",
        note: "TEXT_MESSAGE_END, tagged.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-1", subagentRunId: "sub-1" },
      },
      {
        label: "Subagent finishes",
        note: "SUBAGENT_FINISHED — no outcome means success.",
        event: { type: EventType.SUBAGENT_FINISHED, subagentRunId: "sub-1" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED.",
        event: { type: EventType.RUN_FINISHED, runId: "run-6" },
      },
    ],
  },
  {
    id: "subagent-tool-mode",
    title: "The model calls a subagent as a tool",
    description:
      "The parent model calls a researcher tool. The subagent runs inside that tool call, and its text comes back as the tool result.",
    watchFor:
      "The tool row becomes the subagent's row in place: one unit of work, one row.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED.",
        event: { type: EventType.RUN_STARTED, runId: "run-7" },
      },
      {
        label: "Model calls the researcher tool",
        note: "TOOL_CALL_START from the parent, named after the agent.",
        event: { type: EventType.TOOL_CALL_START, toolCallId: "call-9", toolCallName: "researcher" },
      },
      {
        label: "Tool arguments done",
        note: "TOOL_CALL_END — the library now runs the tool.",
        event: { type: EventType.TOOL_CALL_END, toolCallId: "call-9" },
      },
      {
        label: "Subagent starts inside the tool",
        note: "SUBAGENT_STARTED with parentToolCallId call-9.",
        event: {
          type: EventType.SUBAGENT_STARTED,
          subagentRunId: "sub-1",
          name: "researcher",
          parentToolCallId: "call-9",
        },
      },
      {
        label: "Subagent writes",
        note: "TEXT_MESSAGE_START, tagged.",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
          subagentRunId: "sub-1",
        },
      },
      {
        label: "Subagent's answer ends",
        note: "TEXT_MESSAGE_END, tagged.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-1", subagentRunId: "sub-1" },
      },
      {
        label: "Subagent finishes",
        note: "SUBAGENT_FINISHED.",
        event: { type: EventType.SUBAGENT_FINISHED, subagentRunId: "sub-1" },
      },
      {
        label: "Tool result",
        note: "TOOL_CALL_RESULT from the parent — the subagent's text.",
        event: { type: EventType.TOOL_CALL_RESULT, toolCallId: "call-9", content: "Squids have…" },
      },
      {
        label: "Parent answers",
        note: "TEXT_MESSAGE_START from the parent, untagged.",
        event: { type: EventType.TEXT_MESSAGE_START, messageId: "msg-2", role: "assistant" },
      },
      {
        label: "Parent's answer ends",
        note: "TEXT_MESSAGE_END.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-2" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED.",
        event: { type: EventType.RUN_FINISHED, runId: "run-7" },
      },
    ],
  },
  {
    id: "subagents-parallel",
    title: "Two subagents in parallel",
    description:
      "The router starts a researcher and an seo subagent at once. Their events arrive mixed together.",
    watchFor:
      "Only the subagentRunId tag says who owns an event. seo finishes first while the researcher keeps going.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED.",
        event: { type: EventType.RUN_STARTED, runId: "run-8" },
      },
      {
        label: "Researcher starts",
        note: "SUBAGENT_STARTED sub-1.",
        event: { type: EventType.SUBAGENT_STARTED, subagentRunId: "sub-1", name: "researcher" },
      },
      {
        label: "seo starts",
        note: "SUBAGENT_STARTED sub-2.",
        event: { type: EventType.SUBAGENT_STARTED, subagentRunId: "sub-2", name: "seo" },
      },
      {
        label: "seo writes",
        note: "TEXT_MESSAGE_START tagged sub-2.",
        event: {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-s",
          role: "assistant",
          subagentRunId: "sub-2",
        },
      },
      {
        label: "Researcher calls a tool",
        note: "TOOL_CALL_START tagged sub-1 — the events mix.",
        event: {
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "searchChannels",
          subagentRunId: "sub-1",
        },
      },
      {
        label: "seo's text ends",
        note: "TEXT_MESSAGE_END tagged sub-2.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-s", subagentRunId: "sub-2" },
      },
      {
        label: "seo finishes",
        note: "SUBAGENT_FINISHED sub-2 — the researcher is still working.",
        event: { type: EventType.SUBAGENT_FINISHED, subagentRunId: "sub-2" },
      },
      {
        label: "Researcher's tool returns",
        note: "TOOL_CALL_RESULT tagged sub-1.",
        event: {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-1",
          content: "2 channels",
          subagentRunId: "sub-1",
        },
      },
      {
        label: "Researcher finishes",
        note: "SUBAGENT_FINISHED sub-1.",
        event: { type: EventType.SUBAGENT_FINISHED, subagentRunId: "sub-1" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED.",
        event: { type: EventType.RUN_FINISHED, runId: "run-8" },
      },
    ],
  },
  {
    id: "subagent-approval",
    title: "A subagent waits for approval",
    description:
      "A cleaner subagent wants to delete a file. The tool needs approval, so the subagent suspends and the run ends with an interrupt.",
    watchFor:
      "The loader waits instead of finishing. Approve or Cancel starts the next run, which picks the same rows back up.",
    steps: [
      {
        label: "Run starts",
        note: "RUN_STARTED.",
        event: { type: EventType.RUN_STARTED, runId: "run-9" },
      },
      {
        label: "Cleaner starts",
        note: "SUBAGENT_STARTED sub-1.",
        event: { type: EventType.SUBAGENT_STARTED, subagentRunId: "sub-1", name: "cleaner" },
      },
      {
        label: "Cleaner asks to delete a file",
        note: "TOOL_CALL_START tagged sub-1. The tool needs approval, so it does not run.",
        event: {
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "deleteFile",
          subagentRunId: "sub-1",
        },
      },
      {
        label: "Cleaner suspends",
        note: "SUBAGENT_FINISHED with outcome suspended.",
        event: {
          type: EventType.SUBAGENT_FINISHED,
          subagentRunId: "sub-1",
          outcome: { type: "suspended", interruptIds: ["int-1"] },
        },
      },
      {
        label: "Run waits",
        note: "RUN_FINISHED with an interrupt outcome. Nothing runs until someone answers.",
        event: {
          type: EventType.RUN_FINISHED,
          runId: "run-9",
          outcome: {
            type: "interrupt",
            interrupts: [
              { id: "int-1", subagentRunId: "sub-1", toolCallId: "call-1", message: "Delete old-notes.md?" },
            ],
          },
        },
      },
    ],
  },
  {
    id: "subagent-approval-approved",
    title: "The approval is granted",
    description: "The next run resumes the interrupt, and the cleaner carries on.",
    watchFor: "The waiting rows turn active again, in place.",
    steps: [
      {
        label: "Next run resumes",
        note: "RUN_STARTED with input.resume: int-1 resolved.",
        event: {
          type: EventType.RUN_STARTED,
          runId: "run-10",
          parentRunId: "run-9",
          input: { resume: [{ interruptId: "int-1", status: "resolved" }] },
        },
      },
      {
        label: "Cleaner is back",
        note: "SUBAGENT_STARTED with the same subagentRunId.",
        event: { type: EventType.SUBAGENT_STARTED, subagentRunId: "sub-1", name: "cleaner" },
      },
      {
        label: "The file is deleted",
        note: "TOOL_CALL_RESULT tagged sub-1.",
        event: {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-1",
          content: "deleted old-notes.md",
          subagentRunId: "sub-1",
        },
      },
      {
        label: "Cleaner finishes",
        note: "SUBAGENT_FINISHED.",
        event: { type: EventType.SUBAGENT_FINISHED, subagentRunId: "sub-1" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED.",
        event: { type: EventType.RUN_FINISHED, runId: "run-10" },
      },
    ],
  },
  {
    id: "subagent-approval-cancelled",
    title: "The approval is cancelled",
    description: "The next run abandons the interrupt. Nothing is deleted.",
    watchFor: "The rows that waited for the cancelled interrupt fail with “Cancelled”.",
    steps: [
      {
        label: "Next run abandons the interrupt",
        note: "RUN_STARTED with input.resume: int-1 cancelled.",
        event: {
          type: EventType.RUN_STARTED,
          runId: "run-10",
          parentRunId: "run-9",
          input: { resume: [{ interruptId: "int-1", status: "cancelled" }] },
        },
      },
      {
        label: "Parent answers",
        note: "TEXT_MESSAGE_START from the parent.",
        event: { type: EventType.TEXT_MESSAGE_START, messageId: "msg-9", role: "assistant" },
      },
      {
        label: "Parent's answer ends",
        note: "TEXT_MESSAGE_END.",
        event: { type: EventType.TEXT_MESSAGE_END, messageId: "msg-9" },
      },
      {
        label: "Run finishes",
        note: "RUN_FINISHED.",
        event: { type: EventType.RUN_FINISHED, runId: "run-10" },
      },
    ],
  },
];
