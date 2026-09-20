module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/*.integration.test.ts"],
  setupFiles: ["<rootDir>/tests/helpers/loadTestEnv.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/helpers/jestSetup.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.tests.json" }],
  },
  maxWorkers: 1,
};
