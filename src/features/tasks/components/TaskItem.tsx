import Checkbox from '@/components/ui/Checkbox'
import type { Task } from '@/features/tasks/types'

interface Props {
  task: Task
  onToggle: (id: string) => void
}

export default function TaskItem({ task, onToggle }: Props) {
  return (
    <li className="rounded-lg border border-line bg-surface shadow-sm transition-colors hover:bg-hover">
      <label className="flex cursor-pointer items-center gap-3 p-3">
        <Checkbox checked={task.done} onChange={() => onToggle(task.id)} />
        <span className={task.done ? 'text-muted line-through' : ''}>{task.title}</span>
      </label>
    </li>
  )
}
