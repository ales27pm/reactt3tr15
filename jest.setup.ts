import "@testing-library/jest-native/extend-expect";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

type ScopeSnapshot = {
  tags: Record<string, string>;
  extras: Record<string, unknown>;
};

type Breadcrumb = {
  category?: string;
  level?: string;
  message?: string;
  data?: Record<string, unknown>;
};

type CapturedError = {
  error: unknown;
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> };
};

type CapturedMessage = {
  message: string;
  context?: { level?: string; extras?: Record<string, unknown> };
};

type Scope = {
  setTag: jest.Mock<void, [key: string, value: string]>;
  setExtra: jest.Mock<void, [key: string, value: unknown]>;
};

const createScopeSnapshot = (): ScopeSnapshot => ({ tags: {}, extras: {} });

const assignScopeValue = <T extends keyof ScopeSnapshot>(
  target: ScopeSnapshot,
  key: T,
  entryKey: string,
  value: ScopeSnapshot[T][string],
) => {
  if (target[key] == null) {
    target[key] = {} as ScopeSnapshot[T];
  }
  target[key][entryKey] = value;
};

jest.mock(
  "sentry-expo",
  () => {
    const scopeSnapshot = createScopeSnapshot();
    const breadcrumbs: Breadcrumb[] = [];
    const capturedErrors: CapturedError[] = [];
    const capturedMessages: CapturedMessage[] = [];
    const initCalls: Record<string, unknown>[] = [];
    let closeCallCount = 0;

    const recordScopeTag = jest.fn((key: string, value: string) => {
      assignScopeValue(scopeSnapshot, "tags", key, value);
    });

    const recordScopeExtra = jest.fn((key: string, value: unknown) => {
      assignScopeValue(scopeSnapshot, "extras", key, value);
    });

    const scope: Scope = {
      setTag: recordScopeTag,
      setExtra: recordScopeExtra,
    };

    const configureScope = jest.fn((callback: (scope: Scope) => void) => {
      callback(scope);
    });

    const reset = () => {
      init.mockClear();
      native.captureException.mockClear();
      native.captureMessage.mockClear();
      native.addBreadcrumb.mockClear();
      configureScope.mockClear();
      native.setTag.mockClear();
      native.setExtra.mockClear();
      native.close.mockClear();
      breadcrumbs.length = 0;
      capturedErrors.length = 0;
      capturedMessages.length = 0;
      initCalls.length = 0;
      closeCallCount = 0;
      scopeSnapshot.tags = {};
      scopeSnapshot.extras = {};
    };

    const init = jest.fn((options: Record<string, unknown>) => {
      initCalls.push({ ...options });
    });

    const native = {
      captureException: jest.fn((error: unknown, context?: CapturedError["context"]) => {
        capturedErrors.push({ error, context });
      }),
      captureMessage: jest.fn((message: string, context?: CapturedMessage["context"]) => {
        capturedMessages.push({ message, context });
      }),
      addBreadcrumb: jest.fn((breadcrumb: Breadcrumb) => {
        breadcrumbs.push({ ...breadcrumb });
      }),
      configureScope,
      setTag: jest.fn((key: string, value: string) => {
        recordScopeTag(key, value);
      }),
      setExtra: jest.fn((key: string, value: unknown) => {
        recordScopeExtra(key, value);
      }),
      close: jest.fn(() => {
        closeCallCount += 1;
        return Promise.resolve(undefined);
      }),
    };

    const getScopeSnapshot = (): ScopeSnapshot => ({
      tags: { ...scopeSnapshot.tags },
      extras: { ...scopeSnapshot.extras },
    });

    return {
      init,
      Native: native,
      __mock: {
        reset,
        getScope: getScopeSnapshot,
        getBreadcrumbs: () => breadcrumbs.map((breadcrumb) => ({ ...breadcrumb })),
        getCapturedErrors: () => capturedErrors.map((entry) => ({ ...entry })),
        getCapturedMessages: () => capturedMessages.map((entry) => ({ ...entry })),
        getInitCalls: () => initCalls.map((call) => ({ ...call })),
        getCloseCallCount: () => closeCallCount,
      },
    };
  },
  { virtual: true },
);
