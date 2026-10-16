# Business Rules

> Rules marked **(ASSUMPTION)** must be confirmed with product/backend. Frontend enforces rules for UX; **backend is authoritative**.

## 1. Roles & permissions

| Capability                                             |       Student          |    Teacher      | Admin    |
|--------------------------------------------------------|:----------------------:|:---------------:|:--------:|
| See Dashboard + own joined Classes                     |           ✅            |        —        |    —     |
| Join a class with `class_code`                         |           ✅            |        —        |    —     |
| Create class, generate / rotate / disable `class_code` |           —            |     ✅ (own)     |    ✅     |
| View assignments of joined class                       |   ✅ (published only)   | ✅ (own classes) |    ✅     |
| Create / edit / publish assignment                     |           —            | ✅ (own classes) |    ✅     |
| Create / join / leave team (group assignment)          |           ✅            |    override     | override |
| Upload project (→ GitHub)                              | ✅ (self / team leader) |        —        |    —     |
| See AI review                                          |       ✅ (see §6)       |        ✅        |    ✅     |
| Edit AI review / override score                        |           —            |        ✅        |    ✅     |
| Finalize & return grade                                |           —            |        ✅        |    ✅     |
| Re-run AI review                                       |           —            |        ✅        |    ✅     |
| Manage users / rubrics                                 |           —            |  rubrics (own)  |    ✅     |
| Configure AI / GitHub settings                         |           —            |        —        |    ✅     |

Implementation: `domain/permissions.ts` exports `can(user, action, resource)`. UI uses it for show/hide/disable; routes use guards.

## 2. Student scope (R-ST)

- **R-ST1** After login a student reaches **only** `Dashboard` and `Classes` (and routes nested under Classes). No other student top-level pages exist.
- **R-ST2** A student sees class content (assignments, members count, resources) **only after joining** the class.
- **R-ST3** Student sees only **published** assignments of joined classes.
- **R-ST4** Student sees only their own (or own-team) submissions, repos and feedback.
- **R-ST5** Direct URL to a non-joined class → "You're not in this class" + Join action (never confirm the class exists).

## 3. Class & class_code (R-CL)

- **R-CL1** Each class has a unique `classCode`: 8 chars, uppercase letters + digits, ambiguous chars excluded (`0 O 1 I`), displayed `XXXX-XXXX`. Input is case-insensitive and ignores spaces/hyphens.
- **R-CL2** Teacher can **rotate** (invalidates old code) or **disable** the code at any time; optional expiry date and max seats (ASSUMPTION).
- **R-CL3** Joining is idempotent per student: already joined → `ALREADY_JOINED`, no duplicate membership.
- **R-CL4** Failed attempts are rate limited (backend; frontend shows countdown on 429).
- **R-CL5** Invalid / disabled / expired codes return the same generic error to avoid code probing.
- **R-CL6** Teacher can remove a student; removal hides the class and its assignments from the student but **keeps** their submissions for the teacher.
- **R-CL7** A class with **no published assignments** shows an empty-state message to students (not an error).

## 4. Assignment rules (R-A)

Assignment consists of: title, brief, objectives, requirements (required/optional), deliverables, resources, rubric, mode, deadline, rules.

- **R-A1** Title 3–120 chars; brief required; deadline required.
- **R-A2** Deadline must be in the future when publishing.
- **R-A3** `maxAttempts` ∈ [1, 5], default 1 (ASSUMPTION).
- **R-A4** Late policy: `allow_late` | `block_late` | `penalty` (percent per day). Late submissions labelled **Late**.
- **R-A5** Once any submission exists, rubric and `mode` cannot change.
- **R-A6** `status`: `draft` (teacher only) → `published` → `archived` (read-only, hidden from active lists).
- **R-A7** `mode`: `individual` | `group` (chosen per assignment).
- **R-A8** Deliverables define `requiredFiles` and optional stack constraints, used by the upload checker (R-GH2/GH3).

### Group rules (R-T)
- **R-T1** Group config: `minSize` ≥ 2, `maxSize` ≤ 8, `formation: student_formed | teacher_assigned`, `lockAt`.
- **R-T2** A student belongs to **one team per assignment**.
- **R-T3** Team creator = leader; leader may remove members / regenerate team code; any member may leave before `lockAt`.
- **R-T4** Joining uses a 6-char team code; blocked if team full, locked, or student already in another team.
- **R-T5** Submitting requires team size ∈ [`minSize`, `maxSize`] and is done by the **leader** (ASSUMPTION).
- **R-T6** Group grade applies to all members; teacher may add **per-member adjustment** (needs reason); a member sees only their own adjustment.
- **R-T7** After `lockAt` only teachers can change teams.

## 5. Submission lifecycle (R-S)

```
draft ─► uploading ─► pushing_to_github ─► pushed ─► queued ─► ai_reviewing ─► ai_reviewed ─► teacher_reviewing ─► graded ─► returned
              │               │                                     │                                                         │
              └──► (cancel)   └──► push_failed ──(retry)──┘         └──► ai_failed ──(re-run)                resubmission_requested ─► draft (new attempt)
```

