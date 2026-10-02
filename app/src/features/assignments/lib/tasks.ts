import type { AssignmentTask } from '@/features/assignments/types'

export interface TaskProgress {
  total: number
  correct: number
  incorrect: number
  /** Tasks the teacher has not checked yet. */
  unchecked: number
  /** Share of all tasks marked correct, rounded to a whole percent. */
  percent: number
}

export function taskProgress(tasks: AssignmentTask[]): TaskProgress {
  const correct = tasks.filter((t) => t.result === 'correct').length
  const incorrect = tasks.filter((t) => t.result === 'incorrect').length
  return {
    total: tasks.length,
    correct,
    incorrect,
    unchecked: tasks.length - correct - incorrect,
    percent: tasks.length === 0 ? 0 : Math.round((correct / tasks.length) * 100),
  }
}
