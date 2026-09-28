import { createContext, use, type ComponentProps, type ReactNode } from "react";

import { AnimatePresence, motion } from "motion/react";

import { SLIDE_DURATION_MS, type AGUILoadingStackedStep } from "../../..";
import { cn } from "../cn";

import { useAGUILoadingStackedContext } from "./agui-loading-stacked";

const ROW_TRANSITION = { duration: SLIDE_DURATION_MS / 1000, ease: "easeOut" } as const;

const AGUILoadingStackedStepContext = createContext<AGUILoadingStackedStep | null>(
  null,
);

// The row's step. Throws if a row part is used outside Steps.
export function useAGUILoadingStackedStep(part: string) {
  const step = use(AGUILoadingStackedStepContext);
  if (!step) throw new Error(`${part} must be inside AGUILoadingStackedSteps`);
  return step;
}

export type AGUILoadingStackedStepsProps = Omit<ComponentProps<"ol">, "children"> & {
  // The row. It repeats one time for each step.
  children: ReactNode;
  // Classes for each row. Style rows with data-status and data-kind.
  rowClassName?: string;
  // Slide new rows in and fade old rows out. Default true.
  animate?: boolean;
};

// -----
// The list of rows, one for each step. Each row gets
// data-status (active, done, failed) and data-kind
// (run, tool, message, reasoning, error).
// Shows nothing after the rows fold into the summary.
// -----
export function AGUILoadingStackedSteps({
  children,
  rowClassName,
  animate = true,
  className,
  ...props
}: AGUILoadingStackedStepsProps) {
  const { state, view, maxVisible } = useAGUILoadingStackedContext(
    "AGUILoadingStackedSteps",
  );

  if (view === "summary") return null;

  const visibleIds =
    maxVisible != null && maxVisible > 0 ? state.stepOrder.slice(-maxVisible) : state.stepOrder;

  const rows = visibleIds.map((id) => {
    const step = state.steps[id]!;
    const rowProps = {
      "data-status": step.status,
      "data-kind": step.kind,
      className: cn("flex items-center gap-2", rowClassName),
    };
    const row = (
      <AGUILoadingStackedStepContext value={step}>{children}</AGUILoadingStackedStepContext>
    );

    return animate ? (
      <motion.li
        key={id}
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={ROW_TRANSITION}
        {...rowProps}
      >
        {row}
      </motion.li>
    ) : (
      <li key={id} {...rowProps}>
        {row}
      </li>
    );
  });

  return (
    <ol className={cn("flex flex-col gap-1.5", className)} {...props}>
      {animate ? <AnimatePresence initial={false}>{rows}</AnimatePresence> : rows}
    </ol>
  );
}
