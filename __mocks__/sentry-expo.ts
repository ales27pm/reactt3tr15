const createScope = () => ({
  setTag: jest.fn(),
  setContext: jest.fn(),
  setExtra: jest.fn(),
  setUser: jest.fn(),
});

type Scope = ReturnType<typeof createScope>;
type ScopeCallback = (scope: Scope) => void;

type MaybeCallback = ScopeCallback | undefined;

export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();

export const configureScope = jest.fn((callback?: MaybeCallback) => {
  if (typeof callback === "function") {
    callback(createScope());
  }
});

export const withScope = jest.fn((callback?: MaybeCallback) => {
  if (typeof callback === "function") {
    callback(createScope());
  }
});

export const Native = {
  captureException: jest.fn(),
  captureEvent: jest.fn(),
  captureMessage: jest.fn(),
};

export default {
  init,
  captureException,
  captureMessage,
  configureScope,
  withScope,
  Native,
};
