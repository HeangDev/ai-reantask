import { useMemo } from 'react'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { CheckIcon, CloseIcon } from '@/components/ui/icons'
import type { Registration } from '@/features/auth/store/registrationsStore'
import { useI18n } from '@/lib/i18n'
import { formatTimeAgo } from '@/lib/timeAgo'

interface Props {
  registrations: Registration[]
  onApprove: (registration: Registration) => void
  onDecline: (registration: Registration) => void
}

const actionButton =
  'rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4'

/** Students waiting for approval, as a table that sorts and pages, so a long list stays easy to scan. */
export default function PendingRegistrationsTable({ registrations, onApprove, onDecline }: Props) {
  const { t, locale } = useI18n()

  const columns = useMemo<Column<Registration>[]>(
    () => [
      { key: 'name', header: t('stu.colName'), primary: true, sortValue: (r) => r.fullName },
      {
        key: 'role',
        header: t('usr.role'),
        width: '7rem',
        hideBelow: 'lg',
        cell: () => t('role.student'),
      },
      {
        key: 'registered',
        header: t('reg.colRegistered'),
        width: '9rem',
        sortValue: (r) => String(r.createdAt).padStart(15, '0'),
        cellClassName: 'whitespace-nowrap text-muted',
        cell: (r) => formatTimeAgo(r.createdAt, locale),
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

  return (
    <DataTable
      readOnly
      initialPageSize={5}
      rows={registrations}
      columns={columns}
      getName={(r) => r.fullName}
      getSubtitle={(r) => r.email}
      initialSort="registered"
      minWidthClass="min-w-[30rem]"
      labels={labels}
      renderActions={(r) => (
        <>
          <button
            type="button"
            onClick={() => onDecline(r)}
            aria-label={`${t('joinreq.decline')}: ${r.fullName}`}
            title={t('joinreq.decline')}
            className={`${actionButton} text-muted hover:bg-hover hover:text-red-600 dark:hover:text-red-400`}
          >
            <CloseIcon />
          </button>
          <button
            type="button"
            onClick={() => onApprove(r)}
            aria-label={`${t('joinreq.approve')}: ${r.fullName}`}
            title={t('joinreq.approve')}
            className={`${actionButton} bg-accent-strong text-white hover:brightness-110`}
          >
            <CheckIcon />
          </button>
        </>
      )}
    />
  )
}
