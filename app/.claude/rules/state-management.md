# State Management

## 1. Decision table

| Question                                       | Use                                         |
|------------------------------------------------|---------------------------------------------|
| Comes from the backend?                        | **TanStack Query**                          |
| Needed only by one component?                  | `useState` / `useReducer`                   |
| Form input values?                             | **React Hook Form**                         |
| Shareable / bookmarkable (filters, page, tab)? | **URL search params**                       |
| Global UI/session, needed across routes?       | **Zustand**                                 |
| Upload progress / cancel handle?               | Local hook state (`useProjectUpload`)       |
| Derived from the above?                        | Compute (`useMemo` / selector), don't store |

**Never copy server data into Zustand.**

## 2. Zustand

### Stores (keep few and small)
| Store                         | Contents                                                              | Persist                     |
|-------------------------------|-----------------------------------------------------------------------|-----------------------------|
| `authStore`                   | `user`, `status`, `setSession`, `clear` (access token in memory only) | no                          |
| `uiStore`                     | `theme`, `locale`, `sidebarCollapsed`                                 | localStorage (`partialize`) |
| `reviewDraftStore` (optional) | unsaved teacher-review edits per submission id                        | sessionStorage              |

### Rules
- Create with `create<State>()(…)`; middleware: `devtools`, `persist` (only where listed).
- **Always select slices**: `useUiStore(s => s.theme)`; use `useShallow` for multi-value selects. Never `useUiStore()` without a selector.
- Actions live inside the store; components don't `setState` directly.
- Store per concern; no god-store. Feature stores live in `features/<x>/store/`; global ones in `shared/store/`.
- On logout: `authStore.clear()`, reset others, `queryClient.clear()`.
- Don't store functions/promises/class instances in persisted state.

```ts
export const useUiStore = create<UiState>()(
  devtools(persist((set) => ({
    theme: 'system',
    sidebarCollapsed: false,
    setTheme: (theme) => set({ theme }),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  }), { name: 'ui', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }) }))
);
```

## 3. TanStack Query

Defaults (in `QueryClient`):
```ts
{ queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: true },
  mutations: { retry: 0 } }
```
- Don't retry 4xx errors (`retry: (n, e) => !isClientError(e) && n < 2`).
- Details: [api-integration.md](./api-integration.md).

## 4. URL state

- Table state (page, pageSize, sort, filters, search) and active tab live in search params.
- Helper hook `useSearchParamsState(schema)` parses with Zod and provides typed setters.
- Reset `page` to 1 when filters change.

## 5. Local state

- Prefer `useState`; escalate to `useReducer` when ≥ 3 related transitions.
- Lift state only as high as needed; use composition (children/slots) before context.
- React Context only for dependency injection of stable values (theme tokens, current form), not for frequently changing data.

## 6. Anti-patterns

- ❌ `useEffect` to sync server data into state → use `select` or derive.
- ❌ Storing `isLoading` flags manually → use query/mutation status.
- ❌ Global store for modal open state of a single page.
- ❌ Passing server data through Zustand "for convenience".