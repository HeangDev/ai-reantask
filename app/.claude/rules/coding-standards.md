# Coding Standards

## 1. TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride`, `exactOptionalPropertyTypes` (recommended).
- No `any` (use `unknown` + narrowing). `@ts-expect-error` with a reason only.
- Types from Zod (`z.infer`) at boundaries; `type` for unions/props, `interface` for extendable object contracts.
- Use discriminated unions for state/status; exhaustive `switch` with `assertNever`.
- Prefer `as const` objects + union types over TS `enum`.
- No non-null assertion `!` except in tests.

## 2. Naming

| Thing             | Convention                   | Example                                  |
|-------------------|------------------------------|------------------------------------------|
| Components, types | PascalCase                   | `SubmissionCard`, `ReviewState`          |
| Hooks             | `useX`                       | `useSubmission`                          |
| Functions, vars   | camelCase                    | `calculateOverall`                       |
| Constants         | UPPER_SNAKE (true constants) | `MAX_FILE_SIZE`                          |
| Files: components | PascalCase `.tsx`            | `StatusBadge.tsx`                        |
| Files: others     | camelCase / dot-suffix       | `submissions.api.ts`, `useSubmission.ts` |
| Folders           | kebab-case                   | `teacher-review/`                        |
| Booleans          | `is/has/can/should`          | `isLoading`, `canReturn`                 |
| Event props       | `onX`; handlers `handleX`    | `onSubmit`, `handleSubmit`               |

## 3. React

- Function components only; one exported component per file (small private helpers OK).
- Props typed explicitly; destructure in signature; no default exports except lazy pages (named exports preferred; pages may default export).
- Keep components < ~200 lines; extract hooks/subcomponents.
- Hooks: follow rules-of-hooks; include all deps (`react-hooks/exhaustive-deps` is an error).
- Avoid `useEffect` for derived state / data fetching / event responses.
- `useMemo`/`useCallback` only for measured cost or referential stability required by a dependency (e.g. columns, context values). Consider React Compiler if adopted.
- Keys: stable IDs, never array index for dynamic lists.
- No business logic in JSX; move to `domain/`.

## 4. Imports

- Absolute alias `@/` → `src/`. No `../../..` beyond one level.
- Order (enforced): builtin/external → `@/shared` → `@/features` → relative → styles.
- Import features only via their `index.ts`.
- No circular dependencies (`import/no-cycle`).

## 5. Tooling

- ESLint (typescript-eslint strict, react, react-hooks, jsx-a11y, import, jest, tailwindcss, eslint-plugin-i18next `no-literal-string`).
- Prettier (+ tailwind plugin): single quotes, semicolons, 100 cols, trailing commas `all`.
- Husky + lint-staged: lint & format changed files; `tsc --noEmit` and tests in CI.
- Commit messages: Conventional Commits.

## 6. Comments & docs

- Comment **why**, not what. Reference rule IDs: `// R-G3`.
- JSDoc for shared utilities and hooks.
- TODOs include ticket: `// TODO(SAR-123): ...`.

## 7. Performance basics

- Lazy-load routes and heavy libraries.
- Avoid inline object/array creation passed to memoized children when it matters.
- Debounce search inputs; virtualize long lists.
- Images: explicit width/height, `loading="lazy"`.
- Bundle budget checked in CI (`size-limit`).