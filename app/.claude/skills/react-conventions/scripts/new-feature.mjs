#!/usr/bin/env node
/**
 * Scaffold a new feature folder.
 *   node scripts/new-feature.mjs order-history
 *   node scripts/new-feature.mjs payments --with=stores,hooks,utils
 *
 * Creates src/features/<name>/{api,components,locales,types} (+ optional folders)
 * with starter files that follow the react-conventions skill. Never overwrites files.
 */
import fs from "node:fs";
import path from "node:path";

const [, , rawName, ...flags] = process.argv;

if (!rawName || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(rawName)) {
  console.error("Usage: node scripts/new-feature.mjs <kebab-case-name> [--with=stores,hooks,utils]");
  process.exit(1);
}

const name = rawName;
const pascal = name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const camel = pascal[0].toLowerCase() + pascal.slice(1);
const extra = (flags.find((f) => f.startsWith("--with="))?.slice(7).split(",") ?? []).filter(Boolean);

const root = path.resolve("src/features", name);
if (fs.existsSync(root)) {
  console.error(`✖ src/features/${name} already exists`);
  process.exit(1);
}

const files = {
  [`api/${name}-keys.ts`]: `export const ${camel}Keys = {
  all: ["${name}"] as const,
  lists: () => [...${camel}Keys.all, "list"] as const,
  details: () => [...${camel}Keys.all, "detail"] as const,
  detail: (id: string) => [...${camel}Keys.details(), id] as const,
};
`,
  [`api/get-${name}.ts`]: `import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { ${pascal} } from "../types/${name}";
import { ${camel}Keys } from "./${name}-keys";

export function get${pascal}List() {
  return api.get<${pascal}[]>("/${name}");
}

export function get${pascal}ListQueryOptions() {
  return queryOptions({
    queryKey: ${camel}Keys.lists(),
    queryFn: get${pascal}List,
  });
}

export function use${pascal}List() {
  return useQuery(get${pascal}ListQueryOptions());
}
`,
  [`types/${name}.ts`]: `export type ${pascal} = {
  id: string;
};
`,
  [`components/${name}-list.tsx`]: `import { useTranslation } from "react-i18next";

import { use${pascal}List } from "../api/get-${name}";

export function ${pascal}List() {
  const { t } = useTranslation("${name}");
  const query = use${pascal}List();

  if (query.isPending) return <p aria-busy="true">{t("common:loading")}</p>;
  if (query.isError) return <p role="alert">{t("list.error")}</p>;
  if (query.data.length === 0) return <p>{t("list.empty")}</p>;

  return (
    <ul>
      {query.data.map((item) => (
        <li key={item.id}>{item.id}</li>
      ))}
    </ul>
  );
}
`,
  [`components/${name}-list.test.tsx`]: `import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { server } from "@/testing/msw-server";
import { renderWithProviders } from "@/testing/render-with-providers";

import { ${pascal}List } from "./${name}-list";

it("shows the empty state", async () => {
  server.use(http.get("*/${name}", () => HttpResponse.json([])));
  renderWithProviders(<${pascal}List />);
  expect(await screen.findByText("TODO: km empty text")).toBeInTheDocument();
});
`,
  "locales/km.json": JSON.stringify({ title: "TODO", list: { empty: "TODO: km empty text", error: "TODO" } }, null, 2) + "\n",
  "locales/en.json": JSON.stringify({ title: "TODO", list: { empty: "TODO: en empty text", error: "TODO" } }, null, 2) + "\n",
};

if (extra.includes("stores")) {
  files[`stores/${name}-store.ts`] = `import { create } from "zustand";

type ${pascal}State = {
  selectedId: string | null;
  select: (id: string | null) => void;
};

export const use${pascal}Store = create<${pascal}State>()((set) => ({
  selectedId: null,
  select: (selectedId) => set({ selectedId }),
}));
`;
}
for (const dir of ["hooks", "utils"]) {
  if (extra.includes(dir)) files[`${dir}/.gitkeep`] = "";
}

for (const [rel, content] of Object.entries(files)) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { flag: "wx" });
  console.log(`  + src/features/${name}/${rel}`);
}

console.log(`
✔ Feature "${name}" created. Next:
  1. Register the "${name}" namespace (km + en) in src/app/i18n.ts
  2. Add paths in src/config/paths.ts and lazy routes in src/app/router.tsx
  3. Add MSW handlers in src/testing/handlers/${name}.ts
  4. Replace the TODO translations and the ${pascal} type`);