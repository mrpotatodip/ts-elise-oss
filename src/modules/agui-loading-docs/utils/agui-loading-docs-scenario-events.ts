import type { AGUILoadingStreamEvent } from "@/core/agui-loading";

import { AGUI_LOADING_DOCS_SCENARIOS } from "../data";

export function aguiLoadingDocsScenarioEvents(id: string): AGUILoadingStreamEvent[] {
  const scenario = AGUI_LOADING_DOCS_SCENARIOS.find((s) => s.id === id);
  if (!scenario) throw new Error(`Unknown docs scenario: ${id}`);
  return scenario.steps.map((step) => step.event);
}
