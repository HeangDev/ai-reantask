import AvatarGroup from '@/components/ui/AvatarGroup'
import { AttachmentIcon } from '@/components/ui/icons'
import DueLabel from '@/features/assignments/components/DueLabel'
import StatusBadge, { statusStyles } from '@/features/assignments/components/StatusBadge'
import { formatDate } from '@/features/assignments/lib/dates'
import { needsAction } from '@/features/assignments/lib/status'
import type { Assignment } from '@/features/assignments/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  assignment: Assignment
  onOpen: (id: string) => void
}

/** One assignment on the board: what it is, when it is due or how it went, and any teacher feedback. */
export default function AssignmentCard({ assignment: a, onOpen }: Props) {
  const { t, locale } = useI18n()
  const open = needsAction(a)

  return (
    <button
      type="button"
      onClick={() => onOpen(a.id)}
      className="w-full rounded-lg border border-line bg-surface p-3 text-left shadow-sm transition-all hover:-translate-y-px hover:border-accent/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusStyles[a.status].dot}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{a.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{a.className}</p>
        </div>
        {a.members && a.members.length > 1 && (
          <AvatarGroup names={a.members} label={t('board.members', { names: a.members.join(', ') })} />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        {open ? (
          <DueLabel deadline={a.deadline} className="font-medium" />
        ) : (
          <span className="text-muted">{formatDate(a.deadline, locale)}</span>
        )}
        {a.score !== undefined ? (
          <span className="font-semibold">
            {a.score}
            <span className="font-normal text-muted"> / {a.maxScore}</span>
          </span>
        ) : (
          open && <StatusBadge status={a.status} />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px] text-muted">
        {a.submittedFile ? (
          <span className="flex min-w-0 items-center gap-1 [&>svg]:h-3.5 [&>svg]:w-3.5">
            <AttachmentIcon />
            <span className="truncate">{a.submittedFile}</span>
          </span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {a.allowedFileTypes.map((type) => (
              <span key={type} className="rounded bg-sunken px-1.5 py-0.5 font-medium">{type}</span>
            ))}
          </span>
        )}
        <span className="shrink-0">{t('board.points', { max: String(a.maxScore) })}</span>
      </div>

      {a.feedback && (
        <p className="mt-3 line-clamp-2 border-l-2 border-accent pl-2 text-xs text-muted">
          <span className="font-medium text-accent-fg">{t('detail.feedback')}: </span>
          {a.feedback}
        </p>
      )}
    </button>
  )
}
