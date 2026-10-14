import { useMemo } from 'react'
import type { ReactNode } from 'react'
import DataTable from '@/components/ui/DataTable'
import type { Column, ServerPaging } from '@/components/ui/DataTable'
import { roleLabelKey } from '@/features/auth/lib/roleLabels'
import AccountStatusBadge from '@/features/users/components/AccountStatusBadge'
import type { User } from '@/features/users/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** Shown inside the table when it has no rows. */
  emptyMessage?: ReactNode
  /** Already filtered by the server. */
  users: User[]
  serverPaging: ServerPaging
  /** The role column; hidden where every row has the same role. */
  showRole?: boolean
  selected: ReadonlySet<string>
  onSelectedChange: (ids: Set<string>) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function UsersTable({ users, showRole = true, ...handlers }: Props) {
  const { t } = useI18n()

  const columns = useMemo<Column<User>[]>(
    () => [
      { key: 'fullName', header: t('stu.colName'), primary: true, sortValue: (u) => u.fullName },
      { key: 'phone', header: t('stu.colPhone'), width: '9.5rem', cellClassName: 'whitespace-nowrap text-muted', cell: (u) => u.phone },
      ...(showRole
        ? [{ key: 'role', header: t('usr.role'), width: '10rem', sortValue: (u: User) => u.role, cell: (u: User) => t(roleLabelKey[u.role]) }]
        : []),
      {
        key: 'status',
        header: t('usr.status'),
        width: '9rem',
        sortValue: (u) => u.status,
        cell: (u) => <AccountStatusBadge status={u.status} />,
      },
    ],
    [t, showRole],
  )

  const labels = useMemo(
    () => ({
      selectAll: t('usr.selectAll'),
      selectRow: (name: string) => t('stu.selectRow', { name }),
      actions: t('stu.colActions'),
      edit: t('stu.edit'),
      delete: t('stu.delete'),
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
      rows={users}
      columns={columns}
      getName={(u) => u.fullName}
      getSubtitle={(u) => u.email}
      initialSort="fullName"
      labels={labels}
      minWidth="44rem"
      {...handlers}
    />
  )
}
