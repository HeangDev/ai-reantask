# Requirements

## 1. Product overview

Student Assignment Review AI lets students submit work and receive fast AI feedback. Teachers review AI output, adjust scores and comments, and publish the final result. Admins manage classes, users and rubrics.

## 2. Users and roles (ASSUMPTION)

| Role        | Goal                                                      |
|-------------|-----------------------------------------------------------|
| **Student** | Submit assignments, read feedback, resubmit               |
| **Teacher** | Create assignments, review AI results, grade, return work |
| **Admin**   | Manage users, classes, rubrics, AI settings               |

Detailed permissions: see [business-rules.md](./business-rules.md).

## 3. Functional requirements

### 3.1 Authentication
- FR-A1: Login with email + password; session restored on reload.
- FR-A2: Logout clears all client state and query cache.
- FR-A3: Role-based redirect after login (student → `/student`, teacher → `/teacher`, admin → `/admin`).
- FR-A4: Expired session redirects to login and preserves the return URL.

### 3.2 Student (scope: **Dashboard + Classes only**)
Full UX spec: [student-flow.md](./student-flow.md).
- FR-S1: After login the student sees only **Dashboard** and **Classes**.
- FR-S2: **Join a class** with a `class_code` given by the teacher; a class is not visible before joining.
- FR-S3: Class detail lists the **assignments** the teacher published. If none → friendly empty message.
- FR-S4: Each assignment shows its **mode**: **Individual** (shown alone) or **Group** (shown with team chip and team panel).
- FR-S5: Assignment overview shows what it consists of: brief, objectives, requirements, deliverables, resources, rubric, rules, deadline/attempts, team (if group).
- FR-S6: Group assignments: create team, join team by team code, leave, see members.
- FR-S7: When the project is finished, the student **uploads it (ZIP)**; the system **pushes it to GitHub branches ** that the teacher set when creating the assignment and shows progress, repo link and commit.
- FR-S8: Student sees submission status in real time (uploading → pushing → pushed → AI reviewing → …).
- FR-S9: View AI feedback (if allowed) and the teacher's final grade per rubric criterion once returned.
- FR-S10: Resubmit as a new attempt when allowed.
- FR-S11: Dashboard shows: needs attention, upcoming deadlines, recent updates, my classes, latest results.

### 3.3 Teacher
- FR-T1: Create / edit classes; **generate, rotate, disable `class_code`**; remove students.
- FR-T2: Create / edit / publish / archive assignments: brief, objectives, requirements, deliverables (required files), resources, rubric, **mode (individual/group)** + team settings, deadline, max attempts, late policy.
- FR-T3: Submission table with filtering, sorting, pagination, bulk actions; link to GitHub repo/commit.
- FR-T4: Review screen: project (repo link / file view) next to AI review.
- FR-T5: Accept, edit or reject each AI comment; override rubric scores with a mandatory reason.
- FR-T6: Finalize grade and return to students; optionally request resubmission.
- FR-T7: Re-run AI review on demand.
- FR-T8: Manage teams (view, move students, lock/unlock) and per-member grade adjustments.
- FR-T9: Flag suspected AI-generated / plagiarized content (display only, from backend signal).

### 3.4 Admin
- FR-AD1: CRUD users and class enrollments.
- FR-AD2: CRUD rubric templates.
- FR-AD3: View AI usage and review-queue health.

### 3.5 Cross-cutting
- FR-X1: UI available in at least **English** and **one additional locale** (ASSUMPTION: Khmer or Korean — confirm).
- FR-X2: Light and dark theme.
- FR-X3: Status updates via toast; **students** see updates in Dashboard › Recent updates (no separate notifications page); teachers/admins may have a notifications list.

## 4. Non-functional requirements

| Area            | Requirement                                                                                |
|-----------------|--------------------------------------------------------------------------------------------|
| Performance     | LCP < 2.5 s on 4G; route chunks < 200 KB gzipped; tables virtualized above 200 rows        |
| Accessibility   | WCAG 2.1 AA                                                                                |
| Browser support | Last 2 versions of Chrome, Edge, Firefox, Safari; iOS Safari 15+                           |
| Responsiveness  | 360 px → 1920 px; student flows fully usable on mobile                                     |
| Reliability     | No data loss on network failure during draft editing                                       |
| Security        | See [security.md](./security.md)                                                           |
| Upload          | Resumable/cancelable; progress shown; 50 MB on 4G must not freeze UI                       |
| Observability   | Frontend errors reported to monitoring (ASSUMPTION: Sentry)                                |
| Maintainability | TypeScript `strict`, ESLint clean, ≥ 80 % coverage on `features/*/domain` and `shared/lib` |

## 5. Constraints

- **Project upload (ASSUMPTION):** one `.zip` ≤ 50 MB, ≤ 2000 files; `node_modules`, `.git`, `.env*` forbidden; required files (e.g. `README.md`) per assignment.
- **GitHub:** backend pushes via GitHub App into a private org; frontend never handles GitHub tokens. See [github-integration.md](./github-integration.md).
- **class_code:** 8 chars, case-insensitive, rotateable/disable-able by teacher.
- AI review and GitHub push are **asynchronous**; never assume instant.
- Backend is the source of truth for permissions; frontend checks are for UX only.

## 6. Out of scope (v1)

- Real-time collaborative editing
- Editing code in the browser (students upload finished projects)
- Student-owned GitHub repo linking (possible later)
- Video/audio submissions
- Native mobile apps
- Offline mode beyond draft protection

## 7. Open questions

- [ ] Final list of locales?
- [ ] Does AI review stream partial results or arrive once complete?
- [ ] Who submits in a group: leader only (current assumption) or any member?
- [ ] Student-formed teams (assumed) or teacher-assigned by default?
- [ ] Should students get read access to their GitHub repo? (see github-integration.md)
- [ ] Can students see AI feedback before the teacher approves it?
- [ ] Are rubric scales numeric only or also descriptive levels?