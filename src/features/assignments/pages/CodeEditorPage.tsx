import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon, ChevronDownIcon, CloseIcon, CodeIcon, SparklesIcon } from '@/components/ui/icons'
import AiAnalyzerPanel from '@/features/assignments/components/editor/AiAnalyzerPanel'
import CodeView from '@/features/assignments/components/editor/CodeView'
import FileBadge from '@/features/assignments/components/editor/FileBadge'
import FileExplorer from '@/features/assignments/components/editor/FileExplorer'
import { buildTree, extensionOf } from '@/features/assignments/lib/fileTree'
import { languageNames } from '@/features/assignments/lib/syntax'
import { assignmentsActions, useAssignments } from '@/features/assignments/store/assignmentsStore'
import type { CodeFile } from '@/features/assignments/types'
import { useI18n } from '@/lib/i18n'

const focusRing = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

const defaultFile = (files: CodeFile[]) => (files.find((f) => f.path === 'src/App.tsx') ?? files[0]).path

/** A read-only code editor for one student's project. */
interface JumpRequest {
  path: string
  line: number
  /** Differs on every request, so jumping to the same spot twice still scrolls. */
  token: number
}

function Workspace({ files, panel, jump }: { files: CodeFile[]; panel?: ReactNode; jump?: JumpRequest }) {
  const { t } = useI18n()
  const tree = useMemo(() => buildTree(files), [files])
  const [tabs, setTabs] = useState<string[]>(() => [defaultFile(files)])
  const [active, setActive] = useState<string | null>(() => defaultFile(files))
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [lineByFile, setLineByFile] = useState<Record<string, number>>({})

  const file = active ? files.find((f) => f.path === active) : undefined
  const extension = active ? extensionOf(active) : ''
  const totalLines = file ? file.code.replace(/\n$/, '').split('\n').length : 0
  const currentLine = active ? Math.min(lineByFile[active] ?? 1, totalLines || 1) : 1
  // Places to start from when nothing is open.
  const suggestions = [files.find((f) => f.path === 'README.md'), files.find((f) => f.path === defaultFile(files))].filter(
    (f, i, all): f is CodeFile => Boolean(f) && all.findIndex((x) => x?.path === f?.path) === i,
  )

  const open = (path: string) => {
    setTabs((current) => (current.includes(path) ? current : [...current, path]))
    setActive(path)
  }

  const close = (path: string) => {
    const index = tabs.indexOf(path)
    const remaining = tabs.filter((p) => p !== path)
    setTabs(remaining)
    if (path === active) setActive(remaining.length > 0 ? remaining[Math.min(index, remaining.length - 1)] : null)
  }

  // Showing a problem from the analyzer opens its file and moves the cursor to the line.
  useEffect(() => {
    if (!jump) return
    setTabs((current) => (current.includes(jump.path) ? current : [...current, jump.path]))
    setActive(jump.path)
    setLineByFile((current) => ({ ...current, [jump.path]: jump.line }))
  }, [jump])

  const toggle = (path: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (!next.delete(path)) next.add(path)
      return next
    })

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex max-h-44 shrink-0 flex-col border-b border-line bg-sunken md:max-h-none md:w-64 md:border-b-0 md:border-r">
          <h2 className="shrink-0 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t('asg.files')}</h2>
          <nav aria-label={t('asg.files')} className="min-h-0 flex-1 overflow-y-auto pb-2">
            <FileExplorer nodes={tree} active={active ?? ''} collapsed={collapsed} onOpen={open} onToggle={toggle} />
          </nav>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div role="tablist" className="flex shrink-0 overflow-x-auto border-b border-line bg-sunken">
            {tabs.map((path) => {
              const selected = path === active
              return (
                <div
                  key={path}
                  className={`group flex shrink-0 items-center border-r border-line text-[13px] ${
                    selected ? 'border-t-2 border-t-accent bg-surface text-fg' : 'border-t-2 border-t-transparent text-muted hover:bg-hover'
                  }`}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActive(path)}
                    className={`flex items-center gap-1.5 py-1.5 pl-3 pr-1 ${focusRing}`}
                  >
                    <FileBadge path={path} />
                    {path.split('/').pop()}
                  </button>
                  <button
                    type="button"
                    onClick={() => close(path)}
                    aria-label={t('asg.closeTab', { name: path.split('/').pop() ?? path })}
                    className={`mr-1.5 rounded p-0.5 text-muted opacity-60 transition-opacity hover:bg-hover hover:text-fg hover:opacity-100 group-hover:opacity-100 ${focusRing} [&>svg]:h-3.5 [&>svg]:w-3.5`}
                  >
                    <CloseIcon />
                  </button>
                </div>
              )
            })}
          </div>

          {file && active ? (
            <>
              <nav aria-label={t('asg.files')} className="flex shrink-0 items-center gap-1 border-b border-line bg-surface px-4 py-1 text-xs text-muted">
                {active.split('/').map((part, i, all) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="-rotate-90 [&>svg]:h-3 [&>svg]:w-3" aria-hidden="true"><ChevronDownIcon /></span>}
                    <span className={i === all.length - 1 ? 'text-fg' : ''}>{part}</span>
                  </span>
                ))}
              </nav>
              <CodeView
                key={active}
                code={file.code}
                extension={extension}
                currentLine={currentLine}
                revealToken={jump?.path === active ? jump.token : undefined}
                onSelectLine={(line) => setLineByFile((current) => ({ ...current, [active]: line }))}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-fg [&>svg]:h-7 [&>svg]:w-7" aria-hidden="true">
                <CodeIcon />
              </span>
              <p className="mt-2 text-base font-semibold">{t('asg.noFileOpen')}</p>
              <p className="max-w-xs text-sm text-muted">{t('asg.noFileOpenHint')}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.path}
                    type="button"
                    onClick={() => open(s.path)}
                    className={`flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] transition-colors hover:border-accent/50 hover:bg-hover ${focusRing}`}
                  >
                    <FileBadge path={s.path} />
                    {s.path}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {panel}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 bg-accent-strong px-4 py-1 text-xs text-white">
        <span>{file ? t('asg.statusLine', { line: String(currentLine), total: String(totalLines) }) : t('asg.noFileOpen')}</span>
        <span className="flex items-center gap-4">
          {file && <span>{languageNames[extension] ?? extension.toUpperCase()}</span>}
          {file && <span>UTF-8</span>}
          <span>{t('asg.filesCount', { count: String(files.length) })}</span>
        </span>
      </footer>
    </>
  )
}

