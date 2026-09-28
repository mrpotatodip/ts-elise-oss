import type { ComponentProps } from "react";

import { useAGUILoadingStackedContext } from "./agui-loading-stacked";

export type AGUILoadingStackedEarlierProps = Omit<ComponentProps<"span">, "children">;

// -----
// "+2 earlier": how many rows maxVisible hides.
// Shows nothing when all rows fit.
// -----
export function AGUILoadingStackedEarlier(props: AGUILoadingStackedEarlierProps) {
  const { state, view, maxVisible } = useAGUILoadingStackedContext(
    "AGUILoadingStackedEarlier",
  );
  const hiddenCount =
    maxVisible != null && maxVisible > 0 ? Math.max(0, state.stepOrder.length - maxVisible) : 0;

  if (view === "summary" || hiddenCount === 0) return null;

  return <span {...props}>+{hiddenCount} earlier</span>;
}
