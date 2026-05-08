export default {
  testMatch: ['**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],
  transform: {
    '^.+\\.(js|tsx?)$': 'babel-jest',
  },
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/(?!@odh-dashboard)'],
  coverageDirectory: 'jest-coverage',
  coverageReporters: ['json', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/*.spec.{ts,tsx}',
  ],
};
