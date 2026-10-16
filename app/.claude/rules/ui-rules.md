# UI Rules

## 1. Design principles

1. **Clarity over decoration** — students are often stressed; teachers are time-constrained.
2. **AI is labelled** — AI-generated content always carries a visible badge and distinct (not alarming) styling.
3. **Status is never color-only** — pair color with icon + text.
4. **Mobile-first** for student flows; **desktop-first** for teacher review.
5. **Consistency** — use shared components; don't invent one-off variants.

## 2. Tailwind conventions

- Use **design tokens** via CSS variables mapped in `tailwind.config` (colors, radius, shadow). No raw hex in components.
- Class order: layout → box → typography → color → effects → state (use `prettier-plugin-tailwindcss`).
- Use `cn()` (clsx + tailwind-merge) for conditional classes.
- Variants via `cva` (class-variance-authority) for components with variants (Button, Badge).
- No `@apply` except in `base` layer for element resets.
- No inline `style` unless value is dynamic (e.g. progress width).
- Avoid arbitrary values (`w-[317px]`); add to the theme if needed twice.
- Long class lists (> ~10 utilities) → extract a component, not a CSS class.

### Breakpoints
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Design mobile first (`base` = mobile).

### Dark mode
`darkMode: 'class'`. Every color token has a dark counterpart. Test both themes for contrast.

## 3. Tokens

| Token                                       | Usage                             |
|---------------------------------------------|-----------------------------------|
| `--color-primary`                           | Primary actions, links            |
| `--color-ai`                                | AI badge, AI panels (e.g. violet) |
| `--color-success / warning / danger / info` | Feedback & status                 |
| `--color-surface / surface-muted / border`  | Layout                            |
| `--color-text / text-muted`                 | Typography                        |
| `--radius-sm/md/lg`                         | 6 / 10 / 16 px                    |
| Spacing                                     | 4 px scale (Tailwind default)     |

Typography: system / Inter. Scale: `text-sm` body in tables, `text-base` body elsewhere, `text-xl–3xl` headings. Line length ≤ 75 chars for reading text (feedback).

## 4. Status colors (single source: `StatusBadge`)

| Status                 | Color                 | Icon           |
|------------------------|-----------------------|----------------|
| draft                  | gray                  | pencil         |
| submitted / queued     | blue                  | clock          |
| ai_reviewing           | violet (animated dot) | sparkles       |
| ai_reviewed            | violet                | sparkles-check |
| ai_failed              | red                   | alert          |
| teacher_reviewing      | amber                 | user-pen       |
| graded                 | teal                  | check          |
| returned               | green                 | check-double   |
| resubmission_requested | orange                | refresh        |

## 5. Core components (`shared/components/`)

Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Badge, StatusBadge, AiBadge, Card, Modal/Dialog, Drawer, Tabs, Tooltip, Toast, Skeleton, Spinner, EmptyState, ErrorState, Pagination, DataTable, FileDropzone, ProgressBar, Avatar, Breadcrumbs, PageHeader.

**Student-specific:** `ClassCard`, `JoinClassDialog`, `ClassCodeInput` (mask `XXXX-XXXX`), `AssignmentCard`, `ModeBadge` (Individual / Group), `TeamChip`, `TeamPanel`, `DeadlineCountdown`, `RequirementChecklist`, `RubricTable`, `ProjectUploader`, `UploadStepper`, `ZipWarnings`, `GithubLink`, `AttemptHistory`, `RecentUpdatesList`.

Rules:
- Prefer headless primitives (Radix UI / React Aria) for Dialog, Select, Tooltip, Tabs for correct a11y.
- Every component: forwards `ref`, accepts `className`, typed props, no hidden global state.
- Buttons: one **primary** per view/section. Destructive = `danger` variant + confirmation dialog.
- Icons: `lucide-react`, 16/20/24 px only; decorative icons `aria-hidden`.

