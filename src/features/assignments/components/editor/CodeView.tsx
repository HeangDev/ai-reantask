import { useEffect, useMemo, useRef } from 'react'
import { highlightLine, tokenClass } from '@/features/assignments/lib/syntax'

interface Props {
  code: string
  extension: string
  /** The line the cursor is on, 1-based. */
  currentLine: number
  onSelectLine: (line: number) => void
  /** Changes whenever the current line should be scrolled into view (for example after jumping to a problem). */
  revealToken?: number
}

/** Read-only editor surface: line-number gutter, coloured code, and a highlighted current line. */
export default function CodeView({ code, extension, currentLine, onSelectLine, revealToken }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code])
  const tokens = useMemo(() => lines.map((line) => highlightLine(line, extension)), [lines, extension])

  useEffect(() => {
    if (revealToken) container.current?.querySelector(`[data-line="${currentLine}"]`)?.scrollIntoView({ block: 'center' })
    // Only a new token should scroll; clicking a line must not move the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealToken])

  return (
    <div ref={container} className="min-h-0 flex-1 overflow-auto bg-surface font-mono text-[13px] leading-6">
      <div className="min-w-max py-2" role="presentation">
        {tokens.map((lineTokens, i) => {
          const line = i + 1
          const current = line === currentLine
          return (
            <div
              key={i}
              data-line={line}
              onClick={() => onSelectLine(line)}
              className={`flex cursor-text ${current ? 'bg-accent-soft' : 'hover:bg-hover/60'}`}
            >
              <span
                className={`sticky left-0 w-14 shrink-0 select-none pr-4 text-right ${
                  current ? 'bg-accent-soft font-semibold text-fg' : 'bg-surface text-muted'
                }`}
                aria-hidden="true"
              >
                {line}
              </span>
              <span className="whitespace-pre pr-6">
                {lineTokens.length === 0 || lines[i] === '' ? ' ' : null}
                {lineTokens.map((token, j) => (
                  <span key={j} className={tokenClass[token.kind]}>
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
