module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/**/__tests__/**/*.(test|spec).{ts,tsx,js,jsx}"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/.expo"],
};
