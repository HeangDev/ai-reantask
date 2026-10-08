// eslint.config.js — enforces the feature-based architecture.
// npm i -D eslint @eslint/js typescript-eslint globals eslint-plugin-react-hooks \
//   eslint-plugin-react-refresh eslint-plugin-import eslint-import-resolver-typescript \
//   eslint-plugin-check-file eslint-plugin-simple-import-sort
import fs from "node:fs";
import path from "node:path";

import js from "@eslint/js";
import checkFile from "eslint-plugin-check-file";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

// Read features from disk so new features get a boundary automatically.
const featuresDir = path.resolve("src/features");
const features = fs.existsSync(featuresDir)
  ? fs.readdirSync(featuresDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];

const crossFeatureZones = features.map((feature) => ({
  target: `./src/features/${feature}`,
  from: "./src/features",
  except: [`./${feature}`],
  message: "Features must not import from other features. Compose them in src/app/routes or move shared code to a shared folder.",
}));

const SHARED = ["./src/components", "./src/hooks", "./src/lib", "./src/stores", "./src/config", "./src/types", "./src/utils"];

export default tseslint.config(
  { ignores: ["dist", "coverage", "playwright-report", "test-results"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: importPlugin,
      "check-file": checkFile,
      "simple-import-sort": simpleImportSort,
    },
    settings: {
      "import/resolver": { typescript: { project: "./tsconfig.app.json" } },
    },
    rules: {
      // React
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Architecture: shared → features → app
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            ...crossFeatureZones,
            { target: "./src/features", from: "./src/app", message: "Features must not import from src/app." },
            { target: SHARED, from: ["./src/features", "./src/app"], message: "Shared code must not depend on features or app." },
          ],
        },
      ],
      "import/no-default-export": "error",
      "import/no-cycle": ["warn", { maxDepth: 5 }],

      // Imports
      "simple-import-sort/imports": [
        "error",
        { groups: [["^react", "^@?\\w"], ["^@/"], ["^\\."], ["^.+\\.s?css$"]] },
      ],
      "simple-import-sort/exports": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["../../*"], message: "Use the @/ alias instead of deep relative imports." }] },
      ],

      // Naming
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/*.{ts,tsx}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": ["error", { "src/**/": "KEBAB_CASE" }],

      // TypeScript & hygiene
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.object.type='MetaProperty'][object.property.name='env'][property.name=/^VITE_/]",
          message: "Read env vars through src/config/env.ts only.",
        },
      ],
    },
  },
  {
    files: ["src/config/env.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // Tooling files need default exports and live outside src naming rules.
    files: ["*.config.{js,ts,mjs}", "**/*.d.ts", "e2e/**", "playwright.config.ts", "vite.config.ts", "vitest.config.ts"],
    rules: { "import/no-default-export": "off" },
  },
);