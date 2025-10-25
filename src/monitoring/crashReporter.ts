import * as Sentry from "sentry-expo";
import { Platform } from "react-native";
import { logDebug, logError, logInfo, logWarn } from "../utils/logger";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const ENABLE_IN_DEV = process.env.EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV === "1";
const DEFAULT_SAMPLE_RATE = Number.parseFloat(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.05");

let initialized = false;
let crashReportingEnabled = false;

export type CrashReporterOptions = {
  dsn?: string;
  enableInDev?: boolean;
  tracesSampleRate?: number;
};

export type CrashReporterFeatureConfig = {
  enabled: boolean;
  sampleRate?: number;
};

const applyScopeMetadata = (config: CrashReporterFeatureConfig) => {
  Sentry.Native.configureScope((scope) => {
    scope.setTag("crash_reporting_enabled", String(config.enabled));
    if (config.sampleRate != null) {
      scope.setTag("crash_sample_rate", String(config.sampleRate));
    }
    scope.setExtra("environment", process.env.EXPO_PUBLIC_APP_ENVIRONMENT ?? "development");
    scope.setExtra("release_channel", process.env.EXPO_PUBLIC_RELEASE_CHANNEL ?? "development");
  });
};

export const initCrashReporting = (options: CrashReporterOptions = {}): void => {
  if (initialized) {
    logDebug("Crash reporter already initialised", { context: "crash-reporter" });
    return;
  }

  const dsn = options.dsn ?? SENTRY_DSN;

  if (!dsn) {
    logWarn("Sentry DSN not provided. Crash reporting is disabled.", { context: "crash-reporter" });
    initialized = true;
    crashReportingEnabled = false;
    return;
  }

  const tracesSampleRate = options.tracesSampleRate ?? DEFAULT_SAMPLE_RATE;

  Sentry.init({
    dsn,
    enableInExpoDevelopment: options.enableInDev ?? ENABLE_IN_DEV,
    debug: process.env.NODE_ENV !== "production",
    tracesSampleRate,
  });

  crashReportingEnabled = true;
  initialized = true;
  Sentry.Native.setTag("platform", Platform.OS);
  applyScopeMetadata({ enabled: true, sampleRate: tracesSampleRate });
  logInfo("Crash reporter initialised", { context: "crash-reporter" });
};

export const updateCrashReporting = (config: CrashReporterFeatureConfig): void => {
  if (!initialized) {
    initCrashReporting();
  }

  crashReportingEnabled = config.enabled;
  applyScopeMetadata(config);
  logInfo(`Crash reporting ${config.enabled ? "enabled" : "disabled"} via remote config`, {
    context: "crash-reporter",
  });
};

export const captureError = (
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
): void => {
  if (!initialized) {
    initCrashReporting();
  }

  if (!crashReportingEnabled) {
    logDebug("captureError skipped because crash reporting is disabled", { context: "crash-reporter" }, error);
    return;
  }

  try {
    Sentry.Native.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
    });
  } catch (err) {
    logError("Failed to forward error to Sentry", { context: "crash-reporter" }, err);
  }
};

export const captureBreadcrumb = (message: string, data?: Record<string, unknown>): void => {
  if (!initialized) {
    initCrashReporting();
  }

  if (!crashReportingEnabled) {
    return;
  }

  Sentry.Native.addBreadcrumb({
    message,
    category: "app",
    data,
    level: "info",
  });
};
