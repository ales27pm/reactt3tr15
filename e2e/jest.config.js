module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 120000,
  reporters: ["detox/runners/jest/streamlineReporter"],
  setupFilesAfterEnv: ["./setup.ts"],
  testRegex: "\\.e2e\\.ts$",
};
