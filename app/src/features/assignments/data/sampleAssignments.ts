import { smallTodoProjectFiles, todoProjectFiles, todoProjectFixedFiles } from '@/features/assignments/data/sampleProjects'
import type { Assignment, AssignmentTask, Submission, TaskResult } from '@/features/assignments/types'

const submission = (student: string, fileName: string, submittedAt: string, extra: Partial<Submission> = {}): Submission => ({
  student,
  fileName,
  submittedAt,
  ...extra,
})

const task = (id: string, title: string, result?: TaskResult): AssignmentTask => ({ id, title, result })

// Marks for the five To-do App tasks.
const todoTaskIds = ['4a', '4b', '4c', '4d', '4e']
const allTasksCorrect: Record<string, TaskResult> = Object.fromEntries(todoTaskIds.map((id) => [id, 'correct']))
const firstTry: Record<string, TaskResult> = { ...allTasksCorrect, '4d': 'incorrect' }

// Placeholder data until an assignments API is documented in docs/api.md.
export const sampleAssignments: Assignment[] = [
  { id: '1', title: 'Algebra Problem Set 4', className: 'Mathematics 101', description: 'Solve problems 1–12 from chapter 4. Show your working for every step.', deadline: '2026-10-05', status: 'pending', maxScore: 100, allowedFileTypes: ['PDF', 'DOCX'], tasks: [task('1a', 'Problems 1–4'), task('1b', 'Problems 5–8'), task('1c', 'Problems 9–12')], phase: 'in-progress', assignees: ['Sokha Chan', 'Dara Kim', 'Piseth Sok'], maxFileSizeMb: 10 },
  { id: '2', title: 'Essay: Industrial Revolution', className: 'World History', description: 'Write a 1,000-word essay on the social impact of the Industrial Revolution.', deadline: '2026-10-08', status: 'submitted', maxScore: 50, allowedFileTypes: ['DOCX', 'PDF'], submittedFile: 'essay-final.docx', tasks: [task('2a', 'Introduction'), task('2b', 'Main arguments'), task('2c', 'Conclusion')], phase: 'in-review', assignees: ['Dara Kim', 'Rithy Heng', 'Bopha Sen'], maxFileSizeMb: 10, submissions: [submission('Dara Kim', 'essay-final.docx', '2026-10-02')] },
  { id: '3', title: 'Lab Report: Chemical Reactions', className: 'Chemistry', description: 'Report on the three reactions observed in the lab session, including observations and conclusions.', deadline: '2026-09-28', status: 'late', maxScore: 100, allowedFileTypes: ['PDF', 'Images'], members: ['Sokha Chan', 'Vanna Pich'], tasks: [task('3a', 'Observations'), task('3b', 'Analysis'), task('3c', 'Conclusion')], phase: 'in-progress', assignees: ['Sokha Chan', 'Vanna Pich'], maxFileSizeMb: 10 },
  { id: '4', title: 'To-do App Project', className: 'Web Development', description: 'Build a to-do app with React. Submit the source code as a ZIP file.', deadline: '2026-09-25', status: 'graded', maxScore: 100, score: 92, feedback: 'Clean code and good structure. Add more tests next time.', allowedFileTypes: ['ZIP'], submittedFile: 'todo-app.zip', members: ['Sokha Chan', 'Dara Kim', 'Sreyneang Lim', 'Malis Ouk', 'Piseth Sok'], tasks: [task('4a', 'Add a task', 'correct'), task('4b', 'Edit a task', 'correct'), task('4c', 'Delete a task', 'correct'), task('4d', 'Filter tasks', 'incorrect'), task('4e', 'Save to storage', 'correct')], phase: 'completed', assignees: ['Sokha Chan', 'Dara Kim', 'Sreyneang Lim', 'Malis Ouk', 'Piseth Sok'], maxFileSizeMb: 10, submissions: [
    submission('Sokha Chan', 'todo-app.zip', '2026-09-24', { files: todoProjectFiles, taskResults: firstTry, fixedFiles: todoProjectFixedFiles, fixedTaskResults: allTasksCorrect }),
    submission('Dara Kim', 'todo-app.zip', '2026-09-24', { files: smallTodoProjectFiles }),
    submission('Sreyneang Lim', 'todo-app.zip', '2026-09-25', { files: todoProjectFixedFiles, taskResults: allTasksCorrect }),
    // Resubmitted without fixing anything, so the work has to go back again.
    submission('Malis Ouk', 'todo-app.zip', '2026-09-25', { files: todoProjectFiles, taskResults: firstTry, fixedFiles: todoProjectFiles, fixedTaskResults: firstTry }),
  ] },
  { id: '5', title: 'Poetry Analysis', className: 'Literature', description: 'Analyse the imagery in the assigned poem in at least three paragraphs.', deadline: '2026-10-12', status: 'resubmit', maxScore: 30, feedback: 'Please expand the second paragraph with evidence.', allowedFileTypes: ['DOCX', 'PDF'], submittedFile: 'poetry-v1.docx', tasks: [task('5a', 'Imagery in paragraph 1', 'correct'), task('5b', 'Imagery in paragraph 2', 'incorrect'), task('5c', 'Imagery in paragraph 3', 'correct')], phase: 'in-progress', assignees: ['Rithy Heng', 'Chanthy Roeun'], maxFileSizeMb: 10, submissions: [submission('Rithy Heng', 'poetry-v1.docx', '2026-10-03')] },
]

/** Classes that already have assignments; the teacher picks one when setting a new assignment. */
export const assignmentClasses = [...new Set(sampleAssignments.map((a) => a.className))].sort()
