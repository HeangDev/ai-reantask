/**
 * Opens the browser's print window. The tab title becomes the suggested file name while it is open, so "Save as PDF"
 * offers a sensible name, and goes back afterwards.
 */
export function printWithTitle(title: string) {
  const previous = document.title
  const restore = () => {
    document.title = previous
    window.removeEventListener('afterprint', restore)
  }
  document.title = title
  window.addEventListener('afterprint', restore)
  window.print()
}
