import type { ReactNode } from 'react'
import { CheckIcon, EditIcon, TrashIcon } from '@/components/ui/icons'

export type NotificationVariant = 'success' | 'info' | 'danger'

const variants: Record<NotificationVariant, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CheckIcon />,
    className: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  info: {
    icon: <EditIcon />,
    className: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  },
  danger: {
    icon: <TrashIcon />,
    className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  },
}

/** Rounded icon tile that tells added/connected, updated and deleted apart at a glance. */
export default function NotificationIcon({ variant }: { variant: NotificationVariant }) {
  const { icon, className } = variants[variant]

  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4 ${className}`}
    >
      {icon}
    </span>
  )
}
