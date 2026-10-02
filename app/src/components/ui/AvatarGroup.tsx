import Avatar from '@/components/ui/Avatar'

interface Props {
  /** Full names, in the order they should appear. */
  names: string[]
  /** How many avatars to show before collapsing the rest into "+N". */
  max?: number
  /** Spoken description of the group, since the avatars themselves are decorative. */
  label: string
}

/** Overlapping avatars with a "+N" counter for the people who don't fit. */
export default function AvatarGroup({ names, max = 3, label }: Props) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length

  return (
    <span role="img" aria-label={label} title={names.join(', ')} className="flex shrink-0 items-center -space-x-1.5">
      {shown.map((name) => (
        <span key={name} className="rounded-full ring-2 ring-surface">
          <Avatar name={name} size="sm" />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="relative flex h-6 min-w-6 items-center justify-center rounded-full bg-sunken px-1 text-[10px] font-semibold text-muted ring-2 ring-surface"
          aria-hidden="true"
        >
          +{extra}
        </span>
      )}
    </span>
  )
}
