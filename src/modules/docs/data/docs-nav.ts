// -----
// The sidebar menu. Add a page here after you add
// its route file in src/routes/_docs/.
// -----
export const DOCS_NAV = [
  {
    title: "Getting started",
    items: [
      { label: "Introduction", to: "/" },
      { label: "Installation", to: "/installation" },
    ],
  },
  {
    title: "Components",
    items: [
      { label: "Loading", to: "/components/loading" },
      { label: "Loading Stacked", to: "/components/loading-stacked" },
    ],
  },
] as const;

export const DOCS_GITHUB_URL = "https://github.com/mrpotatodip/ts-elise-oss";
