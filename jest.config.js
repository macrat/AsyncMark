module.exports = {
  testMatch: [
    '<rootDir>/test/**/*.+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
