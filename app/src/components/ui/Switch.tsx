import { motion } from 'motion/react'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export default function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        checked ? 'justify-end bg-accent-strong' : 'justify-start bg-line'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="h-5 w-5 rounded-full bg-white shadow"
      />
    </button>
  )
}
