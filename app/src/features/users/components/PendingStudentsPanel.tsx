import { useMemo } from 'react'
import { DataTable } from '@/shared/components/DataTable'
import type { Column } from '@/shared/components/DataTable'
import { CheckIcon } from '@/shared/components/icons'
import { useToast } from '@/shared/components/Toast'
import { useSession } from '@/shared/store/authStore'
import { useApproveUser, usePendingStudents } from '@/features/users/api/useUsers'
import type { User } from '@/features/users/types'
import { useI18n } from '@/shared/i18n'
import { formatTimeAgo } from '@/shared/lib/timeAgo'

/**
 * Students who registered and are waiting for approval (`GET /users/pending-students`). An admin or a teacher can
 * approve, so a busy admin does not hold anyone up. Nothing is shown when nobody is waiting.
 */
export function PendingStudentsPanel() {
  const { t, locale } = useI18n()
  const { notify } = useToast()
  const role = useSession()?.role
  const canApprove = role === 'admin' || role === 'teacher'
  const pending = usePendingStudents(canApprove).data ?? []
  const approve = useApproveUser()

  const columns = useMemo<Column<User>[]>(
    () => [
      { key: 'name', header: t('stu.colName'), primary: true, sortValue: (u) => u.fullName },
      {
        key: 'registered',
        header: t('reg.colRegistered'),
        width: '9rem',
        sortValue: (u) => String(u.createdAt).padStart(15, '0'),
        cellClassName: 'whitespace-nowrap text-muted',
        cell: (u) => formatTimeAgo(u.createdAt, locale),
      },
    ],
    [t, locale],
  )

  const labels = useMemo(
    () => ({
      selectAll: '',
      selectRow: () => '',
      actions: t('stu.colActions'),
      edit: '',
      delete: '',
      rowsPerPage: t('stu.rowsPerPage'),
      range: (from: number, to: number, total: number) =>
        t('stu.range', { from: String(from), to: String(to), total: String(total) }),
      prev: t('stu.prev'),
      next: t('stu.next'),
    }),
    [t],
  )

  if (!canApprove || pending.length === 0) return null

  const approveStudent = (student: User) => {
    if (approve.isPending) return
    approve.mutate(student.id, {
      onSuccess: () => notify({ title: t('reg.approvedToast'), subtitle: t('reg.approvedToastDesc', { name: student.fullName }) }),
      onError: () => notify({ variant: 'danger', title: t('usr.approveFailed'), subtitle: t('usr.tryAgain') }),
    })
  }

  return (
    <section
      aria-labelledby="pending-registrations"
      className="mt-4 overflow-hidden rounded-xl border border-amber-300 bg-surface dark:border-amber-500/40"
    >
      <h2
        id="pending-registrations"
        className="flex items-center gap-2 border-b border-line bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
      >
        {t('reg.title')}
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs dark:bg-amber-500/30">{pending.length}</span>
      </h2>
      <DataTable
        readOnly
        initialPageSize={5}
        rows={pending}
        columns={columns}
        getName={(u) => u.fullName}
        getSubtitle={(u) => u.email}
        initialSort="registered"
        minWidthClass="min-w-[24rem]"
        labels={labels}
        renderActions={(u) => (
          <button
            type="button"
            disabled={approve.isPending}
            onClick={() => approveStudent(u)}
            aria-label={`${t('joinreq.approve')}: ${u.fullName}`}
            title={t('joinreq.approve')}
            className="rounded-md bg-accent-strong p-1.5 text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-40 [&>svg]:h-4 [&>svg]:w-4"
          >
            <CheckIcon />
          </button>
        )}
      />
    </section>
  )
}
