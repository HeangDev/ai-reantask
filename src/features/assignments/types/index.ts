export type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'late' | 'resubmit'

/** Where an assignment stands from the teacher's side. */
export type AssignmentPhase = 'in-progress' | 'in-review' | 'completed'

export type FileType = 'PDF' | 'DOCX' | 'Images' | 'ZIP'

/** The teacher's verdict on one task; a task with no result has not been checked yet. */
export type TaskResult = 'correct' | 'incorrect'

export interface AssignmentTask {
  id: string
  title: string
  result?: TaskResult
}

/** One text file inside a submitted project. */
export interface CodeFile {
  /** Path inside the project, using forward slashes, e.g. src/App.tsx. */
  path: string
  code: string
}

/** One student's handed-in work, as the teacher sees it. */
export interface Submission {
  /** Full name of the student. */
  student: string
  fileName: string
  /** ISO date the work was handed in. */
  submittedAt: string
  /** The project's files, when the submission is source code that can be browsed. */
  files?: CodeFile[]
  /** The student's corrected version, uploaded after the problems were pointed out. */
  fixedFiles?: CodeFile[]
  /** How each task of the assignment was marked for this student, by task id; a missing task is not complete. */
  taskResults?: Record<string, TaskResult>
  /** The same, for the corrected version. */
  fixedTaskResults?: Record<string, TaskResult>
  /** ISO date the teacher verified this work; absent until then. */
  verifiedAt?: string
}

/** A student's branch in the assignment's repository. */
export interface RepoBranch {
  student: string
  branch: string
}

/** creating: being set up. simulated: names are planned but nothing exists on GitHub yet. failed: setup did not finish. */
export type RepoStatus = 'creating' | 'simulated' | 'failed'

export interface AssignmentRepo {
  name: string
  defaultBranch: string
  branches: RepoBranch[]
  status: RepoStatus
}

export interface Assignment {
  id: string
  title: string
  className: string
  description: string
  /** ISO date string */
  deadline: string
  status: AssignmentStatus
  maxScore: number
  score?: number
  feedback?: string
  allowedFileTypes: FileType[]
  submittedFile?: string
  /** Full names of the students working together; absent for an individual assignment. */
  members?: string[]
  /** The teacher's view of the assignment; treated as in progress when absent. */
  phase?: AssignmentPhase
  /** Full names of the students the teacher assigned it to. */
  assignees?: string[]
  /** Largest file a student may upload, in megabytes. */
  maxFileSizeMb?: number
  /** The GitHub repository for this assignment, with a branch per assigned student. */
  repo?: AssignmentRepo
  /** Work handed in by the assigned students. */
  submissions?: Submission[]
  /** What the student has to do, each checked separately by the teacher. */
  tasks?: AssignmentTask[]
}
