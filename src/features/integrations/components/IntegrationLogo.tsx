import type { ReactNode } from 'react'
import type { IntegrationId } from '@/features/integrations/types'

const logos: Record<IntegrationId, ReactNode> = {
  github: (
    <path
      fill="currentColor"
      d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"
    />
  ),
  gitlab: (
    <>
      <path fill="#E24329" d="M12 21.6 16.1 9H7.9z" />
      <path fill="#FC6D26" d="M12 21.6 7.9 9H2.2z" />
      <path fill="#FCA326" d="M2.2 9l-1 3.1a.7.7 0 0 0 .26.8L12 21.6z" />
      <path fill="#E24329" d="M2.2 9h5.7L5.4 1.5a.35.35 0 0 0-.66 0z" />
      <path fill="#FC6D26" d="M12 21.6 16.1 9h5.7z" />
      <path fill="#FCA326" d="m21.8 9 1 3.1a.7.7 0 0 1-.26.8L12 21.6z" />
      <path fill="#E24329" d="M21.8 9h-5.7l2.5-7.5a.35.35 0 0 1 .66 0z" />
    </>
  ),
  bitbucket: (
    <path
      fill="#2684FF"
      fillRule="evenodd"
      d="M2.6 3a.7.7 0 0 0-.7.82l2.9 17.6a.95.95 0 0 0 .93.79h13.9a.7.7 0 0 0 .7-.59l2.9-17.8a.7.7 0 0 0-.7-.82zm11.9 12.2H9.6L8.3 8.5h7.5z"
    />
  ),
}

export default function IntegrationLogo({ id, className = 'h-6 w-6' }: { id: IntegrationId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {logos[id]}
    </svg>
  )
}
