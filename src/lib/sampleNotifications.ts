import type { AppNotification } from '@/components/ui/Toast'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Placeholder activity until notifications come from the API.
export function createSampleNotifications(now = Date.now()): AppNotification[] {
  const items: AppNotification[] = [
    {
      id: 'sample-1',
      variant: 'success',
      audience: 'teacher',
      title: 'Assignment created.',
      subtitle: 'Setting up “Web Basics” with 3 branches.',
      createdAt: now - 5 * MINUTE,
      read: false,
    },
    {
      id: 'sample-2',
      variant: 'info',
      audience: 'teacher',
      title: 'Student updated.',
      subtitle: '“Sok Dara” was saved.',
      createdAt: now - 32 * MINUTE,
      read: false,
    },
    {
      id: 'sample-3',
      variant: 'danger',
      audience: 'teacher',
      title: 'Teacher deleted.',
      subtitle: 'Items removed: 1.',
      createdAt: now - 3 * 60 * MINUTE,
      read: true,
    },
    {
      id: 'sample-4',
      variant: 'success',
      audience: 'teacher',
      title: 'GitHub connected',
      subtitle: 'GitHub is now linked to your workspace.',
      createdAt: now - 26 * 60 * MINUTE,
      read: true,
    },
    {
      id: 'sample-5',
      variant: 'success',
      audience: 'teacher',
      title: 'User added.',
      subtitle: '“Chan Sophea” was added to the list.',
      createdAt: now - 50 * MINUTE,
      read: true,
    },
    {
      id: 'sample-6',
      variant: 'info',
      audience: 'teacher',
      title: 'Assignment updated.',
      subtitle: '“Python Loops” was saved.',
      createdAt: now - 2880 * MINUTE,
      read: true,
    },
    {
      id: 'sample-7',
      variant: 'danger',
      audience: 'teacher',
      title: 'Student deleted.',
      subtitle: 'Items removed: 2.',
      createdAt: now - 4320 * MINUTE,
      read: true,
    },
    {
      id: 'sample-8',
      variant: 'success',
      audience: 'teacher',
      title: 'Teacher added.',
      subtitle: '“Lim Vanna” was added to the list.',
      createdAt: now - 5760 * MINUTE,
      read: true,
    },
    {
      id: 'sample-9',
      variant: 'info',
      audience: 'teacher',
      title: 'User updated.',
      subtitle: '“Sok Dara” was saved.',
      createdAt: now - 7200 * MINUTE,
      read: true,
    },
    {
      id: 'sample-10',
      variant: 'danger',
      audience: 'teacher',
      title: 'GitLab disconnected',
      subtitle: 'GitLab is no longer linked to your workspace.',
      createdAt: now - 8640 * MINUTE,
      read: true,
    },
  ]
  items.push({
    id: 'join-request-sample',
    variant: 'info',
    audience: 'teacher',
    title: 'Join request',
    subtitle: 'Sokha Chan wants to join “Web Development II”.',
    to: '/classes',
    createdAt: now - 25 * MINUTE,
    read: false,
  })

  const studentItems: AppNotification[] = [
    { id: 'student-1', variant: 'success', audience: 'student', title: 'New assignment', subtitle: '“Algebra Problem Set 4” is due on 5 Oct.', createdAt: now - 10 * MINUTE, read: false },
    { id: 'student-2', variant: 'info', audience: 'student', title: 'Assignment graded', subtitle: '“To-do App Project”: 92/100.', createdAt: now - 2 * HOUR, read: false },
    { id: 'student-3', variant: 'info', audience: 'student', title: 'Resubmission requested', subtitle: '“Poetry Analysis”: please expand the second paragraph.', createdAt: now - 26 * HOUR, read: true },
    { id: 'student-4', variant: 'info', audience: 'student', title: 'Feedback received', subtitle: 'Your teacher commented on “Essay: Industrial Revolution”.', createdAt: now - 3 * DAY, read: true },
    { id: 'student-5', variant: 'success', audience: 'student', title: 'Joined a class', subtitle: 'You joined “Web Development”.', createdAt: now - 5 * DAY, read: true },
  ]

  // Newest first, like real notifications.
  return [...items, ...studentItems].sort((a, b) => b.createdAt - a.createdAt)
}
