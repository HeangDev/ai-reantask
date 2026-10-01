import { CheckIcon, CloseIcon } from '@/components/ui/icons'
import TaskProgressBar from '@/features/assignments/components/TaskProgressBar'
import { taskProgress } from '@/features/assignments/lib/tasks'
import type { AssignmentTask, TaskResult } from '@/features/assignments/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const results: Record<TaskResult | 'unchecked', { labelKey: TranslationKey; tone: string }> = {
  correct: { labelKey: 'task.correct', tone: 'text-emerald-700 dark:text-emerald-300' },
  incorrect: { labelKey: 'task.incorrect', tone: 'text-red-700 dark:text-red-300' },
  unchecked: { labelKey: 'task.unchecked', tone: 'text-muted' },
}

function ResultIcon({ result }: { result?: TaskResult }) {
  const base = 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full [&>svg]:h-3 [&>svg]:w-3'
  if (result === 'correct') {
    return <span className={`${base} bg-emerald-500 text-white`} aria-hidden="true"><CheckIcon /></span>
  }
  if (result === 'incorrect') {
    return <span className={`${base} bg-red-500 text-white`} aria-hidden="true"><CloseIcon /></span>
  }
  return <span className={`${base} border-2 border-line`} aria-hidden="true" />
}

/** The assignment's tasks with the teacher's verdict on each, and the overall percentage correct. */
export default function TaskChecklist({ tasks }: { tasks: AssignmentTask[] }) {
  const { t } = useI18n()
  const progress = taskProgress(tasks)
  const checked = progress.correct + progress.incorrect > 0

  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">
          {t('task.title')} <span className="font-normal text-muted">· {tasks.length}</span>
        </h2>
        {checked ? (
          <p className="text-sm">
            <span className="text-lg font-bold">{progress.percent}%</span>{' '}
            <span className="text-muted">{t('task.summary', { correct: String(progress.correct), total: String(progress.total) })}</span>
          </p>
        ) : (
          <p className="text-xs text-muted">{t('task.notChecked')}</p>
        )}
      </div>

      <div className="mt-3">
        <TaskProgressBar
          progress={progress}
          label={t('task.summary', { correct: String(progress.correct), total: String(progress.total) })}
        />
      </div>

      <ul className="mt-4 divide-y divide-line">
        {tasks.map((task) => {
          const status = results[task.result ?? 'unchecked']
          return (
            <li key={task.id} className="flex items-center gap-3 py-2 text-sm">
              <ResultIcon result={task.result} />
              <span className="min-w-0 flex-1">{task.title}</span>
              <span className={`shrink-0 text-xs font-medium ${status.tone}`}>{t(status.labelKey)}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
