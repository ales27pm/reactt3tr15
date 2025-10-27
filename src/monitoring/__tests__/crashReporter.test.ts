jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

jest.mock("../../utils/logger", () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

describe("crashReporter", () => {
  const resetEnv = () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    delete process.env.EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV;
    delete process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
    delete process.env.EXPO_PUBLIC_APP_ENVIRONMENT;
    delete process.env.EXPO_PUBLIC_RELEASE_CHANNEL;
  };

  const loadCrashReporter = () => {
    const sentry = require("sentry-expo") as typeof import("sentry-expo");
    sentry.__mock.reset();
    const crashReporter = require("../crashReporter") as typeof import("../crashReporter");
    return { crashReporter, sentry };
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    resetEnv();
  });

  it("disables crash reporting when DSN is missing", () => {
    const { crashReporter, sentry } = loadCrashReporter();
    const { initCrashReporting } = crashReporter;
    const { logWarn } = require("../../utils/logger");

    const result = initCrashReporting();

    expect(result).toBe(false);
    expect(sentry.init).not.toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledWith("Sentry DSN not provided. Crash reporting is disabled.", {
      context: "crash-reporter",
    });
  });

  it("initialises crash reporting with provided configuration", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://example.ingest.sentry.io/123";
    process.env.EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV = "1";
    process.env.EXPO_PUBLIC_APP_ENVIRONMENT = "production";
    process.env.EXPO_PUBLIC_RELEASE_CHANNEL = "preview";

    const { crashReporter, sentry } = loadCrashReporter();
    const { initCrashReporting } = crashReporter;
    const { logInfo } = require("../../utils/logger");

    const result = initCrashReporting({ tracesSampleRate: 0.25 });

    expect(result).toBe(true);
    expect(sentry.init).toHaveBeenCalledWith({
      dsn: "https://example.ingest.sentry.io/123",
      enableInExpoDevelopment: true,
      debug: true,
      tracesSampleRate: 0.25,
    });
    expect(sentry.Native.setTag).toHaveBeenCalledWith("platform", "ios");
    expect(sentry.Native.configureScope).toHaveBeenCalledTimes(1);

    const scope = sentry.__mock.getScope();
    expect(scope.tags).toMatchObject({
      crash_reporting_enabled: "true",
      crash_sample_rate: "0.25",
    });
    expect(scope.extras).toMatchObject({
      environment: "production",
      release_channel: "preview",
    });
    expect(logInfo).toHaveBeenCalledWith("Crash reporter initialised", { context: "crash-reporter" });
  });

  it("disables crash reporting via update and closes the native client", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://example.ingest.sentry.io/123";

    const { crashReporter, sentry } = loadCrashReporter();
    const { initCrashReporting, updateCrashReporting, captureError } = crashReporter;
    const { logInfo, logDebug } = require("../../utils/logger");

    expect(initCrashReporting()).toBe(true);
    updateCrashReporting({ enabled: false });

    expect(sentry.__mock.getCloseCallCount()).toBe(1);
    expect(logInfo).toHaveBeenCalledWith("Crash reporting disabled via remote config", {
      context: "crash-reporter",
    });

    captureError(new Error("boom"));
    expect(logDebug).toHaveBeenCalledWith(
      "captureError skipped because crash reporting is disabled",
      { context: "crash-reporter" },
      expect.any(Error),
    );
    expect(sentry.Native.captureException).not.toHaveBeenCalled();
  });

  it("records breadcrumbs when enabled", () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://example.ingest.sentry.io/123";

    const { crashReporter, sentry } = loadCrashReporter();
    const { initCrashReporting, captureBreadcrumb } = crashReporter;

    expect(initCrashReporting()).toBe(true);
    captureBreadcrumb("User navigated", { screen: "Home" });

    expect(sentry.Native.addBreadcrumb).toHaveBeenCalledWith({
      message: "User navigated",
      category: "app",
      data: { screen: "Home" },
      level: "info",
    });

    const breadcrumbs = sentry.__mock.getBreadcrumbs();
    expect(breadcrumbs).toEqual([
      { message: "User navigated", category: "app", data: { screen: "Home" }, level: "info" },
    ]);
  });
});
