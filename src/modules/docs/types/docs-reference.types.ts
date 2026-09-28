// One row in a props table.
export type DocsProp = {
  name: string;
  type: string;
  // Leave out when the prop is required or has no default.
  default?: string;
  required?: boolean;
  description: string;
};

// One data-* attribute a part puts on its element, for styling.
export type DocsDataAttribute = {
  name: string;
  // Each value it can have, and when it has it.
  values: { value: string; description: string }[];
};

// One part of a component, as the reference section shows it.
export type DocsPart = {
  name: string;
  // One or two sentences: what the part shows on screen.
  summary: string;
  // A short example of the part in use.
  snippet?: string;
  props: DocsProp[];
  dataAttributes?: DocsDataAttribute[];
};
