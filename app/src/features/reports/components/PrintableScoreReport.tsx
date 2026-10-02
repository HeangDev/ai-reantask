import { createPortal } from 'react-dom'
import type { ScoreRow } from '@/features/reports/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  rows: ScoreRow[]
  /** The class the report is limited to, or empty for all classes. */
  className: string
  average: number | null
}

/**
 * The score report laid out for paper: every row, black on white. It lives outside the app (in the page body) and
 * is only visible when printing, so printing or saving as PDF gives this instead of the screen.
 */
export default function PrintableScoreReport({ rows, className, average }: Props) {
  const { t, locale } = useI18n()
  const today = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date())
  const cell = 'border border-neutral-300 px-2 py-1.5 text-left align-top'

  return createPortal(
    <div className="print-root bg-white p-8 text-[12px] text-black">
      <h1 className="text-xl font-bold">{t('nav.scoreReport')}</h1>
      <p className="mt-1 text-neutral-600">
        {t('rep.generated', { date: today })} · {className ? t('rep.classOnly', { name: className }) : t('board.allClasses')}
        {average !== null && ` · ${t('rep.statAverage')}: ${average}%`}
      </p>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="bg-neutral-100">
            {[t('stu.colName'), t('rep.colClasses'), t('rep.colSubmitted'), t('rep.colGraded'), t('rep.colScore'), t('rep.colAverage')].map(
              (heading) => (
                <th key={heading} scope="col" className={`${cell} font-semibold`}>
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="break-inside-avoid">
              <th scope="row" className={`${cell} font-medium`}>
                {r.student}
              </th>
              <td className={cell}>{r.classes.join(', ') || '—'}</td>
              <td className={cell}>
                {r.submitted} / {r.assigned}
              </td>
              <td className={cell}>{r.graded}</td>
              <td className={cell}>{r.graded > 0 ? `${r.earned} / ${r.possible}` : '—'}</td>
              <td className={cell}>{r.percent === null ? '—' : `${r.percent}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>,
    document.body,
  )
}
