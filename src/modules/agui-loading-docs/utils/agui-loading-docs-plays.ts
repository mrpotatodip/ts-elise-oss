import type { LoadingStatus } from "@/core/agui-loading";

import type { AGUILoadingDocsPlay } from "../types";

// -----
// Play buttons for the agent cards. While a run
// waits, Approve and Cancel answer its interrupt.
// -----
export function aguiLoadingDocsAgentPlays({
  status,
  play,
  playNext,
}: {
  status: LoadingStatus;
  play: (scenarioId: string) => void;
  playNext: (scenarioId: string) => void;
}): AGUILoadingDocsPlay[] {
  const plays = [
    { label: "Subagent", onClick: () => play("subagent") },
    { label: "Tool mode", onClick: () => play("subagent-tool-mode") },
    { label: "Parallel", onClick: () => play("subagents-parallel") },
    { label: "Approval", onClick: () => play("subagent-approval") },
  ];
  if (status !== "waiting") return plays;
  return [
    ...plays,
    { label: "Approve", onClick: () => playNext("subagent-approval-approved") },
    { label: "Cancel", onClick: () => playNext("subagent-approval-cancelled") },
  ];
}
