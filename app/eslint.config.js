import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import i18next from 'eslint-plugin-i18next'
import jest from 'eslint-plugin-jest'

// Features other code may depend on only through their public `index.ts` (architecture.md §4).
const FEATURES = [
  'account',
  'assignments',
  'auth',
  'classes',
  'dashboard',
  'integrations',
  'notifications',
  'reports',
  'search',
  'submissions',
  'settings',
  'students',
  'subjects',
  'tasks',
  'teachers',
  'users',
]

export default defineConfig(
  { ignores: ['dist', 'coverage', 'node_modules', '*.config.js', '*.config.ts', 'jest.config.cjs'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y, import: importPlugin, i18next },
    settings: {
      react: { version: 'detect' },
      'import/extensions': ['.ts', '.tsx', '.js', '.jsx'],
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.json' }, node: true },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',
      'react/prop-types': 'off',
      'react/no-array-index-key': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/function-component-definition': ['error', { namedComponents: ['function-declaration', 'arrow-function'], unnamedComponents: 'arrow-function' }],

      // coding-standards.md §1: no `any`, no non-null assertion, no enum.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'Use an `as const` object and a union type instead of enum.' },
        { selector: 'ExportDefaultDeclaration', message: 'Use named exports.' },
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: 'Needs DOMPurify and review (security.md §3).' },
      ],
      'no-restricted-globals': ['error', { name: 'confirm', message: 'Use ConfirmDialog, not window.confirm.' }],
      'no-console': 'error',

      // architecture.md §4: dependencies flow app -> features -> shared.
      'import/no-cycle': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            { target: './src/shared', from: './src/features', message: 'shared must not import from features.' },
            { target: './src/shared', from: './src/app', message: 'shared must not import from app.' },
            { target: './src/features', from: './src/app', message: 'features must not import from app.' },
          ],
        },
      ],

      // i18n.md §6: no user-facing hardcoded strings.
      // Tailwind class names such as border-red-500 are not prose.
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          words: { exclude: ['^(?:[a-z0-9]+[-:/])+[a-z0-9./%]+$', '^[\\s\\d.,:;()·•%/+−–—|↵↑↓…-]*$'] },
          'jsx-attributes': { include: ['aria-label', 'title', 'placeholder', 'alt'] },
        },
      ],
      'jsx-a11y/label-has-associated-control': ['error', { depth: 5 }],

      // The component and hook files are small and typed; these strict rules are noisy for event handlers.
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true, ignoreVoidOperator: true }],
    },
  },
  // A file may import another feature only through its index.ts (architecture.md §4).
  ...[
    ...FEATURES.map((name) => ({ files: [`src/features/${name}/**/*.{ts,tsx}`], own: [`!@/features/${name}/**`] })),
    { files: ['src/app/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'], own: [] },
  ].map(({ files, own }) => ({
    files,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['../../*'], message: 'Use the @/ alias instead of deep relative imports.' },
            { group: ['@/features/*/**', ...own], message: 'Import another feature only through its index.ts.' },
          ],
        },
      ],
    },
  })),
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    plugins: { jest },
    languageOptions: { globals: { ...globals.jest } },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/no-focused-tests': 'error',
      'jest/no-disabled-tests': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'i18next/no-literal-string': 'off',
      'no-restricted-syntax': 'off',
    },
  },
)
