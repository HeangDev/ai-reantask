import { useMemo, useState } from 'react'
import { Button } from '@/shared/components/Button'
import { DeleteDialog } from '@/shared/components/DeleteDialog'
import { Dropdown } from '@/shared/components/Dropdown'
import { PlusIcon, SearchIcon, TrashIcon } from '@/shared/components/icons'
import { useToast } from '@/shared/components/Toast'
import { PendingStudentsPanel } from '@/features/users/components/PendingStudentsPanel'
import { UserDetail } from '@/features/users/components/UserDetail'
import { UserForm } from '@/features/users/components/UserForm'
import { UsersTable } from '@/features/users/components/UsersTable'
import { roleLabelKey } from '@/features/auth'
import { roles } from '@/features/auth'
import { useCreateUser, useDeleteUsers, useUpdateUser, useUsersList } from '@/features/users/api/useUsers'
import { serverFieldErrors } from '@/features/users/lib/validation'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { ApiError } from '@/shared/api/http'
import { teachersActions } from '@/features/teachers'
import type { TeacherDetails } from '@/features/teachers'
import { accountStatuses } from '@/features/users/types'
import type { UserFormErrors, UserSaveInput } from '@/features/users/types'
import { TableEmpty } from '@/shared/components/TableEmpty'
import { useI18n } from '@/shared/i18n'

type Dialog =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'deleteSelected' }
  | { type: 'detail' | 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

export function UsersPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0) // zero-based, like the table
  const [pageSize, setPageSize] = useState(10)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  // Search, role and status are applied by the server, so the list is requested again when they change.
  const search = useDebouncedValue(query)
  const usersQuery = useUsersList({
    search,
    role: roles.find((r) => r === role) ?? '',
    status: accountStatuses.find((x) => x === status) ?? '',
    page: page + 1,
    perPage: pageSize,
  })
  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data])
  const total = usersQuery.data?.total ?? 0
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUsers = useDeleteUsers()
  const saving = createUser.isPending || updateUser.isPending
  const [serverErrors, setServerErrors] = useState<UserFormErrors>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)

  const target = 'id' in dialog ? users.find((u) => u.id === dialog.id) ?? null : null
  const close = () => {
    setDialog(NO_DIALOG)
    setServerErrors({})
  }

  const showSaveError = (error: unknown) => {
    const fields = error instanceof ApiError && error.status === 422 ? serverFieldErrors(error.fieldErrors) : {}
    if (Object.keys(fields).length > 0) setServerErrors(fields)
    else notify({ variant: 'danger', title: t('usr.saveFailed'), subtitle: t('usr.tryAgain') })
  }

  const save = (input: UserSaveInput, teacher?: TeacherDetails) => {
    if (saving) return
    if (target && dialog.type === 'edit') {
      updateUser.mutate(
        { user: target, input },
        {
          onSuccess: () => {
            notify({ variant: 'info', title: t('usr.updated'), subtitle: t('toast.saved', { name: input.fullName }) })
            close()
          },
          onError: showSaveError,
        },
      )
    } else {
      createUser.mutate(input, {
        onSuccess: () => {
          // A user added as a teacher also gets a teacher profile, to be given classes on the Teachers page.
          if (teacher) {
            teachersActions.add({ fullName: input.fullName, email: input.email, phone: input.phone, classes: [], ...teacher })
          }
          notify({ title: t('usr.added'), subtitle: t('toast.added', { name: input.fullName }) })
          close()
        },
        onError: showSaveError,
      })
    }
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    if (deleteUsers.isPending) return
    deleteUsers.mutate([...ids], {
      onSuccess: () => {
        setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
        // Deleting everything on the last page would leave the page empty, so go back one.
        if (page > 0 && ids.size >= users.length) setPage(page - 1)
        notify({ variant: 'danger', title: t('usr.deleted'), subtitle: t('toast.removed', { count: String(ids.size) }) })
      },
      onError: () => notify({ variant: 'danger', title: t('usr.deleteFailed'), subtitle: t('usr.tryAgain') }),
      onSettled: close,
    })
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

      <PendingStudentsPanel />

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
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(0)
                  }}
                  placeholder={t('usr.searchPh')}
                  className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                {t('usr.role')}
                <Dropdown
                  value={role}
                  onChange={(v) => {
                    setRole(v)
                    setPage(0)
                  }}
                  options={[{ value: '', label: t('usr.allRoles') }, ...roles.map((r) => ({ value: r, label: t(roleLabelKey[r]) }))]}
                  wrapperClassName="min-w-0 flex-1 sm:w-40 sm:flex-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                {t('usr.status')}
                <Dropdown
                  value={status}
                  onChange={(v) => {
                    setStatus(v)
                    setPage(0)
                  }}
                  options={[
                    { value: '', label: t('usr.allStatuses') },
                    { value: 'PENDING', label: t('usr.pending') },
                    { value: 'ACTIVE', label: t('usr.active') },
                    { value: 'INACTIVE', label: t('usr.inactive') },
                    { value: 'SUSPENDED', label: t('usr.suspended') },
                  ]}
                  wrapperClassName="min-w-0 flex-1 sm:w-40 sm:flex-none"
                />
              </label>
            </>
          )}
        </div>

        {usersQuery.isError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {t('usr.loadFailed')}
            <button
              type="button"
              onClick={() => void usersQuery.refetch()}
              className={`rounded-lg border border-line px-3 py-1 text-xs font-medium text-fg hover:bg-hover ${focusRing}`}
            >
              {t('usr.tryAgain')}
            </button>
          </div>
        )}

        <UsersTable
          emptyMessage={
            usersQuery.isPending ? (
              <TableEmpty title={t('usr.loading')} />
            ) : query || role || status ? (
              <TableEmpty title={t('usr.noMatch')} />
            ) : (
              <TableEmpty title={t('usr.emptyTitle')} description={t('usr.emptyDesc')} />
            )
          }
          users={users}
          serverPaging={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size)
              setPage(0)
            },
          }}
          selected={selected}
          onSelectedChange={setSelected}
          onOpen={(id) => setDialog({ type: 'detail', id })}
          onEdit={(id) => setDialog({ type: 'edit', id })}
          onDelete={(id) => setDialog({ type: 'delete', id })}
        />
      </div>

      {dialog.type === 'create' && (
        <UserForm user={null} users={users} onSave={save} onClose={close} serverErrors={serverErrors} saving={saving} />
      )}
      {dialog.type === 'edit' && target && (
        <UserForm user={target} users={users} onSave={save} onClose={close} serverErrors={serverErrors} saving={saving} />
      )}
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
