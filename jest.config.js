/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/engine/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^engine/(.*)$': '<rootDir>/engine/$1',
  },
};
