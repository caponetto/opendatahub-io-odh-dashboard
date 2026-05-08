module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'jest-coverage',
  coverageReporters: ['json', 'lcov'],
  collectCoverageFrom: ['**/*.js', '!**/__tests__/**', '!node_modules/**', '!config/**'],
};
