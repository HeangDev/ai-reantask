import { useState } from 'react'
import { sampleTasks } from '@/features/tasks/data/sampleTasks'
import TaskItem from '@/features/tasks/components/TaskItem'
import type { Task } from '@/features/tasks/types'
import { useI18n } from '@/lib/i18n'

export default function TasksPage() {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)

  const toggle = (id: string) =>
    setTasks((list) => list.map((task) => (task.id === id ? { ...task, done: !task.done } : task)))

  return (
    <section className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t('nav.tasks')}</h1>
      <p className="mb-4 mt-1 text-sm text-muted">{t('tasks.pageDesc')}</p>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={toggle} />
        ))}
      </ul>
    </section>
  )
}
