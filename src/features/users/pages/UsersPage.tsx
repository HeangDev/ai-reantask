import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import DeleteDialog from '@/components/ui/DeleteDialog'
import Dropdown from '@/components/ui/Dropdown'
import { PlusIcon, SearchIcon, TrashIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import UserDetail from '@/features/users/components/UserDetail'
import UserForm from '@/features/users/components/UserForm'
import UsersTable from '@/features/users/components/UsersTable'
import { sampleUsers, userRoles } from '@/features/users/data/sampleUsers'
import type { User, UserInput } from '@/features/users/types'
import { useI18n } from '@/lib/i18n'

type Dialog =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'deleteSelected' }
  | { type: 'detail' | 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

export default function UsersPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  const [users, setUsers] = useState<User[]>(sampleUsers)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!status || u.status === status) &&
        `${u.fullName} ${u.email} ${u.phone}`.toLowerCase().includes(q),
    )
  }, [users, query, role, status])

  const target = 'id' in dialog ? users.find((u) => u.id === dialog.id) ?? null : null
  const close = () => setDialog(NO_DIALOG)

  const save = (input: UserInput) => {
    if (target && dialog.type === 'edit') {
      setUsers((list) => list.map((u) => (u.id === target.id ? { ...u, ...input } : u)))
      notify({ variant: 'info', title: t('usr.updated'), subtitle: t('toast.saved', { name: input.fullName }) })
    } else {
      setUsers((list) => [...list, { id: crypto.randomUUID(), ...input }])
      notify({ title: t('usr.added'), subtitle: t('toast.added', { name: input.fullName }) })
    }
    close()
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    setUsers((list) => list.filter((u) => !ids.has(u.id)))
    setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
    notify({ variant: 'danger', title: t('usr.deleted'), subtitle: t('toast.removed', { count: String(ids.size) }) })
    close()
  }

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.users')}</h1>
          <p className="mt-1 text-sm text-muted">{t('usr.pageDesc')}</p>
        </div>
        <Button
          type="button"
          onClick={() => setDialog({ type: 'create' })}
          size="sm"
          className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4"
        >
          <PlusIcon />
          {t('usr.add')}
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          {selected.size > 0 ? (
            <div className="flex flex-1 items-center gap-3 text-sm">
              <span className="font-medium">{t('stu.selected', { count: String(selected.size) })}</span>
              <button
                type="button"
                onClick={() => setDialog({ type: 'deleteSelected' })}
                className={`flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-medium text-red-600 transition-colors hover:bg-hover dark:text-red-400 [&>svg]:h-4 [&>svg]:w-4 ${focusRing}`}
              >
                <TrashIcon />
                {t('stu.deleteSelected')}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className={`rounded px-1 text-muted hover:text-fg hover:underline ${focusRing}`}
              >
                {t('stu.clearSelection')}
              </button>
            </div>
          ) : (
            <>
              <label className="relative flex-1 sm:max-w-xs">
                <span className="sr-only">{t('usr.search')}</span>
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('usr.searchPh')}
                  className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                {t('usr.role')}
                <Dropdown
                  value={role}
                  onChange={setRole}
                  options={[{ value: '', label: t('usr.allRoles') }, ...userRoles.map((r) => ({ value: r, label: r }))]}
                  wrapperClassName="min-w-0 flex-1 sm:w-40 sm:flex-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                {t('usr.status')}
                <Dropdown
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: '', label: t('usr.allStatuses') },
                    { value: 'active', label: t('usr.active') },
                    { value: 'inactive', label: t('usr.inactive') },
                  ]}
                  wrapperClassName="min-w-0 flex-1 sm:w-40 sm:flex-none"
                />
              </label>
            </>
          )}
        </div>

        {users.length === 0 ? (
          <div className="border-t border-line p-10 text-center">
            <p className="font-semibold">{t('usr.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('usr.emptyDesc')}</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="border-t border-line p-10 text-center text-sm text-muted">{t('usr.noMatch')}</p>
        ) : (
          <UsersTable
            users={visible}
            selected={selected}
            onSelectedChange={setSelected}
            onOpen={(id) => setDialog({ type: 'detail', id })}
            onEdit={(id) => setDialog({ type: 'edit', id })}
            onDelete={(id) => setDialog({ type: 'delete', id })}
          />
        )}
      </div>

      {dialog.type === 'create' && <UserForm user={null} users={users} onSave={save} onClose={close} />}
      {dialog.type === 'edit' && target && <UserForm user={target} users={users} onSave={save} onClose={close} />}
      {dialog.type === 'detail' && target && (
        <UserDetail
          user={target}
          onEdit={() => setDialog({ type: 'edit', id: target.id })}
          onDelete={() => setDialog({ type: 'delete', id: target.id })}
          onClose={close}
        />
      )}
      {dialog.type === 'delete' && target && (
        <DeleteDialog
          title={t('usr.deleteTitle')}
          message={t('stu.deleteMessage', { name: target.fullName })}
          confirmLabel={t('stu.delete')}
          person={target}
          onConfirm={() => removeIds(new Set([target.id]))}
          onCancel={close}
        />
      )}
      {dialog.type === 'deleteSelected' && (
        <DeleteDialog
          title={t('usr.deleteManyTitle', { count: String(selected.size) })}
          message={t('usr.deleteManyMessage')}
          confirmLabel={t('stu.delete')}
          onConfirm={() => removeIds(selected)}
          onCancel={close}
        />
      )}
    </section>
  )
}
