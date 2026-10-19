# API Integration

## 1. HTTP client (`shared/api/http.ts`)

- Thin wrapper over `fetch` (or axios). Base URL from `env`.
- Responsibilities: JSON handling, auth header, timeout (30 s) + `AbortSignal` from TanStack, error normalization, 401 handling (single refresh attempt, then logout).
- Returns `unknown`; **parsing is done by the caller with Zod**.

### Normalized error
```ts
type ApiError = {
  status: number;
  code: string;                 // 'VALIDATION_ERROR' | 'FORBIDDEN' | 'NOT_FOUND' | 'NETWORK' | ...
  messageKey: string;           // i18n key
  fieldErrors?: Record<string, string>;
  requestId?: string;
};
```

## 2. API modules

One file per resource: `features/submissions/api/submissions.api.ts`

```ts
export const submissionsApi = {
  list: async (params: ListParams, signal?: AbortSignal) =>
    paginated(submissionSchema).parse(await http.get('/submissions', { params, signal })),
  get: async (id: string, signal?: AbortSignal) =>
    submissionSchema.parse(await http.get(`/submissions/${id}`, { signal })),
  submit: (id: string) => http.post(`/submissions/${id}/submit`),
};
```
- Convert snake_case ↔ camelCase and date strings in the Zod schema (`.transform`) or one mapper, not in components.

## 3. Query keys (`*.keys.ts`)

```ts
export const submissionKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionKeys.all, 'list'] as const,
  list: (p: ListParams) => [...submissionKeys.lists(), p] as const,
  detail: (id: string) => [...submissionKeys.all, 'detail', id] as const,
};
```
No inline string keys in components.

## 4. Query hooks

```ts
export const useSubmission = (id: string) =>
  useQuery({
    queryKey: submissionKeys.detail(id),
    queryFn: ({ signal }) => submissionsApi.get(id, signal),
    refetchInterval: (q) => isProcessing(q.state.data?.status) ? 3000 : false,
  });
```
- Hooks are named `useX`, return the raw query object (don't hide `isPending/error`).
- Lists: `placeholderData: keepPreviousData` for pagination.
- Use `enabled` for dependent queries.
- Polling: 3 s, backing off to 10 s after 1 minute; stop on terminal status or when tab hidden (`refetchIntervalInBackground: false`).

## 5. Mutations

```ts
export const useSubmitSubmission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submissionsApi.submit,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: submissionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: submissionKeys.lists() });
    },
  });
};
```
- Invalidate narrowly; prefer `setQueryData` for single-entity updates.
- **Optimistic updates** only for low-risk actions (accept/reject comment, mark notification read) with rollback in `onError`. Never for submit/grade/return.
- Components handle UX (toast/navigate) via `mutate(vars, { onSuccess })`; the hook handles cache.

## 6. Project upload & GitHub push

Details: [github-integration.md](./github-integration.md).

```
POST /submissions/:id/uploads        → { uploadId, uploadUrl, maxBytes }
PUT  uploadUrl (zip, progress)        → 204
POST /submissions/:id/finalize        → { status: 'pushing_to_github' }   (Idempotency-Key)
POST /submissions/:id/retry-push      → { status: 'pushing_to_github' }
GET  /submissions/:id                 → status, github: { repoUrl, branch, commitSha }, failureCode?
```
- Upload with `XMLHttpRequest` (or fetch + streams) to report progress; cancel with `AbortController`.
- Poll `GET /submissions/:id` while status ∈ {`pushing_to_github`, `queued`, `ai_reviewing`}.
- `useProjectUpload()` exposes `{ stage, progress, error, start, cancel, retryPush }`.

## 6.1 Class & team endpoints

```
GET  /student/dashboard
GET  /student/classes
POST /classes/join                    { classCode }        → class
GET  /student/classes/:classId        → class + assignments (published)
GET  /student/classes/:classId/assignments/:assignmentId
POST /assignments/:id/teams           { name }             → team (leader)
POST /assignments/:id/teams/join      { teamCode }
POST /teams/:id/leave | /teams/:id/members/:userId (DELETE) | /teams/:id/regenerate-code
```
Query keys: `classKeys`, `assignmentKeys`, `teamKeys`, `dashboardKeys`. After `join` invalidate `classKeys.lists()` and `dashboardKeys.all`.

## 7. Error handling

| Error         | Behavior                                                                        |
|---------------|---------------------------------------------------------------------------------|
| 401           | Refresh once → logout + redirect with `returnTo`                                |
| 403           | Forbidden page / disabled UI                                                    |
| 404           | Not found state                                                                 |
| 409           | Show conflict dialog (e.g. submission already pushed, already joined) → refetch |
| 413           | `FILE_TOO_LARGE` message                                                        |
| 422           | Map to form fields                                                              |
| 429           | Toast + respect `Retry-After`                                                   |
| 5xx / network | `ErrorState` with Retry; toast for mutations                                    |

Global `QueryCache`/`MutationCache` `onError` handles generic toasts; opt out with `meta: { silent: true }`.

## 8. Mocking

MSW handlers mirror API contract in `src/test/handlers`. Enable in dev with `VITE_USE_MOCKS=true`.

## 9. Contract

- Source of truth: OpenAPI spec from backend (ASSUMPTION). Generate types or Zod from it where possible; otherwise hand-written Zod with tests against fixtures.
- Schema failure = `ApiError { code: 'INVALID_RESPONSE' }` + report to monitoring.