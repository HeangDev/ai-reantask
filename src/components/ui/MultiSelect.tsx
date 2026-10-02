import { useId } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import { CloseIcon } from '@/components/ui/icons'

export interface MultiSelectOption {
  value: string
  label: string
}

interface Props {
  label: string
  /** Shown in the select while nothing is being picked. */
  placeholder: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  /** Shown instead of the select when there is nothing to choose from. */
  emptyText: string
  removeLabel: (name: string) => string
}

/** Choose several options: a select adds one at a time, and each choice shows as a chip that can be removed. */
export default function MultiSelect({ label, placeholder, options, value, onChange, emptyText, removeLabel }: Props) {
  const id = useId()
  const chosen = options.filter((o) => value.includes(o.value))
  const available = options.filter((o) => !value.includes(o.value))

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-1">
        {options.length === 0 ? (
          <p className="rounded-lg border border-line bg-sunken px-3 py-2 text-sm text-muted">{emptyText}</p>
        ) : (
          <Dropdown
            id={id}
            className="py-2"
            wrapperClassName="block w-full"
            value=""
            placeholder={placeholder}
            options={available}
            onChange={(next) => next && onChange([...value, next])}
          />
        )}
      </div>

      {chosen.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {chosen.map((o) => (
            <li
              key={o.value}
              className="flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-xs font-medium text-accent-fg"
            >
              {o.label}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== o.value))}
                aria-label={removeLabel(o.label)}
                className="rounded-full p-0.5 transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-3 [&>svg]:w-3"
              >
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
