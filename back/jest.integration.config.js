module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/auth.integration.test.js"],
  setupFiles: ["<rootDir>/tests/helpers/loadTestEnv.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/helpers/jestSetup.js"],
  maxWorkers: 1,
};
