import { useMemo, useState } from 'react'
import DeleteDialog from '@/components/ui/DeleteDialog'
import Dropdown from '@/components/ui/Dropdown'
import { SearchIcon, TrashIcon } from '@/components/ui/icons'
import TableEmpty from '@/components/ui/TableEmpty'
import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/features/auth/store/authStore'
import PendingStudentsPanel from '@/features/users/components/PendingStudentsPanel'
import UserDetail from '@/features/users/components/UserDetail'
import UserForm from '@/features/users/components/UserForm'
import UsersTable from '@/features/users/components/UsersTable'
import { useDeleteUsers, useUpdateUser, useUsersList } from '@/features/users/hooks/useUsers'
import { serverFieldErrors } from '@/features/users/lib/validation'
import { accountStatuses } from '@/features/users/types'
import type { UserFormErrors, UserSaveInput } from '@/features/users/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ApiError } from '@/lib/apiClient'
import { useI18n } from '@/lib/i18n'

type Dialog =
  | { type: 'none' }
  | { type: 'deleteSelected' }
  | { type: 'detail' | 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

/**
 * The students: users whose role is student. Listing, editing and deleting users is for admins in the API, so a
 * teacher only gets the list of students waiting for approval, which teachers may approve.
 */
export default function StudentsPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  const role = useSession()?.role
  const isAdmin = role === 'admin'
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0) // zero-based, like the table
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState('')
  // Search and status are applied by the server, so the list is requested again when they change.
  const search = useDebouncedValue(query)
  const studentsQuery = useUsersList(
    {
      search,
      role: 'student',
      status: accountStatuses.find((x) => x === status) ?? '',
      page: page + 1,
      perPage: pageSize,
    },
    isAdmin,
  )
  const students = useMemo(() => studentsQuery.data?.users ?? [], [studentsQuery.data])
  const total = studentsQuery.data?.total ?? 0
  const updateUser = useUpdateUser()
  const deleteUsers = useDeleteUsers()
  const [serverErrors, setServerErrors] = useState<UserFormErrors>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)

  const target = 'id' in dialog ? students.find((s) => s.id === dialog.id) ?? null : null
  const close = () => {
    setDialog(NO_DIALOG)
    setServerErrors({})
  }

  const save = (input: UserSaveInput) => {
    if (!target || updateUser.isPending) return
    updateUser.mutate(
      { user: target, input },
      {
        onSuccess: () => {
          notify({ variant: 'info', title: t('stu.updated'), subtitle: t('toast.saved', { name: input.fullName }) })
          close()
        },
        onError: (error) => {
          const fields = error instanceof ApiError && error.status === 422 ? serverFieldErrors(error.fieldErrors) : {}
          if (Object.keys(fields).length > 0) setServerErrors(fields)
          else notify({ variant: 'danger', title: t('usr.saveFailed'), subtitle: t('usr.tryAgain') })
        },
      },
    )
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    if (deleteUsers.isPending) return
    deleteUsers.mutate([...ids], {
      onSuccess: () => {
        setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
        // Deleting everything on the last page would leave the page empty, so go back one.
        if (page > 0 && ids.size >= students.length) setPage(page - 1)
        notify({ variant: 'danger', title: t('stu.deleted'), subtitle: t('toast.removed', { count: String(ids.size) }) })
      },
      onError: () => notify({ variant: 'danger', title: t('usr.deleteFailed'), subtitle: t('usr.tryAgain') }),
      onSettled: close,
    })
  }

  return (
    <section className="p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('nav.students')}</h1>
        <p className="mt-1 text-sm text-muted">{t('stu.pageDesc')}</p>
      </div>

      {/* Teachers can approve new registrations when the admin is busy; admins do it on the Users page. */}
      {role === 'teacher' && <PendingStudentsPanel />}

      {!isAdmin ? (
        <p className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm text-muted">{t('stu.adminOnly')}</p>
      ) : (
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
                  <span className="sr-only">{t('stu.search')}</span>
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
                    placeholder={t('stu.searchPh')}
                    className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  {t('cls.status')}
                  <Dropdown
                    value={status}
                    onChange={(v) => {
                      setStatus(v)
                      setPage(0)
                    }}
                    options={[
                      { value: '', label: t('sub.allStatuses') },
                      { value: 'PENDING', label: t('usr.pending') },
                      { value: 'ACTIVE', label: t('usr.active') },
                      { value: 'INACTIVE', label: t('usr.inactive') },
                      { value: 'SUSPENDED', label: t('usr.suspended') },
                    ]}
                    wrapperClassName="min-w-0 flex-1 sm:w-44 sm:flex-none"
                  />
                </label>
              </>
            )}
          </div>

          {studentsQuery.isError && (
            <div role="alert" className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {t('stu.loadFailed')}
              <button
                type="button"
                onClick={() => void studentsQuery.refetch()}
                className={`rounded-lg border border-line px-3 py-1 text-xs font-medium text-fg hover:bg-hover ${focusRing}`}
              >
                {t('usr.tryAgain')}
              </button>
            </div>
          )}

          <UsersTable
            showRole={false}
            emptyMessage={
              studentsQuery.isPending ? (
                <TableEmpty title={t('stu.loading')} />
              ) : query || status ? (
                <TableEmpty title={t('stu.noMatch')} />
              ) : (
                <TableEmpty title={t('stu.emptyTitle')} />
              )
            }
            users={students}
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
      )}

      {dialog.type === 'edit' && target && (
        <UserForm
          user={target}
          users={students}
          lockedRole="student"
          onSave={save}
          onClose={close}
          serverErrors={serverErrors}
          saving={updateUser.isPending}
        />
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
          title={t('stu.deleteTitle')}
          message={t('stu.deleteMessage', { name: target.fullName })}
          confirmLabel={t('stu.delete')}
          person={target}
          onConfirm={() => removeIds(new Set([target.id]))}
          onCancel={close}
        />
      )}
      {dialog.type === 'deleteSelected' && (
        <DeleteDialog
          title={t('stu.deleteManyTitle', { count: String(selected.size) })}
          message={t('stu.deleteManyMessage')}
          confirmLabel={t('stu.delete')}
          onConfirm={() => removeIds(selected)}
          onCancel={close}
        />
      )}
    </section>
  )
}
