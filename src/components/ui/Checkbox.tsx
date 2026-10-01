import type { InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean
}

export default function Checkbox({ indeterminate = false, className = '', ...props }: Props) {
  return (
    <input
      type="checkbox"
      className={`ui-checkbox ${className}`}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate
      }}
      {...props}
    />
  )
}
