import type { LoadingStatus } from "@/core/agui-loading";

import type { AGUILoadingDocsPlay } from "../types";

// -----
// The Play buttons both examples share. While a run
// waits, Approve and Cancel answer its interrupt.
// -----
export function aguiLoadingDocsPlays({
  status,
  runScenarioId,
  play,
  playNext,
}: {
  status: LoadingStatus;
  runScenarioId: string;
  play: (scenarioId: string) => void;
  playNext: (scenarioId: string) => void;
}): AGUILoadingDocsPlay[] {
  const plays = [
    { label: "Run", onClick: () => play(runScenarioId) },
    { label: "Error", onClick: () => play("mid-stream-error") },
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
