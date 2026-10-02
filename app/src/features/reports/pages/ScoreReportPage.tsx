import { useMemo, useState } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import ExportMenu from '@/components/ui/ExportMenu'
import { DownloadIcon, FileIcon, PrintIcon, SearchIcon, StarIcon, StudentsIcon, TasksIcon } from '@/components/ui/icons'
import TableEmpty from '@/components/ui/TableEmpty'
import { useToast } from '@/components/ui/Toast'
import { useAssignableClassNames } from '@/features/classes/hooks/useAssignableClassNames'
import { StatCard } from '@/features/dashboard/components/StatCards'
import PrintableScoreReport from '@/features/reports/components/PrintableScoreReport'
import ScoreTable from '@/features/reports/components/ScoreTable'
import { useScoreReport } from '@/features/reports/hooks/useScoreReport'
import { downloadCsv } from '@/lib/csv'
import { useI18n } from '@/lib/i18n'
import { printWithTitle } from '@/lib/print'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

/** The teacher's report of how each student is scoring. */
export default function ScoreReportPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  const report = useScoreReport()
  const classNames = useAssignableClassNames()
  const [query, setQuery] = useState('')
  const [className, setClassName] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return report.filter((r) => (!className || r.classes.includes(className)) && r.student.toLowerCase().includes(q))
  }, [report, query, className])

  const summary = useMemo(() => {
    const graded = visible.reduce((sum, r) => sum + r.graded, 0)
    const earned = visible.reduce((sum, r) => sum + r.earned, 0)
    const possible = visible.reduce((sum, r) => sum + r.possible, 0)
    return { graded, average: possible > 0 ? Math.round((earned / possible) * 100) : null }
  }, [visible])

  const exportCsv = () =>
    downloadCsv('student-scores.csv', [
      [t('stu.colName'), t('rep.colClasses'), t('rep.colAssigned'), t('rep.colSubmitted'), t('rep.colGraded'), t('rep.colScore'), t('rep.colAverage')],
      ...visible.map((r) => [
        r.student,
        r.classes.join('; '),
        r.assigned,
        r.submitted,
        r.graded,
        r.graded > 0 ? `${r.earned}/${r.possible}` : '',
        r.percent === null ? '' : `${r.percent}%`,
      ]),
    ])

  // PDF goes through the print window: choosing "Save as PDF" there keeps every language's text intact.
  const exportPdf = () => {
    notify({ variant: 'info', title: t('rep.pdfHint'), subtitle: t('rep.pdfHintDesc') })
    printWithTitle('student-scores')
  }

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.scoreReport')}</h1>
          <p className="mt-1 text-sm text-muted">{t('rep.desc')}</p>
        </div>
        <ExportMenu
          label={t('rep.export')}
          disabled={visible.length === 0}
          options={[
            { label: t('rep.exportCsv'), icon: <DownloadIcon />, onSelect: exportCsv },
            { label: t('rep.exportPdf'), icon: <FileIcon />, onSelect: exportPdf },
            { label: t('rep.exportPrint'), icon: <PrintIcon />, onSelect: () => printWithTitle('student-scores') },
          ]}
        />
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t('rep.statStudents')} value={String(visible.length)} icon={<StudentsIcon />} detail={<p>{t('rep.statStudentsDetail')}</p>} />
        <StatCard
          label={t('rep.statAverage')}
          value={summary.average === null ? '—' : `${summary.average}%`}
          icon={<StarIcon />}
          detail={<p>{t('rep.statAverageDetail')}</p>}
        />
        <StatCard label={t('rep.statGraded')} value={String(summary.graded)} icon={<TasksIcon />} detail={<p>{t('rep.statGradedDetail')}</p>} />
      </dl>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <label className="relative flex-1 sm:max-w-xs">
            <span className="sr-only">{t('stu.search')}</span>
            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('rep.searchPh')}
              className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            {t('board.class')}
            <Dropdown
              value={className}
              onChange={setClassName}
              options={[{ value: '', label: t('board.allClasses') }, ...classNames.map((c) => ({ value: c, label: c }))]}
              wrapperClassName="min-w-0 flex-1 sm:w-48 sm:flex-none"
            />
          </label>
        </div>

        <ScoreTable
          rows={visible}
          emptyMessage={
            report.length === 0 ? (
              <TableEmpty title={t('rep.emptyTitle')} description={t('rep.emptyDesc')} />
            ) : (
              <TableEmpty title={t('rep.noMatch')} />
            )
          }
        />
      </div>
      <PrintableScoreReport rows={visible} className={className} average={summary.average} />
    </section>
  )
}
