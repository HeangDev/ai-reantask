import { Link, useParams } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import AvatarGroup from '@/components/ui/AvatarGroup'
import { ArrowLeftIcon, CodeIcon, EyeIcon } from '@/components/ui/icons'
import PhaseBadge from '@/features/assignments/components/PhaseBadge'
import { useAssignments } from '@/features/assignments/store/assignmentsStore'
import { formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

const card = 'rounded-xl border border-line bg-surface p-5'
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent'

/** The teacher's view of one assignment: what was set, who has it, and the work handed in. */
export default function AssignDetailPage() {
  const { t, locale } = useI18n()
  const { id } = useParams()
  const assignments = useAssignments()
  const assignment = assignments.find((a) => a.id === id)

  const back = (
    <Link
      to="/assign"
      className={`mb-4 inline-flex items-center gap-1.5 rounded text-sm font-medium text-accent-fg hover:underline ${focusRing} [&>svg]:h-4 [&>svg]:w-4`}
    >
      <ArrowLeftIcon />
      {t('asg.back')}
    </Link>
  )

  if (!assignment) {
    return (
      <section className="p-4 sm:p-6">
        {back}
        <p className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">{t('asg.notFound')}</p>
      </section>
    )
  }

  const assignees = assignment.assignees ?? []
  const submissionFor = (name: string) => assignment.submissions?.find((s) => s.student === name)
  const submittedCount = assignees.filter((name) => submissionFor(name)).length

  return (
    <section className="p-4 sm:p-6">
      {back}

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        <PhaseBadge phase={assignment.phase ?? 'in-progress'} />
      </header>
      <p className="mt-1 text-sm text-muted">{assignment.className}</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={card}>
          <dt className="text-xs text-muted">{t('detail.due')}</dt>
          <dd className="mt-1 font-semibold">{formatDate(assignment.deadline, locale)}</dd>
        </div>
        <div className={card}>
          <dt className="text-xs text-muted">{t('detail.maxScore')}</dt>
          <dd className="mt-1 font-semibold">{assignment.maxScore}</dd>
        </div>
        <div className={card}>
          <dt className="text-xs text-muted">{t('detail.fileTypes')}</dt>
          <dd className="mt-1 font-semibold">
            {assignment.allowedFileTypes.join(', ')}
            {assignment.maxFileSizeMb && (
              <span className="font-normal text-muted"> · {t('detail.upTo', { size: String(assignment.maxFileSizeMb) })}</span>
            )}
          </dd>
        </div>
        <div className={card}>
          <dt className="text-xs text-muted">{t('asg.colAssigned')}</dt>
          <dd className="mt-1.5">
            {assignees.length > 0 ? <AvatarGroup names={assignees} max={4} label={assignees.join(', ')} /> : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <section className={card}>
          <h2 className="text-sm font-semibold">{t('asg.fieldDescription')}</h2>
          <p className="mt-2 text-sm leading-relaxed">{assignment.description}</p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold">
            {t('asg.fieldTasks')} <span className="font-normal text-muted">· {assignment.tasks?.length ?? 0}</span>
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {assignment.tasks?.map((task) => <li key={task.id}>{task.title}</li>)}
          </ol>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-baseline justify-between gap-3 px-5 py-3">
          <h2 className="text-sm font-semibold">{t('asg.submissions')}</h2>
          <p className="text-xs text-muted">
            {t('asg.submittedCount', { done: String(submittedCount), total: String(assignees.length) })}
          </p>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-line text-[11px] font-medium text-muted">
                <th scope="col" className="px-5 py-2.5 font-medium">{t('asg.colStudent')}</th>
                <th scope="col" className="px-3 py-2.5 font-medium">{t('asg.colFile')}</th>
                <th scope="col" className="px-3 py-2.5 font-medium">{t('asg.colSubmitted')}</th>
                <th scope="col" className="w-16 px-5 py-2.5"><span className="sr-only">{t('stu.colActions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {assignees.map((name) => {
                const submission = submissionFor(name)
                return (
                  <tr key={name} className="border-b border-line/60 last:border-b-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={name} />
                        <span className="font-medium">{name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {submission ? (
                        <span className="flex items-center gap-1.5">
                          {submission.fileName}
                          {submission.files && (
                            <span className="text-muted [&>svg]:h-3.5 [&>svg]:w-3.5" title={t('asg.filesCount', { count: String(submission.files.length) })}>
                              <CodeIcon />
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">
                      {submission ? formatDate(submission.submittedAt, locale) : t('asg.notSubmitted')}
                      {submission?.verifiedAt && (
                        <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          ✓ {t('asg.verified')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {submission?.files && (
                        <Link
                          to={`/assign/${assignment.id}/code?student=${encodeURIComponent(name)}`}
                          aria-label={`${t('asg.viewFile')}: ${name}`}
                          className={`rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg ${focusRing} [&>svg]:h-4 [&>svg]:w-4`}
                        >
                          <EyeIcon />
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

    </section>
  )
}
