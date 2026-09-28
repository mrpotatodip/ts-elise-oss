// -----
// Writes registry.json for the shadcn CLI. It lists
// every file in the component folder (not the tests),
// so the list can never go out of date. Then run
// `shadcn build` to write public/r/*.json.
// -----
import { readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const SOURCE = "src/core/agui-loading";
// Where the folder lands in the user's project. @components/ is their components alias.
const TARGET = "@components/agui-loading";

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const files = listFiles(SOURCE)
  .filter((path) => /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path))
  .sort()
  .map((path) => ({
    path,
    type: "registry:file",
    target: `${TARGET}/${relative(SOURCE, path)}`,
  }));

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "elise",
  homepage: "https://github.com/mrpotatodip/ts-elise-oss",
  items: [
    {
      name: "agui-loading",
      type: "registry:block",
      title: "AG-UI Loading",
      description:
        "Loading indicators driven by AG-UI events: AGUILoading (one line) and AGUILoadingStacked (one row per step).",
      dependencies: ["@ag-ui/core", "motion", "clsx", "tailwind-merge"],
      files,
    },
  ],
};

writeFileSync("registry.json", `${JSON.stringify(registry, null, 2)}\n`);
console.log(`registry.json: ${files.length} files`);
