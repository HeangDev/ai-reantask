/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-fixed-jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  // Some of MSW's dependencies ship ES modules only; they are compiled for Jest like the app code.
  transformIgnorePatterns: ['/node_modules/(?!(msw|@mswjs|@open-draft|@tanstack|rettime|until-async|headers-polyfill|strict-event-emitter|outvariant|is-node-process)/)'],
  moduleNameMapper: {
    // import.meta.env only exists in Vite; tests get a fixed config instead.
    '^@/shared/config/env$': '<rootDir>/src/test/mocks/env.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/test/**',
    '!src/**/index.ts',
    '!src/**/types/**',
    '!src/**/data/**',
    '!src/shared/components/icons.tsx',
  ],
  coverageThreshold: {
    // Guard rails from testing.md §8; raise them as coverage grows.
    './src/shared/lib/': { lines: 90, branches: 85 },
    './src/features/submissions/domain/': { lines: 90, branches: 85 },
  },
}
