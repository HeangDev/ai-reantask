export type TokenKind = 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'function' | 'tag' | 'key' | 'heading'

export interface Token {
  text: string
  kind: TokenKind
}

// A small line-by-line highlighter for the file types students hand in. It colours the common
// shapes (comments, strings, keywords, numbers) rather than parsing the language, which is enough
// for reading a project and avoids shipping a full highlighter library.

const SCRIPT_KEYWORDS = new Set([
  'import', 'export', 'default', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'new', 'class', 'extends', 'interface', 'type', 'async', 'await', 'true', 'false', 'null', 'undefined', 'typeof',
  'as', 'of', 'in', 'switch', 'case', 'break', 'throw', 'try', 'catch',
])

const SCRIPT_PATTERN =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b(\s*\()?/g
const JSON_PATTERN = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(-?\d+(?:\.\d+)?)\b|\b(true|false|null)\b/g
const CSS_PATTERN = /(\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:rem|px|em|%|vh|vw)?)|(^\s*[a-z-]+)(?=\s*:)/g
const HTML_PATTERN = /(<!--.*?-->)|("(?:[^"\\]|\\.)*")|(<\/?[A-Za-z][\w-]*|\/?>)/g

function scan(line: string, pattern: RegExp, classify: (match: RegExpExecArray) => Token[]): Token[] {
  const tokens: Token[] = []
  let last = 0
  pattern.lastIndex = 0
  for (let match = pattern.exec(line); match; match = pattern.exec(line)) {
    if (match.index > last) tokens.push({ text: line.slice(last, match.index), kind: 'plain' })
    tokens.push(...classify(match))
    last = match.index + match[0].length
    if (match[0].length === 0) pattern.lastIndex += 1
  }
  if (last < line.length) tokens.push({ text: line.slice(last), kind: 'plain' })
  return tokens
}

function script(line: string): Token[] {
  return scan(line, SCRIPT_PATTERN, (m) => {
    if (m[1]) return [{ text: m[1], kind: 'comment' }]
    if (m[2]) return [{ text: m[2], kind: 'string' }]
    if (m[3]) return [{ text: m[3], kind: 'number' }]
    const word = m[4]
    const call = m[5] ?? ''
    const kind: TokenKind = SCRIPT_KEYWORDS.has(word)
      ? 'keyword'
      : call
        ? 'function'
        : /^[A-Z]/.test(word)
          ? 'type'
          : 'plain'
    return [{ text: word, kind }, ...(call ? [{ text: call, kind: 'plain' as const }] : [])]
  })
}

function json(line: string): Token[] {
  return scan(line, JSON_PATTERN, (m) => {
    if (m[1]) {
      const tokens: Token[] = [{ text: m[1], kind: m[2] ? 'key' : 'string' }]
      if (m[2]) tokens.push({ text: m[2], kind: 'plain' })
      return tokens
    }
    if (m[3]) return [{ text: m[3], kind: 'number' }]
    return [{ text: m[4], kind: 'keyword' }]
  })
}

function css(line: string): Token[] {
  return scan(line, CSS_PATTERN, (m) => {
    if (m[1]) return [{ text: m[1], kind: 'comment' }]
    if (m[2]) return [{ text: m[2], kind: 'string' }]
    if (m[3]) return [{ text: m[3], kind: 'number' }]
    return [{ text: m[4], kind: 'key' }]
  })
}

function html(line: string): Token[] {
  return scan(line, HTML_PATTERN, (m) => {
    if (m[1]) return [{ text: m[1], kind: 'comment' }]
    if (m[2]) return [{ text: m[2], kind: 'string' }]
    return [{ text: m[3], kind: 'tag' }]
  })
}

export function highlightLine(line: string, extension: string): Token[] {
  switch (extension) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return script(line)
    case 'json':
      return json(line)
    case 'css':
      return css(line)
    case 'html':
      return html(line)
    case 'md':
      return [{ text: line, kind: /^#{1,6}\s/.test(line) ? 'heading' : 'plain' }]
    default:
      return [{ text: line, kind: 'plain' }]
  }
}

export const tokenClass: Record<TokenKind, string> = {
  plain: '',
  keyword: 'text-purple-600 dark:text-purple-400',
  string: 'text-emerald-700 dark:text-emerald-400',
  comment: 'italic text-slate-500 dark:text-slate-500',
  number: 'text-amber-600 dark:text-amber-400',
  type: 'text-sky-700 dark:text-sky-300',
  function: 'text-blue-600 dark:text-blue-300',
  tag: 'text-rose-600 dark:text-rose-400',
  key: 'text-sky-700 dark:text-sky-300',
  heading: 'font-bold text-blue-600 dark:text-blue-300',
}

export const languageNames: Record<string, string> = {
  tsx: 'TypeScript React',
  ts: 'TypeScript',
  jsx: 'JavaScript React',
  js: 'JavaScript',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  md: 'Markdown',
}
