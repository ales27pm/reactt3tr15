import "@testing-library/jest-native/extend-expect";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("sentry-expo", () => ({
  init: jest.fn(),
  Native: {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
    configureScope: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
  },
}));
