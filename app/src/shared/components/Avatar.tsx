import { useState } from 'react'
import { StudentsIcon } from '@/shared/components/icons'

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

// Only web addresses are drawn; anything else (javascript:, data:) is ignored and the initials show.
const isWebUrl = (value: string) => /^https?:\/\//i.test(value)

/**
 * The person's photo when `src` is a web address that loads, otherwise initials in a soft accent circle.
 * Decorative because the name is always next to it.
 */
export function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const dimension =
    size === 'sm' ? 'h-6 w-6 text-[10px] [&>svg]:h-3 [&>svg]:w-3' : size === 'xl' ? 'h-20 w-20 text-2xl [&>svg]:h-8 [&>svg]:w-8' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs'
  const photo = src && isWebUrl(src) && src !== failedSrc ? src : null

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent-fg ${dimension}`}
      aria-hidden="true"
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(photo)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name) || <StudentsIcon />
      )}
    </span>
  )
}
