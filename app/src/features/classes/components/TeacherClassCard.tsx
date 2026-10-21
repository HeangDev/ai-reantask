import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { GradientBanner } from '@/shared/components/GradientBanner'
import { ChevronRightIcon, ClassIcon, MailIcon } from '@/shared/components/icons'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { ClassOverview } from '@/features/classes/hooks/useClassOverview'
import type { SchoolClass } from '@/features/classes/types'
import { paths } from '@/shared/config/paths'
import { useI18n } from '@/shared/i18n'

interface Props {
  schoolClass: SchoolClass
  overview: ClassOverview
  onInvite: () => void
  /** Position in the grid, used to stagger the entrance. */
  index?: number
}

/** A class as the teacher sees it: its name, subject and how many students it has. */
export function TeacherClassCard({ schoolClass: c, overview, onInvite, index = 0 }: Props) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduceMotion ? 0 : index * 0.05 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      className={`flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md ${
        c.status === 'inactive' ? 'opacity-80' : ''
      }`}
    >
      <GradientBanner colorKey={c.id} title={c.name} icon={<ClassIcon />} />

      <dl className="grid flex-1 grid-cols-2 gap-3 p-4">
        <div className="min-w-0 rounded-lg bg-sunken p-3">
          <dt className="text-xs text-muted">{t('tch.subject')}</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold" title={overview.subject || undefined}>
            {overview.subject || '—'}
          </dd>
        </div>
        <div className="rounded-lg bg-sunken p-3">
          <dt className="text-xs text-muted">{t('cls.totalStudents')}</dt>
          <dd className="mt-0.5 text-xl font-bold leading-none">{overview.totalStudents}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-2 border-t border-line bg-sunken px-4 py-3">
        <StatusBadge status={c.status} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onInvite}
            aria-haspopup="dialog"
            aria-label={`${t('cls.invite')}: ${c.name}`}
            title={t('cls.invite')}
            className="rounded-lg border border-line bg-surface p-2 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
          >
            <MailIcon />
          </button>
          <Link
            to={paths.classDetail(c.id)}
            aria-label={`${t('cdet.open')}: ${c.name}`}
            className="flex items-center gap-1.5 rounded-lg bg-accent-strong px-3 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
          >
            {t('cdet.open')}
            <ChevronRightIcon />
          </Link>
        </div>
      </div>
    </motion.li>
  )
}
