// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

import { resolve } from 'node:path';

const configDir = import.meta.dirname;

export default {
  testMatch: ['**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],

  transform: {
    '^.+\\.(js|tsx?)$': [
      'babel-jest',
      { targets: 'current node', envName: 'test', rootMode: 'upward' },
    ],
  },

  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': resolve(configDir, 'config/transform.style.js'),
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': resolve(
      configDir,
      'config/transform.file.js',
    ),
    '^monaco-editor$': resolve(configDir, 'config/transform.file.js'),
  },

  testEnvironment: 'jest-environment-jsdom',

  transformIgnorePatterns: [
    'node_modules/(?!yaml|@openshift|lodash-es|uuid|@patternfly|d3|delaunator|robust-predicates|internmap|monaco-editor)',
  ],

  setupFilesAfterEnv: [resolve(configDir, 'config/jest.setup.ts')],

  coverageDirectory: 'jest-coverage',

  coverageReporters: ['json', 'lcov'],

  collectCoverageFrom: [
    'extensions.ts',
    'extensions/**/*.{ts,tsx}',
    'extension-points.ts',
    'extension-points/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '!upstream/**',
    '!src/third_party/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/*.spec.{ts,tsx}',
  ],
};
