module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/**/__tests__/**/*.(test|spec).{ts,tsx,js,jsx}"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/.expo"],
};
