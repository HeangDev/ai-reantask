import { useEffect, useState } from 'react'
import { CheckIcon, CloseIcon, SparklesIcon } from '@/components/ui/icons'
import { analyzeProject, compareRuns, taskIssues } from '@/features/assignments/lib/analyzer'
import type { Problem, Severity, TaskIssue } from '@/features/assignments/lib/analyzer'
import type { AssignmentTask, CodeFile, TaskResult } from '@/features/assignments/types'
import { formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

interface Props {
  /** The project as the student first handed it in. */
  files: CodeFile[]
  /** The student's corrected version, once they have uploaded one. */
  fixedFiles?: CodeFile[]
  /** What the assignment asked for. */
  tasks: AssignmentTask[]
  /** How the tasks were marked for the first version and for the corrected one. */
  taskResults?: Record<string, TaskResult>
  fixedTaskResults?: Record<string, TaskResult>
  /** ISO date if the teacher has already verified this work. */
  verifiedAt?: string
  onVerify: () => void
  onUnverify: () => void
  /** Show a problem in the editor. */
  onJump: (path: string, line: number) => void
  onClose: () => void
}

type Stage = 1 | 2 | 3 | 4 | 5 | 6
type Busy = 'analyze' | 'verify' | null

interface Outcome {
  fixed: number
  remainingProblems: Problem[]
  remainingTasks: TaskIssue[]
}

const STAGES: { stage: Stage; labelKey: TranslationKey }[] = [
  { stage: 1, labelKey: 'ai.step1' },
  { stage: 2, labelKey: 'ai.step2' },
  { stage: 3, labelKey: 'ai.step3' },
  { stage: 4, labelKey: 'ai.step4' },
  { stage: 5, labelKey: 'ai.step5' },
  { stage: 6, labelKey: 'ai.step6' },
]

// How long the "thinking" screens stay up, so the steps are visible rather than a blink.
const WORK_MS = 1600

const severity: Record<Severity, { labelKey: TranslationKey; tone: string }> = {
  error: { labelKey: 'ai.sevError', tone: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
  warning: { labelKey: 'ai.sevWarning', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  info: { labelKey: 'ai.sevInfo', tone: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const primaryButton = `w-full rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`
const quietButton = `rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover ${focusRing}`

function SeverityBadge({ level }: { level: Severity }) {
  const { t } = useI18n()
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severity[level].tone}`}>
      {t(severity[level].labelKey)}
    </span>
  )
}

function Working({ label, file }: { label: string; file?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center" role="status">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-accent-soft text-accent-fg [&>svg]:h-6 [&>svg]:w-6" aria-hidden="true">
        <SparklesIcon />
      </span>
      <p className="text-sm font-medium">{label}</p>
      {file && <p className="max-w-full truncate font-mono text-xs text-muted">{file}</p>}
      <div className="h-1 w-48 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent" style={{ animation: `analyzer-progress ${WORK_MS}ms linear forwards` }} />
      </div>
    </div>
  )
}

/**
 * The teacher's AI helper for a code project.
 *
 * It analyses the project and checks the tasks. If anything is wrong or a task is not complete and correct, the work
 * goes back to the student and is checked again. When everything is correct it shows the result for the teacher to verify.
 */
export default function AiAnalyzerPanel({
  files,
  fixedFiles,
  tasks,
  taskResults,
  fixedTaskResults,
  verifiedAt,
  onVerify,
  onUnverify,
  onJump,
  onClose,
}: Props) {
  const { t, locale } = useI18n()
  const [stage, setStage] = useState<Stage>(1)
  const [furthest, setFurthest] = useState<Stage>(1)
  const [busy, setBusy] = useState<Busy>('analyze')
  const [run, setRun] = useState(0)
  const [problems, setProblems] = useState<Problem[]>([])
  const [taskProblems, setTaskProblems] = useState<TaskIssue[]>([])
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [scanning, setScanning] = useState(0)
  // Each trip to the student and back is a round; after sending work back the panel waits for a new upload.
  const [round, setRound] = useState(1)
  const [waitingForUpload, setWaitingForUpload] = useState(false)
  // Nothing was wrong, so the steps that deal with fixing are not needed.
  const [clean, setClean] = useState(false)

  const go = (next: Stage) => {
    setStage(next)
    setFurthest((current) => (next > current ? next : current))
  }

  // Step 1: analyse the project as handed in, and check its tasks.
  useEffect(() => {
    if (busy !== 'analyze') return
    const ticker = setInterval(() => setScanning((n) => n + 1), 140)
    const done = setTimeout(() => {
      const foundProblems = analyzeProject(files)
      const foundTasks = taskIssues(tasks, taskResults)
      setProblems(foundProblems)
      setTaskProblems(foundTasks)
      setClean(foundProblems.length === 0 && foundTasks.length === 0)
      setBusy(null)
      go(2)
    }, WORK_MS)
    return () => {
      clearInterval(ticker)
      clearTimeout(done)
    }
  }, [busy, run, files, tasks, taskResults])

  // Step 5: check the student's corrected version, code and tasks.
  useEffect(() => {
    if (busy !== 'verify') return
    const done = setTimeout(() => {
      const remainingProblems = compareRuns(problems, analyzeProject(fixedFiles ?? files)).remaining
      const remainingTasks = taskIssues(tasks, fixedTaskResults ?? taskResults)
      const found = problems.length + taskProblems.length
      setOutcome({ fixed: Math.max(found - remainingProblems.length - remainingTasks.length, 0), remainingProblems, remainingTasks })
      setBusy(null)
      go(6)
    }, WORK_MS)
    return () => clearTimeout(done)
  }, [busy, problems, taskProblems, fixedFiles, files, tasks, taskResults, fixedTaskResults])

  const startOver = () => {
    setProblems([])
    setTaskProblems([])
    setOutcome(null)
    setRound(1)
    setWaitingForUpload(false)
    setClean(false)
    setStage(1)
    setFurthest(1)
    setRun((n) => n + 1)
    setBusy('analyze')
  }

  // Nothing wrong to begin with: go straight to the result for the teacher to verify.
  const showCleanResult = () => {
    setOutcome({ fixed: 0, remainingProblems: [], remainingTasks: [] })
    go(6)
  }

  // Still wrong after the student's fixes: back to the student, who uploads again.
  const sendBack = () => {
    setRound((n) => n + 1)
    setWaitingForUpload(true)
    setOutcome(null)
    setFurthest(4)
    setStage(4)
  }

  const problemList = (list: Problem[], detail: (p: Problem) => React.ReactNode) => (
    <ul className="space-y-2">
      {list.map((p) => (
        <li key={p.key + p.line} className="rounded-lg border border-line bg-surface p-3">
          <div className="flex items-start gap-2">
            <SeverityBadge level={p.severity} />
            <p className="min-w-0 flex-1 text-[13px] leading-snug">{t(p.messageKey)}</p>
          </div>
          <button
            type="button"
            onClick={() => onJump(p.path, p.line)}
            title={t('ai.jump')}
            className={`mt-1.5 max-w-full truncate rounded font-mono text-[11px] text-accent-fg hover:underline ${focusRing}`}
          >
            {p.path}:{p.line}
          </button>
          {detail(p)}
        </li>
      ))}
    </ul>
  )

  const taskList = (list: TaskIssue[], withFix: boolean) => (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-muted">
        {t('ai.tasksHeading')} · {t('ai.tasksSummary', { done: String(tasks.length - list.length), total: String(tasks.length) })}
      </h3>
      <ul className="space-y-2">
        {list.map((issue) => (
          <li key={issue.id} className="rounded-lg border border-line bg-surface p-3">
            <div className="flex items-start gap-2">
              <SeverityBadge level={issue.status === 'incorrect' ? 'error' : 'warning'} />
              <p className="min-w-0 flex-1 text-[13px] leading-snug">
                {t(issue.status === 'incorrect' ? 'ai.taskIncorrectMsg' : 'ai.taskMissingMsg', { title: issue.title })}
              </p>
            </div>
            {withFix && (
              <div className="mt-2 border-t border-line pt-2">
                <p className="text-xs font-semibold text-accent-fg">{t('ai.suggestion')}</p>
                <p className="mt-0.5 text-[13px] text-muted">{t('ai.taskFix')}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )

  const counts = (list: Problem[]) =>
    (['error', 'warning', 'info'] as Severity[]).map((level) => ({ level, count: list.filter((p) => p.severity === level).length }))

  const found = problems.length + taskProblems.length

  let body: React.ReactNode
  if (busy === 'analyze') {
    body = <Working label={t('ai.step1')} file={t('ai.scanning', { file: files[scanning % files.length]?.path ?? '' })} />
  } else if (busy === 'verify') {
    body = <Working label={t('ai.verifying')} />
  } else if (stage === 1) {
    body = (
      <div className="space-y-3 p-4">
        <p className="text-sm">{t('ai.filesScanned', { count: String(files.length) })}</p>
        <button type="button" onClick={startOver} className={quietButton}>{t('ai.rerun')}</button>
      </div>
    )
  } else if (stage === 2) {
    body = (
      <div className="space-y-4 p-4">
        {clean ? (
          <>
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">{t('ai.allGood')}</p>
            <button type="button" onClick={showCleanResult} className={primaryButton}>{t('ai.showResult')}</button>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold">{t('ai.found', { count: String(found) })}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {counts(problems).filter((c) => c.count > 0).map((c) => (
                  <span key={c.level} className={`rounded px-2 py-0.5 text-xs font-medium ${severity[c.level].tone}`}>
                    {c.count} {t(severity[c.level].labelKey)}
                  </span>
                ))}
              </div>
            </div>
            {problems.length > 0 && problemList(problems, () => null)}
            {taskProblems.length > 0 && taskList(taskProblems, false)}
            <button type="button" onClick={() => go(3)} className={primaryButton}>{t('ai.toSuggest')}</button>
          </>
        )}
      </div>
    )
  } else if (stage === 3) {
    body = (
      <div className="space-y-4 p-4">
        {problems.length > 0 &&
          problemList(problems, (p) => (
            <div className="mt-2 border-t border-line pt-2">
              <p className="text-xs font-semibold text-accent-fg">{t('ai.suggestion')}</p>
              <p className="mt-0.5 text-[13px] text-muted">{t(p.fixKey)}</p>
              {p.after !== undefined ? (
                <div className="mt-2 overflow-hidden rounded-md border border-line font-mono text-[11px] leading-5">
                  <p className="overflow-x-auto whitespace-pre bg-red-50 px-2 text-red-800 dark:bg-red-500/10 dark:text-red-300">
                    <span aria-label={t('ai.before')}>− </span>
                    {p.before.trim()}
                  </p>
                  <p className="overflow-x-auto whitespace-pre bg-emerald-50 px-2 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span aria-label={t('ai.after')}>+ </span>
                    {p.after.trim() || '—'}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted">{t('ai.noOneLineFix')}</p>
              )}
            </div>
          ))}
        {taskProblems.length > 0 && taskList(taskProblems, true)}
        <button type="button" onClick={() => go(4)} className={primaryButton}>{t('ai.sendToStudent')}</button>
      </div>
    )
  } else if (stage === 4) {
    const canVerify = Boolean(fixedFiles) && !waitingForUpload
    body = (
      <div className="space-y-4 p-4">
        <p className="rounded-lg bg-accent-soft p-3 text-sm text-accent-fg">
          {round === 1 ? t('ai.sentNote') : t('ai.sentBack', { n: String(round) })}
        </p>
        <p className="text-sm text-muted">{t('ai.waiting')}</p>
        {waitingForUpload ? (
          <p className="text-sm text-muted">{t('ai.waitingNew')}</p>
        ) : fixedFiles ? (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 [&>span>svg]:h-4 [&>span>svg]:w-4">
            <span aria-hidden="true"><CheckIcon /></span>
            {t('ai.studentResubmitted')}
          </p>
        ) : (
          <p className="text-sm text-muted">{t('ai.noFixedVersion')}</p>
        )}
        <button type="button" onClick={() => { setBusy('verify'); go(5) }} disabled={!canVerify} className={primaryButton}>
          {t('ai.toVerify')}
        </button>
      </div>
    )
  } else if (stage === 5) {
    body = (
      <div className="space-y-3 p-4">
        <p className="text-sm">{t('ai.verified')}</p>
        <button type="button" onClick={() => { setBusy('verify'); go(5) }} className={quietButton}>{t('ai.rerun')}</button>
      </div>
    )
  } else {
    const remainingProblems = outcome?.remainingProblems ?? []
    const remainingTasks = outcome?.remainingTasks ?? []
    const remaining = remainingProblems.length + remainingTasks.length
    const allCorrect = remaining === 0
    body = (
      <div className="space-y-4 p-4">
        <div
          className={`rounded-xl p-4 text-center ${
            allCorrect
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
          }`}
        >
          <p className="text-base font-bold">
            {allCorrect ? (clean ? t('ai.resultClean') : t('ai.resultResolved')) : t('ai.resultOpen', { count: String(remaining) })}
          </p>
          <p className="mt-1 text-xs">{allCorrect ? (clean ? t('ai.allGood') : t('ai.allFixedNote')) : t('ai.openNote')}</p>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            [t('ai.summaryFound'), found],
            [t('ai.summaryFixed'), outcome?.fixed ?? 0],
            [t('ai.summaryRemaining'), remaining],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-surface p-2">
              <dd className="text-xl font-bold">{value}</dd>
              <dt className="text-[11px] text-muted">{label}</dt>
            </div>
          ))}
        </dl>

        {!allCorrect && (
          <>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted">{t('ai.remainingTitle')}</h3>
              {remainingProblems.length > 0 && problemList(remainingProblems, () => null)}
              {remainingTasks.length > 0 && taskList(remainingTasks, false)}
            </div>
            {/* Not complete and correct: the student gets it back and uploads again. */}
            <button type="button" onClick={sendBack} className={primaryButton}>{t('ai.sendBack')}</button>
          </>
        )}

        {allCorrect && (
          <section className="rounded-xl border border-line bg-surface p-4">
            <h3 className="text-sm font-semibold">{t('ai.teacherVerify')}</h3>
            {verifiedAt ? (
              <>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 [&>span>svg]:h-4 [&>span>svg]:w-4">
                  <span aria-hidden="true"><CheckIcon /></span>
                  {t('ai.verifiedOn', { date: formatDate(verifiedAt, locale) })}
                </p>
                <button type="button" onClick={onUnverify} className={`${quietButton} mt-3`}>{t('ai.undoVerify')}</button>
              </>
            ) : (
              <>
                <p className="mt-1 text-[13px] text-muted">{t('ai.teacherVerifyHint')}</p>
                <button type="button" onClick={onVerify} className={`${primaryButton} mt-3`}>{t('ai.verifyApprove')}</button>
              </>
            )}
          </section>
        )}

        <button type="button" onClick={startOver} className={quietButton}>{t('ai.startOver')}</button>
      </div>
    )
  }

  return (
    <aside aria-label={t('ai.title')} className="flex max-h-[60vh] min-h-0 shrink-0 flex-col border-t border-line bg-sunken md:max-h-none md:w-96 md:border-l md:border-t-0">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold [&>span>svg]:h-4 [&>span>svg]:w-4">
          <span className="text-accent-fg" aria-hidden="true"><SparklesIcon /></span>
          {t('ai.title')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('ai.close')}
          className={`rounded-md p-1 text-muted transition-colors hover:bg-hover hover:text-fg ${focusRing}`}
        >
          <CloseIcon />
        </button>
      </header>

      <nav aria-label={t('ai.stepsLabel')} className="shrink-0 border-b border-line px-4 py-3">
        <ol className="flex gap-1">
          {STAGES.map(({ stage: s }) => {
            // Steps 3 to 5 are about fixing, so they are skipped when nothing needed fixing.
            const skipped = clean && s >= 3 && s <= 5
            const reachable = s <= furthest && busy === null && !skipped
            const done = !skipped && s <= furthest && s !== stage
            return (
              <li key={s} className="flex-1">
                <button
                  type="button"
                  onClick={() => reachable && setStage(s)}
                  disabled={!reachable}
                  aria-current={s === stage ? 'step' : undefined}
                  aria-label={t(STAGES[s - 1].labelKey)}
                  className={`block h-1.5 w-full rounded-full transition-colors ${focusRing} ${
                    s === stage ? 'bg-accent' : done ? 'bg-accent/50' : 'bg-line'
                  } ${reachable ? 'cursor-pointer' : 'cursor-default'}`}
                />
              </li>
            )
          })}
        </ol>
        <p className="mt-2 flex items-baseline justify-between text-xs">
          <span className="font-semibold">{t(STAGES[stage - 1].labelKey)}</span>
          <span className="text-muted">{t('ai.stepOf', { n: String(stage) })}</span>
        </p>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
    </aside>
  )
}
