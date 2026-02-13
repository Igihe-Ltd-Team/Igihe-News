const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testTimeout: 10000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
// We need to modify the config to handle MSW's ESM dependencies
module.exports = async () => {
  const nextJestConfig = await createJestConfig(customJestConfig)()
  
  return {
    ...nextJestConfig,
    // Override transformIgnorePatterns to handle MSW and its ESM dependencies
    transformIgnorePatterns: [
      '/node_modules/(?!(msw|@mswjs|@bundled-es-modules|until-async|is-node-process|strict-event-emitter|@open-draft|statuses|headers-polyfill|outvariant)/)',
    ],
  }
}