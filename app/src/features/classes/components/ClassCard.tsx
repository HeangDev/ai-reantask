import { motion, useReducedMotion } from 'motion/react'
import GradientBanner from '@/components/ui/GradientBanner'
import { ClassIcon, EditIcon, TrashIcon, UsersIcon } from '@/components/ui/icons'
import StatusBadge from '@/components/ui/StatusBadge'
import Switch from '@/components/ui/Switch'
import CopyCodeButton from '@/features/classes/components/CopyCodeButton'
import type { SchoolClass } from '@/features/classes/types'
import { formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  schoolClass: SchoolClass
  studentCount: number
  assignmentCount: number
  onToggleStatus: () => void
  /** Left out for roles that may not add students to a class. */
  onAddStudents?: () => void
  onEdit: () => void
  onDelete: () => void
  /** Position in the grid, used to stagger the entrance. */
  index?: number
}

const bannerButton =
  'rounded-lg bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/35 focus-visible:outline-2 focus-visible:outline-white [&>svg]:h-4 [&>svg]:w-4'

export default function ClassCard({ schoolClass: c, studentCount, assignmentCount, onToggleStatus, onAddStudents, onEdit, onDelete, index = 0 }: Props) {
  const { t, locale } = useI18n()
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
      <GradientBanner
        colorKey={c.id}
        title={c.name}
        icon={<ClassIcon />}
        actions={
          <div className="flex gap-1">
            <button type="button" onClick={onEdit} aria-label={`${t('stu.edit')}: ${c.name}`} className={bannerButton}>
              <EditIcon />
            </button>
            <button type="button" onClick={onDelete} aria-label={`${t('stu.delete')}: ${c.name}`} className={bannerButton}>
              <TrashIcon />
            </button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="line-clamp-2 min-h-10 text-sm text-muted">{c.description}</p>
        <p className="-mt-2 text-xs text-muted">
          {formatDate(c.startDate, locale)} – {formatDate(c.endDate, locale)}
        </p>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-sunken p-3">
            <dt className="text-xs text-muted">{t('cls.statStudents')}</dt>
            <dd className="mt-0.5 text-xl font-bold leading-none">{studentCount}</dd>
          </div>
          <div className="rounded-lg bg-sunken p-3">
            <dt className="text-xs text-muted">{t('cls.statAssignments')}</dt>
            <dd className="mt-0.5 text-xl font-bold leading-none">{assignmentCount}</dd>
          </div>
        </dl>

        <div
          title={t('cls.codeHint')}
          className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-line px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-[11px] text-muted">{t('cls.code')}</p>
            <p className="font-mono text-sm font-semibold tracking-widest">{c.code}</p>
          </div>
          <CopyCodeButton code={c.code} />
        </div>

        {onAddStudents && (
          <button
            type="button"
            onClick={onAddStudents}
            aria-haspopup="dialog"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
          >
            <UsersIcon />
            {t('cls.addStudents')}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line bg-sunken px-4 py-3">
        <StatusBadge status={c.status} />
        <Switch
          checked={c.status === 'active'}
          onChange={onToggleStatus}
          label={t('cls.toggleStatus', { name: c.name })}
        />
      </div>
    </motion.li>
  )
}
