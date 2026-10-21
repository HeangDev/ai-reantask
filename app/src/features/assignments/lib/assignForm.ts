import type { AssignFormValues } from '@/features/assignments/lib/assignValidation'
import type { Assignment, AssignmentTask } from '@/features/assignments/types'

/** Turns the form into the fields an assignment stores. Tasks keep the teacher's verdict if their title is unchanged. */
export function fromForm(values: AssignFormValues, previous?: Assignment) {
  const tasks: AssignmentTask[] = values.tasks
    .map((title) => title.trim())
    .filter(Boolean)
    .map((title) => {
      const existing = previous?.tasks?.find((task) => task.title === title)
      return existing ?? { id: crypto.randomUUID(), title }
    })

  return {
    title: values.title.trim(),
    className: values.className,
    description: values.description.trim(),
    deadline: values.deadline,
    phase: values.phase,
    maxScore: Number(values.maxScore),
    maxFileSizeMb: Number(values.maxFileSizeMb),
    allowedFileTypes: values.fileTypes,
    assignees: values.assignees,
    tasks,
  }
}
