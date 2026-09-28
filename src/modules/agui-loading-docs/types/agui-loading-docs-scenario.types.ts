import type { AGUILoadingStreamEvent } from "@/core/agui-loading";

export type AGUILoadingDocsScenarioStep = {
  label: string;
  note: string;
  event: AGUILoadingStreamEvent;
};

export type AGUILoadingDocsScenario = {
  id: string;
  title: string;
  description: string;
  watchFor: string;
  steps: AGUILoadingDocsScenarioStep[];
};
