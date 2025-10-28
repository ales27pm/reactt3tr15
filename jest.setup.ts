import "@testing-library/jest-native/extend-expect";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("sentry-expo", () => {
  const createScope = () => ({
    setTag: jest.fn(),
    setContext: jest.fn(),
    setExtra: jest.fn(),
    setUser: jest.fn(),
  });

  return {
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    configureScope: jest.fn((callback) => {
      if (typeof callback === "function") {
        callback(createScope());
      }
    }),
    withScope: jest.fn((callback) => {
      if (typeof callback === "function") {
        callback(createScope());
      }
    }),
    Native: {
      captureException: jest.fn(),
      captureEvent: jest.fn(),
      captureMessage: jest.fn(),
    },
  };
});
