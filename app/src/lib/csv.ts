const escapeCell = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Rows as CSV text. */
export const toCsv = (rows: (string | number)[][]) => rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')

/** Saves text as a file in the browser. The byte-order mark lets Excel read Khmer and Korean correctly. */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
