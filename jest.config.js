module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.spec.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/messaging/rabbitmq.ts",
    "!src/database/data-source.ts"
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 35, functions: 70, lines: 80 }
  }
};
