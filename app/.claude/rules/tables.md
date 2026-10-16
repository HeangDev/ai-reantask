# Tables (TanStack Table)

## 1. Shared `DataTable`

`shared/components/DataTable` wraps `useReactTable` and handles: header rendering, sort indicators, loading skeleton rows, empty/error states, pagination bar, row selection, column visibility menu, sticky header, responsive behavior. Features pass only **columns + data + state handlers**.

## 2. Server-side by default

All submission/user/assignment tables use **manual** (server) pagination, sorting and filtering:

```ts
useReactTable({
  data, columns,
  manualPagination: true, manualSorting: true, manualFiltering: true,
  rowCount: total,
  state: { pagination, sorting },
  onPaginationChange, onSortingChange,
  getCoreRowModel: getCoreRowModel(),
  getRowId: (row) => row.id,
});
```
- State ↔ **URL search params** ↔ query key. (See [state-management.md](./state-management.md).)
- Client-side models only for small static lists (< 100 rows).
- Virtualize with `@tanstack/react-virtual` above ~200 rendered rows.

## 3. Columns

- Define in a `columns.tsx` next to the feature, typed with `ColumnDef<Row>[]` via `createColumnHelper<Row>()`.
- **Memoize** columns (`useMemo`) with `t` as dependency, or define outside the component.
- Header labels use i18n keys.
- Cell renderers use shared components (`StatusBadge`, `ScoreCell`, `DateCell`, `AvatarName`).
- Mark which columns are `enableSorting` / hideable; set `meta: { align, width, mobileHidden }`.

### Submissions table columns (teacher)
Select · Student / Team (with `ModeBadge`) · Assignment · Submitted at · Status · GitHub (repo/commit link) · AI score · Final score · Confidence · Actions

Students have **no** data tables (cards/lists only).

## 4. Behavior rules

- Default sort: `submittedAt desc`. Sort cycle: desc → asc → none.
- Page sizes: 10 / 25 / 50; default 25.
- Row click navigates to detail; interactive cells stop propagation. Row must also have a real link/button for keyboard users.
- Bulk actions (e.g. "Re-run AI", "Return grades") appear when ≥1 selected; show count; confirm; handle partial failure with a result summary.
- Filters: status (multi), class, date range, "needs attention" (low AI confidence / failed). Debounce text search 300 ms.
- Keep previous data while fetching a new page (`keepPreviousData`).

## 5. States

Loading → skeleton rows (same count as pageSize). Empty → `EmptyState` (differentiate "no data" vs "no results for filters" with "Clear filters"). Error → inline `ErrorState` with retry.

## 6. Accessibility

- Semantic `<table>`, `<thead>`, `<th scope="col">`; sortable headers are `<button>` with `aria-sort`.
- Caption or `aria-label` per table.
- Selection checkboxes labelled ("Select row for {student}").
- Announce result count changes via `aria-live="polite"`.

## 7. Mobile

Below `md`: render as **card list** (same columns config using `meta.mobileHidden` / primary + secondary fields) or horizontal scroll container with sticky first column.

## 8. Testing

See [testing.md](./testing.md) §6 (Tables).