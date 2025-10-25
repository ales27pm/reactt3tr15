module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/src/design-system/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/.expo"],
};
