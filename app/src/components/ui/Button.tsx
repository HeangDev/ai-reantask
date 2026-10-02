import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'md' | 'sm'
}

const sizes = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
}

export default function Button({ size = 'md', className = '', ...props }: Props) {
  return (
    <button
      className={`rounded-lg bg-accent-strong font-medium text-white shadow-sm transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
