module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.test.js"],
  testMatch: ["<rootDir>/src/tests/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "setup.test.js"],
  clearMocks: true
};
