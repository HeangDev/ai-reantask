import { motion, useReducedMotion } from 'motion/react'
import GradientBanner from '@/components/ui/GradientBanner'
import { EditIcon, SubjectIcon, TrashIcon } from '@/components/ui/icons'
import StatusBadge from '@/components/ui/StatusBadge'
import Switch from '@/components/ui/Switch'
import type { Subject } from '@/features/subjects/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  subject: Subject
  teacherCount: number
  onToggleStatus: () => void
  onEdit: () => void
  onDelete: () => void
  /** Position in the grid, used to stagger the entrance. */
  index?: number
}

const bannerButton =
  'rounded-lg bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/35 focus-visible:outline-2 focus-visible:outline-white [&>svg]:h-4 [&>svg]:w-4'

export default function SubjectCard({ subject: s, teacherCount, onToggleStatus, onEdit, onDelete, index = 0 }: Props) {
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
        s.status === 'inactive' ? 'opacity-80' : ''
      }`}
    >
      <GradientBanner
        colorKey={s.id}
        title={s.name}
        icon={<SubjectIcon />}
        actions={
          <div className="flex gap-1">
            <button type="button" onClick={onEdit} aria-label={`${t('stu.edit')}: ${s.name}`} className={bannerButton}>
              <EditIcon />
            </button>
            <button type="button" onClick={onDelete} aria-label={`${t('stu.delete')}: ${s.name}`} className={bannerButton}>
              <TrashIcon />
            </button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="line-clamp-2 min-h-10 text-sm text-muted">{s.description}</p>

        <dl>
          <div className="rounded-lg bg-sunken p-3">
            <dt className="text-xs text-muted">{t('sub.statTeachers')}</dt>
            <dd className="mt-0.5 text-xl font-bold leading-none">{teacherCount}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line bg-sunken px-4 py-3">
        <StatusBadge status={s.status} />
        <Switch
          checked={s.status === 'active'}
          onChange={onToggleStatus}
          label={t('cls.toggleStatus', { name: s.name })}
        />
      </div>
    </motion.li>
  )
}
