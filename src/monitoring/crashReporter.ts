import * as Sentry from "sentry-expo";
import { Platform } from "react-native";
import { logDebug, logError, logInfo, logWarn } from "../utils/logger";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const ENABLE_IN_DEV = process.env.EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV === "1";
const DEFAULT_SAMPLE_RATE = Number.parseFloat(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.05");

let initialized = false;
let crashReportingEnabled = false;
let initializationAttempted = false;
let currentSampleRate = DEFAULT_SAMPLE_RATE;
let lastInitOptions: CrashReporterOptions = {};

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
  if (!initialized) {
    return;
  }

  Sentry.Native.configureScope((scope) => {
    scope.setTag("crash_reporting_enabled", String(config.enabled));
    if (config.sampleRate != null) {
      scope.setTag("crash_sample_rate", String(config.sampleRate));
    }
    scope.setExtra("environment", process.env.EXPO_PUBLIC_APP_ENVIRONMENT ?? "development");
    scope.setExtra("release_channel", process.env.EXPO_PUBLIC_RELEASE_CHANNEL ?? "development");
  });
};

const closeCrashReporting = () => {
  if (!initialized) {
    return;
  }

  void Sentry.Native.close().catch((error: unknown) => {
    logError("Failed to shut down Sentry", { context: "crash-reporter" }, error);
  });

  initialized = false;
};

const ensureInitialized = () => {
  if (initialized || !crashReportingEnabled) {
    return;
  }

  const initSucceeded = initCrashReporting({ ...lastInitOptions, tracesSampleRate: currentSampleRate });

  if (!initSucceeded) {
    crashReportingEnabled = false;
  }
};

export const initCrashReporting = (options: CrashReporterOptions = {}): boolean => {
  initializationAttempted = true;
  lastInitOptions = { ...options };

  if (initialized) {
    logDebug("Crash reporter already initialised", { context: "crash-reporter" });
    return true;
  }

  const dsn = options.dsn ?? SENTRY_DSN;

  if (!dsn) {
    logWarn("Sentry DSN not provided. Crash reporting is disabled.", { context: "crash-reporter" });
    crashReportingEnabled = false;
    return false;
  }

  const tracesSampleRate = options.tracesSampleRate ?? DEFAULT_SAMPLE_RATE;
  currentSampleRate = tracesSampleRate;

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
  return true;
};

export const updateCrashReporting = (config: CrashReporterFeatureConfig): void => {
  if (config.enabled) {
    crashReportingEnabled = true;
    if (config.sampleRate != null) {
      currentSampleRate = config.sampleRate;
    }

    if (!initialized) {
      const initSucceeded = initCrashReporting({
        ...lastInitOptions,
        tracesSampleRate: currentSampleRate,
      });

      if (!initSucceeded) {
        crashReportingEnabled = false;
        logWarn("Crash reporting could not be initialised; leaving disabled", { context: "crash-reporter" });
        return;
      }
    }

    applyScopeMetadata({ enabled: true, sampleRate: currentSampleRate });
    logInfo("Crash reporting enabled via remote config", { context: "crash-reporter" });
    return;
  }

  crashReportingEnabled = false;

  if (initialized) {
    applyScopeMetadata({ enabled: false, sampleRate: currentSampleRate });
  }

  closeCrashReporting();
  logInfo("Crash reporting disabled via remote config", { context: "crash-reporter" });
};

export const captureError = (
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
): void => {
  if (!initialized) {
    let initSucceeded: boolean;

    if (!initializationAttempted) {
      initSucceeded = initCrashReporting();
    } else {
      ensureInitialized();
      initSucceeded = initialized;
    }

    if (!initSucceeded || !initialized) {
      crashReportingEnabled = false;
    }
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
    let initSucceeded: boolean;

    if (!initializationAttempted) {
      initSucceeded = initCrashReporting();
    } else {
      ensureInitialized();
      initSucceeded = initialized;
    }

    if (!initSucceeded || !initialized) {
      crashReportingEnabled = false;
    }
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
