import type { ReactNode } from "react";

import type { DocsDataAttribute, DocsPart, DocsProp } from "../types";

import { DocsCodeBlock } from "./docs-code-block";

// -----
// One part of a component: what it shows, a short
// example, its props and its data attributes.
// -----
export function DocsPartReference({ part }: { part: DocsPart }) {
  return (
    <article id={part.name} className="flex scroll-mt-20 flex-col gap-3 border-t border-border pt-6">
      <h3 className="font-mono text-base font-semibold">{`<${part.name} />`}</h3>
      <p className="max-w-3xl text-foreground/80">{part.summary}</p>
      {part.snippet && <DocsCodeBlock code={part.snippet} />}
      {/* Plain block, not flex: the tables' margins overlap, so two tables are 40px apart, not 80. */}
      <div>
        {part.props.length > 0 ? (
          <DocsPropsTable props={part.props} />
        ) : (
          <p className="my-10 text-sm text-muted-foreground">No props of its own.</p>
        )}
        {part.dataAttributes && <DocsDataAttributesTable attributes={part.dataAttributes} />}
      </div>
    </article>
  );
}

function DocsPropsTable({ props }: { props: DocsProp[] }) {
  return (
    <DocsTable head={["Prop", "Type", "Default", "What it does"]}>
      {props.map((prop) => (
        <tr key={prop.name} className="border-t border-border/60 align-top">
          <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">
            {prop.name}
            {prop.required && <span className="ml-1 text-destructive">*</span>}
          </td>
          <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
            <DocsPropType type={prop.type} />
          </td>
          <td className="py-2 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
            {prop.required ? "required" : (prop.default ?? "–")}
          </td>
          <td className="py-2 text-foreground/80">{prop.description}</td>
        </tr>
      ))}
    </DocsTable>
  );
}

// Each option of a union type goes on its own line.
function DocsPropType({ type }: { type: string }) {
  const options = type.split(" | ");

  if (options.length === 1) return type;

  return (
    <ul className="flex flex-col gap-0.5">
      {options.map((option) => (
        <li key={option}>{option}</li>
      ))}
    </ul>
  );
}

// One row per value, so each value gets its own explanation.
function DocsDataAttributesTable({ attributes }: { attributes: DocsDataAttribute[] }) {
  return (
    <DocsTable head={["Data attribute", "Value", "When"]}>
      {attributes.map((attribute) =>
        attribute.values.map((value, index) => (
          <tr
            key={`${attribute.name}-${value.value}`}
            className={index === 0 ? "border-t border-border/60 align-top" : "align-top"}
          >
            {index === 0 && (
              <td
                rowSpan={attribute.values.length}
                className="py-2 pr-4 font-mono text-xs whitespace-nowrap"
              >
                {attribute.name}
              </td>
            )}
            <td className="py-2 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
              {value.value}
            </td>
            <td className="py-2 text-foreground/80">{value.description}</td>
          </tr>
        )),
      )}
    </DocsTable>
  );
}

// Scrolls sideways on narrow screens instead of squashing the columns.
function DocsTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="my-10 overflow-x-auto">
      <table className="w-full min-w-xl text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            {head.map((label) => (
              <th key={label} className="pb-2 pr-4 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