| Status                   | Meaning                          | Student can                           | Teacher can            |
|--------------------------|----------------------------------|---------------------------------------|------------------------|
| `draft`                  | No upload finalized              | upload                                | —                      |
| `uploading`              | Zip transferring                 | cancel                                | —                      |
| `pushing_to_github`      | Backend pushing to GitHub        | view                                  | —                      |
| `push_failed`            | Upload/push failed (reason code) | retry / re-upload                     | view                   |
| `pushed`                 | Stored on GitHub                 | view repo link                        | view                   |
| `queued`                 | Waiting for AI                   | view                                  | view                   |
| `ai_reviewing`           | AI running                       | view                                  | view                   |
| `ai_reviewed`            | AI done                          | view (per §6)                         | open review, re-run AI |
| `ai_failed`              | AI error                         | view                                  | re-run AI              |
| `teacher_reviewing`      | Teacher editing                  | view                                  | continue               |
| `graded`                 | Final saved, not released        | —                                     | edit or return         |
| `returned`               | Released to student              | view final, resubmit if attempts left | reopen (audited)       |
| `resubmission_requested` | Teacher asked for rework         | start new attempt                     | cancel request         |

Rules:
- **R-S1** Valid transitions live in `submissions/domain/statusMachine.ts`. UI buttons derive from `getAllowedActions(status, role)`; no `if (status === …)` chains in components.
- **R-S2** A submission = **one project archive** (+ optional note). Text-only submissions are not supported (ASSUMPTION).
- **R-S3** After `pushed`, content is immutable. Changes need a new attempt.
- **R-S4** Attempt number cannot exceed `assignment.maxAttempts`.
- **R-S5** Late/closed rules are evaluated at **finalize** time with the server clock.
- **R-S6** Group: one submission per team per attempt.
- **R-S7** Student may only start work when assignment is `published` and the student (or team) is eligible.

## 6. GitHub push rules (R-GH)

Full detail in [github-integration.md](./github-integration.md).

- **R-GH1** One `.zip` ≤ 50 MB, ≤ 2000 files.
- **R-GH2** `node_modules/`, `.git/`, `.env*`, build outputs are forbidden (client warns, backend enforces).
- **R-GH3** Assignment `requiredFiles` must exist (e.g. `README.md`).
- **R-GH4** Detected secrets block the push.
- **R-GH5** Each attempt → own branch (`attempt-N`); history is never overwritten.
- **R-GH6** Only the individual student / team leader may upload.
- **R-GH7** The frontend never touches GitHub credentials.

## 7. AI review rules (R-AI)

- **R-AI1** AI output = `overallScore`, `criterionScores[]`, `comments[]`, `summary`, `confidence`; reviews the pushed commit.
- **R-AI2** AI output is **advisory**; never final without teacher action unless the class has `autoRelease` (ASSUMPTION; off).
- **R-AI3** Every AI comment carries an **AI badge** and confidence (low < 0.5, medium 0.5–0.8, high > 0.8).
- **R-AI4** Low confidence → teacher banner "Manual review recommended."
- **R-AI5** Teacher can re-run AI up to 3 times per submission (ASSUMPTION); history kept.
- **R-AI6** On `ai_failed`, show reason category (timeout / unsupported content / too large / internal).

### Visibility of AI feedback to students (ASSUMPTION)
Default: students see only **teacher-approved** feedback. Class option `showAiFeedbackImmediately`:
- `false` → student sees "Under review" until `returned`.
- `true` → student sees AI feedback labelled "AI-generated, pending teacher review".

## 8. Grading rules (R-G)

- **R-G1** `overallScore = Σ(criterionScore × weight)`, rounded to 1 decimal (`calculateOverall`).
- **R-G2** Criterion score ∈ [0, `maxPoints`], step 0.5.
- **R-G3** Overriding an AI criterion score **requires a reason** (≥ 10 chars), stored in history.
- **R-G4** Manual override of overall score requires a reason; UI shows "calculated" and "final".
- **R-G5** Late penalty applies after override: `final = score × (1 − penalty)`; show breakdown.
- **R-G6** Grade scale mapping (A–F or %) comes from class settings.
- **R-G7** Returning a grade is visible to students; reopening is audited and notifies them.
- **R-G8** Rubric is **visible to students before they start** (transparency).

## 9. Comments (R-C)

- **R-C1** `source: 'ai' | 'teacher'`, teacher-side `status: pending | accepted | edited | rejected`.
- **R-C2** Rejected AI comments are hidden from students but kept in history.
- **R-C3** Edited AI comments appear as `teacher` with "edited from AI" tag in history.

## 10. Updates shown to students (no notifications page)

Students have no notifications page. Events appear as **toast** (when online) and in the **Dashboard › Recent updates** widget.

| Event                              | Shown to                                             |
|------------------------------------|------------------------------------------------------|
| Joined class                       | Student (toast)                                      |
| New assignment published           | Student (Dashboard)                                  |
| Project pushed to GitHub           | Student / team                                       |
| Push failed                        | Student / team leader                                |
| AI review complete                 | Teacher; Student only if `showAiFeedbackImmediately` |
| Grade returned                     | Student / team                                       |
| Resubmission requested             | Student / team                                       |
| Deadline in 24 h and not submitted | Student (Dashboard)                                  |

Teachers/admins may have a notifications list (ASSUMPTION).

## 11. Rule traceability

Each rule ID should appear in a code comment or test name where enforced, e.g. `it('R-CL1: normalizes class code input', …)`.