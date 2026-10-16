# Contributing

## Branching

- `main` (protected, deployable) ← short-lived feature branches: `feat/SAR-123-review-screen`, `fix/…`, `chore/…`.
- Rebase or squash-merge; linear history.

## Commits

Conventional Commits: `feat(review): allow override reason`, `fix(forms): …`, `test:`, `docs:`, `refactor:`, `chore:`.

## Pull request checklist

- [ ] Linked ticket; description with screenshots/video for UI changes (light + dark, mobile + desktop)
- [ ] Follows [architecture.md](./architecture.md) dependency rules
- [ ] Business rules referenced/tests named with rule IDs
- [ ] All strings translated (`en` + keys present in other locales)
- [ ] Loading / empty / error states implemented
- [ ] Accessibility checklist passed ([accessibility.md](./accessibility.md))
- [ ] Tests added/updated; `lint`, `typecheck`, `test:ci`, `build` pass
- [ ] No `console.log`, commented-out code, or unused deps
- [ ] Docs updated if behavior/rules changed

## Definition of Done

1. Acceptance criteria met and demoed
2. Reviewed by ≥ 1 teammate (2 for shared components / architecture changes)
3. Tests green, coverage not reduced
4. Accessible, responsive, translated
5. No new lint/type warnings
6. Docs/ADR updated
7. Deployed to staging and verified

## Adding a new feature (recipe)

1. Create `features/<name>/` with `api/ components/ domain/ schemas/ pages/ index.ts`
2. Add Zod schemas + MSW handlers + factories
3. Add query keys & hooks
4. Add routes in `app/router`, paths in `paths.ts`
5. Add i18n namespace
6. Write domain tests first for rules, then component tests
7. Update `business-rules.md` if rules are new

## Review etiquette

Be specific, kind, and prefix intent: `nit:`, `question:`, `blocking:`.