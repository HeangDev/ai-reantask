import { extensionOf } from '@/features/assignments/lib/fileTree'
import type { AssignmentTask, CodeFile, TaskResult } from '@/features/assignments/types'
import type { TranslationKey } from '@/lib/i18n'

export type Severity = 'error' | 'warning' | 'info'

export interface Problem {
  /** Stable across runs, so a problem can be recognised after the student fixes other things. */
  key: string
  severity: Severity
  path: string
  /** 1-based. */
  line: number
  messageKey: TranslationKey
  fixKey: TranslationKey
  /** The offending line. */
  before: string
  /** The same line after the suggested fix; an empty string means "delete the line". Absent when there is no one-line fix. */
  after?: string
}

const SOURCE = new Set(['ts', 'tsx', 'js', 'jsx'])

interface LineRule {
  id: string
  severity: Severity
  messageKey: TranslationKey
  fixKey: TranslationKey
  test: (line: string) => boolean
  fix?: (line: string) => string
}

// Checks that run on every line of source code. Each one finds a common beginner problem and says how to fix it.
const LINE_RULES: LineRule[] = [
  {
    id: 'any',
    severity: 'error',
    messageKey: 'ai.anyMsg',
    fixKey: 'ai.anyFix',
    test: (line) => /(:\s*any\b|\bas any\b|<any>)/.test(line),
    fix: (line) => line.replace(/\bas any\b/g, 'as unknown').replace(/:\s*any\b/g, ': unknown').replace(/<any>/g, '<unknown>'),
  },
  {
    id: 'console',
    severity: 'warning',
    messageKey: 'ai.consoleMsg',
    fixKey: 'ai.consoleFix',
    test: (line) => /\bconsole\.(log|debug)\(/.test(line),
    fix: (line) => {
      const cleaned = line.replace(/console\.(log|debug)\([^)]*\);?\s*/g, '')
      return cleaned.trim() === '' ? '' : cleaned
    },
  },
  {
    id: 'var',
    severity: 'warning',
    messageKey: 'ai.varMsg',
    fixKey: 'ai.varFix',
    test: (line) => /^\s*var\s/.test(line),
    fix: (line) => line.replace(/^(\s*)var\s/, '$1const '),
  },
  {
    id: 'equality',
    severity: 'warning',
    messageKey: 'ai.eqMsg',
    fixKey: 'ai.eqFix',
    test: (line) => /[^=!<>]==[^=]/.test(line.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""')),
    fix: (line) => line.replace(/([^=!<>])==([^=])/g, '$1===$2'),
  },
  {
    id: 'todo',
    severity: 'info',
    messageKey: 'ai.todoMsg',
    fixKey: 'ai.todoFix',
    test: (line) => /\/\/\s*(TODO|FIXME)/i.test(line),
    fix: (line) => {
      const cleaned = line.replace(/\s*\/\/\s*(TODO|FIXME).*$/i, '')
      return cleaned.trim() === '' ? '' : cleaned
    },
  },
]

/** Reads a project and lists what a teacher would flag. Pure and instant; the panel adds the "thinking" time. */
export function analyzeProject(files: CodeFile[]): Problem[] {
  const problems: Problem[] = []

  for (const file of files) {
    if (!SOURCE.has(extensionOf(file.path))) continue
    file.code.split('\n').forEach((text, index) => {
      for (const rule of LINE_RULES) {
        if (!rule.test(text)) continue
        problems.push({
          key: `${rule.id}|${file.path}|${text.trim()}`,
          severity: rule.severity,
          path: file.path,
          line: index + 1,
          messageKey: rule.messageKey,
          fixKey: rule.fixKey,
          before: text,
          after: rule.fix?.(text),
        })
      }
    })
  }

  const manifest = files.find((f) => f.path === 'package.json')
  if (manifest) {
    try {
      const scripts = (JSON.parse(manifest.code) as { scripts?: Record<string, string> }).scripts ?? {}
      if (!scripts.test) {
        const line = manifest.code.split('\n').findIndex((l) => l.includes('"scripts"')) + 1
        problems.push({
          key: 'test|package.json',
          severity: 'info',
          path: 'package.json',
          line: Math.max(line, 1),
          messageKey: 'ai.testMsg',
          fixKey: 'ai.testFix',
          before: manifest.code.split('\n')[Math.max(line, 1) - 1] ?? '',
        })
      }
    } catch {
      // A package.json that does not parse is its own problem, but not one this checker reports.
    }
  }

  if (!files.some((f) => f.path.toLowerCase() === 'readme.md')) {
    problems.push({
      key: 'readme|project',
      severity: 'info',
      path: files[0]?.path ?? '',
      line: 1,
      messageKey: 'ai.readmeMsg',
      fixKey: 'ai.readmeFix',
      before: files[0]?.code.split('\n')[0] ?? '',
    })
  }

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 }
  return problems.sort((a, b) => order[a.severity] - order[b.severity] || a.path.localeCompare(b.path) || a.line - b.line)
}

/** Which of the earlier problems are gone from the new version. */
export function compareRuns(before: Problem[], after: Problem[]) {
  const remainingKeys = new Set(after.map((p) => p.key))
  const remaining = before.filter((p) => remainingKeys.has(p.key))
  return { fixed: before.length - remaining.length, remaining }
}

export interface TaskIssue {
  id: string
  title: string
  /** incorrect: the teacher marked it wrong. incomplete: not done, or not marked correct yet. */
  status: 'incorrect' | 'incomplete'
}

/** Tasks that are not complete and correct for a student. Only tasks marked correct pass. */
export function taskIssues(tasks: AssignmentTask[], results?: Record<string, TaskResult>): TaskIssue[] {
  return tasks.flatMap((task) => {
    const result = results?.[task.id]
    if (result === 'correct') return []
    return [{ id: task.id, title: task.title, status: result === 'incorrect' ? ('incorrect' as const) : ('incomplete' as const) }]
  })
}
