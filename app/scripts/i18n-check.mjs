// Compares the locale files (i18n.md §7): every language must have exactly the keys of English,
// the same {placeholders}, and every key used in code must exist.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const localesDir = join(root, 'src/shared/i18n/locales')
const languages = readdirSync(localesDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))

const load = (lng) => JSON.parse(readFileSync(join(localesDir, `${lng}.json`), 'utf8'))
const en = load('en')
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')

let problems = 0
const report = (message) => {
  problems += 1
  console.error(`✖ ${message}`)
}

for (const lng of languages.filter((l) => l !== 'en')) {
  const other = load(lng)
  for (const key of Object.keys(en)) {
    if (!(key in other)) report(`${lng}: missing key "${key}"`)
    else if (placeholders(en[key]) !== placeholders(other[key])) {
      report(`${lng}: "${key}" has different placeholders ({${placeholders(other[key])}} vs {${placeholders(en[key])}})`)
    }
  }
  for (const key of Object.keys(other)) if (!(key in en)) report(`${lng}: extra key "${key}" (not in en)`)
}

// Keys used in source: t('a.b'), titleKey: 'a.b', labelKey: 'a.b' ... any quoted string that equals a known key counts as used.
const sources = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) sources.push(path)
  }
}
walk(join(root, 'src'))
const code = sources.map((f) => readFileSync(f, 'utf8')).join('\n')

const missing = new Set()
for (const [, key] of code.matchAll(/\bt\(\s*'([\w.]+)'/g)) if (!(key in en)) missing.add(key)
for (const key of missing) report(`code uses "${key}" but en has no such key`)

const used = (key) => code.includes(`'${key}'`) || code.includes(`"${key}"`) || code.includes(`\`${key}`)
// Keys built from a prefix, such as t(`status.${status}`), are matched by their prefix.
const prefixes = [...code.matchAll(/`([\w.]+\.)\$\{/g)].map((m) => m[1])
const unused = Object.keys(en).filter((key) => !used(key) && !prefixes.some((p) => key.startsWith(p)))
if (unused.length > 0) {
  console.warn(`! ${unused.length} keys in en look unused (informational):`)
  for (const key of unused.slice(0, 20)) console.warn(`    ${key}`)
  if (unused.length > 20) console.warn(`    … and ${unused.length - 20} more`)
}

console.log(`Checked ${languages.length} locales (${Object.keys(en).length} keys) in ${relative(root, localesDir)}.`)
if (problems > 0) {
  console.error(`${problems} problem(s).`)
  process.exit(1)
}
console.log('i18n parity OK.')
