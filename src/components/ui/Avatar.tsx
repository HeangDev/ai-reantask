import { StudentsIcon } from '@/components/ui/icons'

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

/** Initials in a soft accent circle; decorative because the name is always next to it. */
export default function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const dimension =
    size === 'sm' ? 'h-6 w-6 text-[10px] [&>svg]:h-3 [&>svg]:w-3' : size === 'xl' ? 'h-20 w-20 text-2xl [&>svg]:h-8 [&>svg]:w-8' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs'
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-fg ${dimension}`}
      aria-hidden="true"
    >
      {initials(name) || <StudentsIcon />}
    </span>
  )
}
