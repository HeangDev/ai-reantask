import type { ReactNode } from 'react'

// Full class names so Tailwind can see them.
const palettes = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-blue-500 to-indigo-500',
]

const paletteFor = (key: string) =>
  palettes[[...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length]

interface Props {
  /** Decides the colour, so an item keeps the same one. */
  colorKey: string
  title: string
  /** Small chip at the top left, such as a subject. */
  badge?: string
  /** Icon tile at the top left, used when there is no badge. */
  icon?: ReactNode
  /** Buttons placed at the top right. */
  actions?: ReactNode
}

/** Coloured card header: a chip or icon and the actions on top, the title at the bottom. */
export default function GradientBanner({ colorKey, title, badge, icon, actions }: Props) {
  return (
    <div className={`relative flex h-28 flex-col justify-between bg-linear-to-br p-4 text-white ${paletteFor(colorKey)}`}>
      <div className="flex items-start justify-between gap-2">
        {badge ? (
          <span className="max-w-full truncate rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
            {badge}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm [&>svg]:h-4 [&>svg]:w-4"
          >
            {icon}
          </span>
        )}
        {actions}
      </div>
      <h3 className="truncate text-lg font-semibold drop-shadow-sm">{title}</h3>
    </div>
  )
}
