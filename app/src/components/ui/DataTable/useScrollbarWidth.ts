import { useLayoutEffect, useRef, useState } from 'react'

/** Width of the body's scrollbar (0 when it fits), so the header can leave the same space and stay aligned. */
export function useScrollbarWidth() {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const measure = () => setScrollbarWidth(body.offsetWidth - body.clientWidth)
    measure()
    // Fires when the scrollbar appears or disappears, because that changes the content width.
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [])

  return { bodyRef, scrollbarWidth }
}
