# ai-reantask

React + TypeScript + Tailwind CSS (Vite), organized by feature.

```
src/
  app/            # app shell: App, router
  components/     # shared UI (ui/, layout/)
  features/       # one folder per domain
    auth/         # components, hooks, services, types, pages
    tasks/
    dashboard/
  hooks/ lib/ types/   # shared across features
```

Scripts: `npm run dev`, `npm run build`, `npm run preview`.
Alias: `@/` -> `src/`.