/** One student's project opened like a code editor, on its own page. */
export default function CodeEditorPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const [params] = useSearchParams()
  const [analyzerOpen, setAnalyzerOpen] = useState(false)
  // Once opened the analyzer stays mounted, so closing it does not lose its progress.
  const [analyzerUsed, setAnalyzerUsed] = useState(false)
  const [jump, setJump] = useState<JumpRequest | undefined>()
  const assignments = useAssignments()
  const assignment = assignments.find((a) => a.id === id)

  const projects = useMemo(() => (assignment?.submissions ?? []).filter((s) => s.files && s.files.length > 0), [assignment])
  const current = projects.find((s) => s.student === params.get('student')) ?? projects[0]

  const back = (
    <Link
      to="/assign"
      className={`flex shrink-0 items-center gap-1.5 rounded text-sm font-medium text-accent-fg hover:underline ${focusRing} [&>svg]:h-4 [&>svg]:w-4`}
    >
      <ArrowLeftIcon />
      {t('asg.back')}
    </Link>
  )

  if (!assignment || !current?.files) {
    return (
      <section className="p-4 sm:p-6">
        <div className="mb-4">{back}</div>
        <p className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          {assignment ? t('asg.noCode') : t('asg.notFound')}
        </p>
      </section>
    )
  }

  return (
    <div className="flex h-full min-h-[30rem] flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-2">
        {back}
        <span className="h-4 w-px bg-line" aria-hidden="true" />
        <h1 className="min-w-0 truncate text-sm font-semibold">{assignment.title}</h1>
        <button
          type="button"
          onClick={() => {
            setAnalyzerOpen((open) => !open)
            setAnalyzerUsed(true)
          }}
          aria-pressed={analyzerOpen}
          className={`ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${focusRing} [&>svg]:h-4 [&>svg]:w-4 ${
            analyzerOpen ? 'border-accent bg-accent-soft text-accent-fg' : 'border-line bg-surface hover:bg-hover'
          }`}
        >
          <SparklesIcon />
          {t('ai.button')}
        </button>
      </header>

      {/* Keyed by student so switching starts that project with its own tabs and cursor. */}
      <Workspace
        key={current.student}
        files={current.files}
        jump={jump}
        panel={
          analyzerUsed && (
            <div className={analyzerOpen ? 'contents' : 'hidden'}>
              <AiAnalyzerPanel
                files={current.files}
                fixedFiles={current.fixedFiles}
                tasks={assignment.tasks ?? []}
                taskResults={current.taskResults}
                fixedTaskResults={current.fixedTaskResults}
                verifiedAt={current.verifiedAt}
                onVerify={() => assignmentsActions.setVerified(assignment.id, current.student, true)}
                onUnverify={() => assignmentsActions.setVerified(assignment.id, current.student, false)}
                onJump={(path, line) => setJump({ path, line, token: Date.now() })}
                onClose={() => setAnalyzerOpen(false)}
              />
            </div>
          )
        }
      />
    </div>
  )
}
