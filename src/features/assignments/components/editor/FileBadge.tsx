import { extensionOf } from '@/features/assignments/lib/fileTree'

const badges: Record<string, { label: string; tone: string }> = {
  ts: { label: 'TS', tone: 'text-blue-600 dark:text-blue-400' },
  tsx: { label: 'TS', tone: 'text-blue-600 dark:text-blue-400' },
  js: { label: 'JS', tone: 'text-yellow-600 dark:text-yellow-400' },
  jsx: { label: 'JS', tone: 'text-yellow-600 dark:text-yellow-400' },
  json: { label: '{}', tone: 'text-amber-600 dark:text-amber-400' },
  css: { label: '#', tone: 'text-purple-600 dark:text-purple-400' },
  html: { label: '<>', tone: 'text-orange-600 dark:text-orange-400' },
  md: { label: 'M↓', tone: 'text-slate-500 dark:text-slate-400' },
}

/** A tiny coloured label for a file type, like the icons in a code editor's explorer. */
export default function FileBadge({ path }: { path: string }) {
  const badge = badges[extensionOf(path)] ?? { label: '·', tone: 'text-muted' }
  return (
    <span className={`w-5 shrink-0 text-center text-[10px] font-bold leading-none ${badge.tone}`} aria-hidden="true">
      {badge.label}
    </span>
  )
}
