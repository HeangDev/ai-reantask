import type { TaskProgress } from '@/features/assignments/lib/tasks'

/** A single progress bar filled to the share of tasks the teacher marked correct. */
export default function TaskProgressBar({ progress, label }: { progress: TaskProgress; label: string }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress.percent}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
        style={{ width: `${progress.percent}%` }}
      />
    </div>
  )
}