## 6. Layout

- App shell: top bar + collapsible sidebar (desktop) / bottom nav or drawer (mobile).
- Page container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Page header: title, optional description, primary action on right.
- Teacher review screen: **two-pane** (submission | AI review) on `lg+`; tabs on smaller screens.

## 7. Required UI states for every data view

| State                 | Pattern                                               |
|-----------------------|-------------------------------------------------------|
| Loading (first)       | Skeleton matching final layout (no layout shift)      |
| Refetching            | Subtle top progress / `opacity-70`, keep data visible |
| Empty                 | `EmptyState` with explanation + primary action        |
| Error                 | `ErrorState` with message + Retry                     |
| Partial / stale       | Inline banner                                         |
| Forbidden / Not found | Dedicated pages                                       |

## 8. AI-specific UI

- `AiBadge` ("AI") next to every AI-generated score/comment.
- Confidence indicator: low / medium / high with text, not just color.
- Banner for low confidence; link to "How AI reviews work".
- Disclaimer on student view: "This feedback was generated by AI and reviewed by your teacher" (or "pending review").
- While `ai_reviewing`: show progress state with estimated message, not a fake percentage.
- Never present AI score as final in teacher UI; show "AI: 78 → Final: 82" when overridden.

## 9. Feedback & messaging

- **Toast**: transient result of an action (success/error). Max 1 visible per type; auto-dismiss 5 s; errors persist until dismissed.
- **Inline**: field validation.
- **Banner**: page-level persistent info.
- **Dialog**: confirmations / destructive actions only.
- Copy: short, active voice, no jargon, no blame ("We couldn't upload this file" not "You uploaded a bad file").

## 10. Dates, numbers, text

- Use `Intl` via helpers (`formatDate`, `formatScore`), locale-aware, in user's timezone; show absolute date on hover for relative times.
- Scores: 1 decimal max; show `/max`.
- Truncate with `line-clamp` + tooltip/expand; never silently cut content users must read.

## 11. Responsiveness checklist

- No horizontal page scroll at 360 px.
- Tables → scroll container or card list on mobile.
- Touch targets ≥ 44×44 px.
- Modals become full-screen sheets on mobile.

## 12. Do / Don't

| Do                                                            | Don't                                    |
|---------------------------------------------------------------|------------------------------------------|
| Use tokens & shared components                                | Hardcode colors/spacing                  |
| Show skeletons                                                | Show blank screens or full-page spinners |
| Confirm destructive actions                                   | Use `window.confirm`                     |
| Keep animations subtle (see [animations.md](./animations.md)) | Animate layout-critical content on load  |
| Translate all strings                                         | Hardcode user-facing text                |

## 13. Student UI rules

- Student shell: **two nav items** (Dashboard, Classes) — sidebar on desktop, bottom tab bar on mobile. Don't add more without a requirements change.
- **Individual vs Group presentation**
    - Individual: `ModeBadge` "Individual" (person icon), no team UI, wording "your work".
    - Group: `ModeBadge` "Group" (people icon) + `TeamChip` (name · n/max) on cards; team panel on overview; wording "your team's work". Never mix both wordings in one screen.
- Class with no assignments: `EmptyState` with the message from [student-flow.md](./student-flow.md) §4.2 — friendly, no action button.
- Assignment overview: sections in fixed order (brief → objectives → requirements → deliverables → resources → rubric → rules → team → your work); sticky summary + CTA on `lg+`, sticky bottom CTA on mobile.
- Deadline: show absolute date + relative countdown; turn `warning` < 24 h, `danger` when passed.
- Upload: one primary button "Upload project"; stepper shows 4 steps; success shows **GitHub link** (`GithubLink` with GitHub icon, opens in new tab, shows short SHA).
- Rubric is shown as a table; on mobile as stacked cards.
- Join class input: large, monospaced, auto-uppercase, paste-friendly, error text under field.