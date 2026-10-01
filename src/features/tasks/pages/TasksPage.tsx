import { useState } from 'react'
import { sampleTasks } from '@/features/tasks/data/sampleTasks'
import TaskItem from '@/features/tasks/components/TaskItem'
import type { Task } from '@/features/tasks/types'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)

  const toggle = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  return (
    <section className="p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold">Tasks</h1>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} onToggle={toggle} />
        ))}
      </ul>
    </section>
  )
}
