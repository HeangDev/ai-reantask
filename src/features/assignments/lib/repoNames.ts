import type { AssignmentRepo, RepoBranch } from '@/features/assignments/types'

export const DEFAULT_BRANCH = 'main'

/**
 * Lower-case words joined with hyphens, safe for repository and branch names.
 * Letters and digits in any script are kept (a Khmer or Korean name stays readable); everything else becomes a hyphen.
 */
export const slug = (text: string) =>
  text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

const MAX_REPO_NAME = 80

/** e.g. class "Web Development" and title "To-do App Project" give "web-development-to-do-app-project". */
export const repoNameFor = (className: string, title: string) =>
  slug(`${className} ${title}`).slice(0, MAX_REPO_NAME).replace(/-+$/g, '') || 'assignment'

/**
 * One branch per student, named after the student ("Sokha Chan" gives "sokha-chan").
 * Students who already have a branch keep it, so editing an assignment never renames or loses work.
 * Two students with the same name get -2, -3 and so on.
 */
export function branchesFor(students: string[], existing: RepoBranch[] = []): RepoBranch[] {
  const kept = new Map(existing.map((b) => [b.student, b.branch]))
  const taken = new Set<string>([DEFAULT_BRANCH, ...kept.values()])

  return students.map((student) => {
    const current = kept.get(student)
    if (current) return { student, branch: current }

    const base = slug(student) || 'student'
    let branch = base
    for (let n = 2; taken.has(branch); n += 1) branch = `${base}-${n}`
    taken.add(branch)
    return { student, branch }
  })
}

/** What the repository will look like for these inputs, before anything is created. */
export function planRepository(
  className: string,
  title: string,
  students: string[],
  existing?: AssignmentRepo,
): AssignmentRepo {
  return {
    name: existing?.name ?? repoNameFor(className, title),
    defaultBranch: existing?.defaultBranch ?? DEFAULT_BRANCH,
    branches: branchesFor(students, existing?.branches),
    status: 'creating',
  }
}
