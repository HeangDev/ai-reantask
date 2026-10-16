# Accessibility (WCAG 2.1 AA)

## Checklist for every PR touching UI

- [ ] Fully operable by keyboard; logical tab order; visible focus (`focus-visible:ring-2`)
- [ ] Semantic HTML first (button, a, nav, main, table, form); ARIA only to fill gaps
- [ ] All images have `alt` (empty for decorative); icons-only buttons have `aria-label`
- [ ] Inputs have labels; errors tied via `aria-describedby`; `aria-invalid` set
- [ ] Color contrast ≥ 4.5:1 text, ≥ 3:1 UI/large text — in light **and** dark
- [ ] Status not conveyed by color alone
- [ ] Dialogs: focus trap, `Esc` closes, focus returns to trigger, `aria-modal`, labelled
- [ ] Dynamic updates announced (`aria-live="polite"` for AI status, toasts `role="status"`, errors `role="alert"`)
- [ ] Respect `prefers-reduced-motion`
- [ ] Touch targets ≥ 44 px
- [ ] Zoom to 200 % without loss of content; no horizontal scroll at 320 px
- [ ] Page has one `<h1>`; heading levels not skipped
- [ ] `lang` attribute set; route change moves focus and updates `document.title`
- [ ] `jest-axe` passes

## Patterns

- **Skip link** to main content at top of layout.
- **AI status**: visually-hidden live region: "AI review completed".
- **Review screen two-pane**: each pane is a labelled `region`; keyboard shortcut list documented and non-conflicting (single-key shortcuts must be disable-able).
- **File dropzone**: also a real "Browse files" button; list is a labelled list with remove buttons.
- **Tables**: see [tables.md](./tables.md) §6.
- **Score inputs**: `inputmode="decimal"`, step, min/max, visible unit.
- **Time limits**: none; autosave does not interrupt.

- **Upload stepper**: `role="progressbar"` with `aria-valuenow`; step changes announced via `aria-live="polite"` ("Pushing to GitHub").
- **Class code input**: label + hint "8 characters, from your teacher"; error via `aria-describedby`; paste supported.
- **Mode/Team badges**: text, not icon-only ("Group", "Team Alpha, 3 of 4 members").
- **Deadline countdown**: not announced every second; update `aria-label` at coarse intervals.

## Tooling

ESLint `jsx-a11y`, `jest-axe`, manual screen-reader pass (NVDA/VoiceOver) on login, submit, review flows before each release.