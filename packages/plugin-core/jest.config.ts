export default {
  testMatch: ['**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],

  transform: {
    '^.+\\.(js|tsx?)$': 'babel-jest',
  },

  testEnvironment: 'jsdom',

  transformIgnorePatterns: ['node_modules/(?!@odh-dashboard|lodash-es)'],

  coverageDirectory: 'jest-coverage',

  coverageReporters: ['json', 'lcov'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/*.spec.{ts,tsx}',
  ],
};
