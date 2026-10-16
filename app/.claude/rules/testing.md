# Testing

## 1. Strategy

| Level                    | Tool                               | What                                                   | Share   |
|--------------------------|------------------------------------|--------------------------------------------------------|---------|
| Unit                     | Jest                               | Pure logic: `domain/`, validators, mappers, utils      | ~40 %   |
| Component / integration  | Jest + React Testing Library + MSW | Components & hooks with real providers, mocked network | ~50 %   |
| E2E (optional, separate) | Playwright                         | Critical flows: login, submit, review, return          | ~10 %   |

Principle: **test behavior the user sees, not implementation.**

## 2. Tooling

- `jest` + `ts-jest` or `@swc/jest`; environment `jsdom`.
- `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.
- `msw` for network mocking (same handlers usable in dev).
- `jest-axe` for automated a11y checks.
- Factories in `src/test/factories/` (e.g. `@faker-js/faker`).

### Scripts
```
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
"test:ci": "jest --ci --coverage --maxWorkers=50%"
```

### Folder layout
```
src/test/
├── setup.ts            # jest-dom, MSW server, cleanup
├── server.ts           # msw setupServer
├── handlers/           # per-feature handlers
├── factories/          # buildSubmission(), buildUser() ...
├── renderWithProviders.tsx
└── mocks/              # motion, i18n, matchMedia, IntersectionObserver
```

## 3. File naming & location

- Colocate: `Component.tsx` → `Component.test.tsx`; `fn.ts` → `fn.test.ts`.
- Test names: `it('R-G3: requires a reason when overriding AI score', ...)` — reference business rule IDs.
- Structure: `describe(subject) → it(behavior)`; Arrange–Act–Assert.

## 4. `renderWithProviders`

Wraps with: fresh `QueryClient` per test (`retry: false`, `gcTime: 0`), `I18nextProvider` (test instance, `en`), `MemoryRouter`/`createMemoryRouter` with `initialEntries`, optional preloaded Zustand state.

```tsx
renderWithProviders(<SubmissionPage />, {
  route: '/student/submissions/123',
  auth: { user: buildUser({ role: 'student' }) },
});
```

## 5. Query rules (RTL)

Priority: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort).
- Use `await screen.findBy…` for async, `waitFor` sparingly.
- Use `userEvent.setup()`; avoid `fireEvent`.
- Assert absence with `queryBy…`.

## 6. What to test per area

### Domain (unit)
- Status machine: every valid and invalid transition per role.
- `calculateOverall`, late penalty, rounding.
- `can(user, action, resource)` matrix.

### Forms
- Required + format errors shown (translated).
- Cross-field rules (`latePolicy` ↔ penalty, weights sum = 100).
- Submit sends correct payload (spy on MSW request body).
- Server field error appears on field.
- Unsaved-changes blocker.

### Zustand stores
- Test through hooks or `store.getState()`; reset in `beforeEach` (`store.setState(initial, true)`).

### TanStack Query hooks
- `renderHook` with wrapper; MSW for responses; test success, error, loading, invalidation after mutation, polling stops at terminal status (use fake timers).

### TanStack Table
- Renders rows, sorts on header click (URL params updated), pagination, empty state, row selection, column visibility.

### i18n
- Components render with keys resolved; test one non-English locale on critical screens.
- CI script checks all locales have identical key sets.

### Routing
- Guards: unauthenticated → login with `returnTo`; wrong role → 403.
- Lazy routes render after Suspense.

### Motion
- Mock `motion` to render plain elements (or set `MotionGlobalConfig.skipAnimations = true`) so tests are deterministic. Test `prefers-reduced-motion` branch separately.

### Accessibility
- `expect(await axe(container)).toHaveNoViolations()` for each page-level component and each shared component.

### Student flow (priority integration tests)
- Student nav shows **only** Dashboard + Classes (R-ST1); teacher routes → 403.
- `R-CL1`: class code input normalizes (`k7m4 qx9p` → `K7M4QX9P`), rejects ambiguous chars.
- Join success → navigates to class; `ALREADY_JOINED`, `CLASS_CODE_INVALID`, `CLASS_FULL`, `429` countdown handled.
- Non-joined class URL → "You're not in this class" + Join action (R-ST5).
- Class with 0 assignments → empty message (R-CL7); with assignments → list grouped by status.
- Individual assignment renders no team UI; group assignment renders `TeamChip` + `TeamPanel`.
- Assignment overview renders all sections; rubric visible before start (R-G8).
- Group: non-leader sees disabled uploader (R-T5/R-GH6); team size outside min/max blocks submit.
- Upload: zip warnings, hard-rule blocks, stepper progress, `pushed` shows GitHub link, `push_failed` → retry without re-upload, double click sends one finalize.
- Dashboard widgets: loading, empty, error, populated; "Recent updates" replaces notifications.

## 7. Mocking rules

- **Mock the network (MSW), not your own modules.**
- Don't mock React Query, RHF, or Zod.
- Mock only: timers, `matchMedia`, `IntersectionObserver`, `ResizeObserver`, file APIs, `motion` (via config).
- Each test overrides handlers with `server.use()`; `resetHandlers` in `afterEach`.

## 8. Coverage targets

| Area                              | Lines   | Branches   |
|-----------------------------------|---------|------------|
| `features/*/domain`, `shared/lib` | ≥ 90 %  | ≥ 85 %     |
| `features/*/api`, `schemas`       | ≥ 80 %  | ≥ 75 %     |
| Components                        | ≥ 70 %  | —          |
| Global                            | ≥ 80 %  | ≥ 70 %     |

Coverage is a guard rail, not a goal; PRs must test new behavior regardless.

## 9. CI

- Run on every PR: `lint`, `typecheck`, `test:ci`, build.
- Fail on coverage drop > 1 % and on any `console.error` during tests (configure in `setup.ts`).
- No `.only` / `.skip` merged (ESLint `jest/no-focused-tests`, `no-disabled-tests`).

## 10. Example

```tsx
it('R-G3: requires a reason when overriding an AI score', async () => {
  const user = userEvent.setup();
  renderWithProviders(<ReviewForm review={buildAiReview({ criteria: [{ id: 'c1', score: 7 }] })} />);

  await user.clear(screen.getByLabelText(/clarity score/i));
  await user.type(screen.getByLabelText(/clarity score/i), '9');
  await user.click(screen.getByRole('button', { name: /save/i }));

  expect(await screen.findByText(/reason is required/i)).toBeInTheDocument();
});
```

## 11. Flaky-test policy

Flaky test → quarantine within 24 h (ticket), fix within a sprint. No retries to hide flakiness in CI.