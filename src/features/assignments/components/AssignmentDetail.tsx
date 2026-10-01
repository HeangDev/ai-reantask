import { useState } from 'react'
import type { ChangeEvent } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import TaskChecklist from '@/features/assignments/components/TaskChecklist'
import DueLabel from '@/features/assignments/components/DueLabel'
import ProgressStepper from '@/features/assignments/components/ProgressStepper'
import StudentProfile from '@/features/students/components/StudentProfile'
import StatusBadge from '@/features/assignments/components/StatusBadge'
import { formatDate } from '@/features/assignments/lib/dates'
import type { Assignment, FileType } from '@/features/assignments/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  assignment: Assignment
  onSubmit: (id: string, fileName: string) => void
}

const extensions: Record<FileType, string[]> = {
  PDF: ['.pdf'],
  DOCX: ['.docx'],
  Images: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  ZIP: ['.zip'],
}

const card = 'rounded-xl border border-line bg-surface p-5 shadow-sm'

export default function AssignmentDetail({ assignment: a, onSubmit }: Props) {
  const { t, locale } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The classmate whose profile is open.
  const [profileName, setProfileName] = useState<string | null>(null)

  const types = a.allowedFileTypes.join(', ')
  const allowed = a.allowedFileTypes.flatMap((type) => extensions[type])
  const open = a.status === 'pending' || a.status === 'late' || a.status === 'resubmit'

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (picked && a.maxFileSizeMb && picked.size > a.maxFileSizeMb * 1024 * 1024) {
      setFile(null)
      setError(t('error.tooLarge', { size: String(a.maxFileSizeMb) }))
      return
    }
    if (picked && !allowed.some((ext) => picked.name.toLowerCase().endsWith(ext))) {
      setFile(null)
      setError(t('error.unsupported', { types }))
      return
    }
    setError(null)
    setFile(picked)
  }

  const submit = () => {
    if (!file) return setError(t('error.noFile'))
    onSubmit(a.id, file.name)
    setFile(null)
  }

  return (
    <article className="p-5 sm:p-6">
      <header className="mb-5">
        <p className="text-sm text-muted">{a.className}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{a.title}</h1>
          <StatusBadge status={a.status} />
        </div>
      </header>

      <div className="space-y-5">
        <ProgressStepper status={a.status} />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-line bg-surface p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">{t('detail.due')}</dt>
            <dd className="mt-0.5 font-medium">{formatDate(a.deadline, locale)}</dd>
            {open && <DueLabel deadline={a.deadline} className="text-xs font-medium" />}
          </div>
          <div>
            <dt className="text-xs text-muted">{a.score !== undefined ? t('detail.score') : t('detail.maxScore')}</dt>
            <dd className="mt-0.5 font-medium">
              {a.score !== undefined ? `${a.score} / ${a.maxScore}` : a.maxScore}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted">{t('detail.fileTypes')}</dt>
            <dd className="mt-0.5 font-medium">
              {types}
              {a.maxFileSizeMb && <span className="font-normal text-muted"> · {t('detail.upTo', { size: String(a.maxFileSizeMb) })}</span>}
            </dd>
          </div>
        </dl>

        <div className="space-y-5">
          <section className={card}>
            <p className="text-sm leading-relaxed">{a.description}</p>
          </section>

          {/* Tasks only appear once the student has handed something in. */}
          {a.submittedFile && a.tasks && a.tasks.length > 0 && <TaskChecklist tasks={a.tasks} />}

          {a.members && a.members.length > 1 && (
            <section className={card}>
              <h2 className="text-sm font-semibold">
                {t('detail.group')} <span className="font-normal text-muted">· {a.members.length}</span>
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {a.members.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => setProfileName(name)}
                      aria-label={t('profile.view', { name })}
                      className="flex items-center gap-2 rounded-full bg-sunken py-1 pl-1 pr-3 text-sm transition-colors hover:bg-accent-soft hover:text-accent-fg focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <Avatar name={name} size="sm" />
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {a.feedback && (
            <section className="rounded-xl border-l-4 border-accent bg-accent-soft p-5">
              <h2 className="text-sm font-semibold text-accent-fg">{t('detail.feedback')}</h2>
              <p className="mt-1 text-sm">{a.feedback}</p>
            </section>
          )}

          <section className={card}>
            <h2 className="text-sm font-semibold">{t('detail.yourWork')}</h2>
            {a.submittedFile && (
              <p className="mt-3 rounded-lg bg-sunken px-3 py-2 text-sm">
                {t('detail.submittedFile')}: <span className="font-medium">{a.submittedFile}</span>
              </p>
            )}

            {open ? (
              <div className="mt-3">
                <label
                  htmlFor="work-file"
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-line p-8 text-center text-sm text-muted transition-colors focus-within:outline-2 focus-within:outline-accent hover:border-accent hover:bg-accent-soft/40"
                >
                  <span className="font-medium text-fg">{file ? file.name : t('detail.choose')}</span>
                  <span>{types}</span>
                  <input id="work-file" type="file" accept={allowed.join(',')} onChange={onPick} className="sr-only" />
                </label>
                {error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                <Button type="button" onClick={submit} disabled={!file} className="mt-3">
                  {a.submittedFile ? t('detail.resubmit') : t('detail.submit')}
                </Button>
              </div>
            ) : (
              !a.submittedFile && <p className="mt-2 text-sm text-muted">{t('detail.closed')}</p>
            )}
          </section>
        </div>
      </div>
      {profileName && <StudentProfile name={profileName} onClose={() => setProfileName(null)} />}
    </article>
  )
}
