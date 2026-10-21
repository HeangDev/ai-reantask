import { Avatar } from '@/shared/components/Avatar'
import { focusRing } from './constants'

interface Props {
  name: string
  subtitle: string
  showAvatar: boolean
  avatarSrc?: string | null
  readOnly: boolean
  onOpen: () => void
}

/** The person column: avatar, name (a button that opens the row) and a subtitle line. */
export function PrimaryCell({ name, subtitle, showAvatar, avatarSrc, readOnly, onOpen }: Props) {
  return (
    <td className="px-3 py-3">
      <div className="flex items-center gap-3">
        {showAvatar && <Avatar name={name} src={avatarSrc} />}
        <div className="min-w-0">
          {readOnly ? (
            <p className="truncate font-medium">{name}</p>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpen()
              }}
              className={`block max-w-full truncate rounded font-medium hover:underline ${focusRing}`}
            >
              {name}
            </button>
          )}
          <p className="truncate text-[11px] text-muted">{subtitle}</p>
        </div>
      </div>
    </td>
  )
}
