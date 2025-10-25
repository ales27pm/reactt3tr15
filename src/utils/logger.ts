/* eslint-disable no-console */
type LogLevel = "debug" | "info" | "warn" | "error";

type LogOptions = {
  context?: string;
};

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";
const verboseFlag = process.env.EXPO_PUBLIC_ENABLE_VERBOSE_LOGS === "1";

const shouldEmit = (level: LogLevel) => {
  if (level === "error" || level === "warn") {
    return true;
  }
  if (isDev) {
    return true;
  }
  return verboseFlag;
};

const resolvePlatformLabel = () => {
  if (typeof globalThis !== "undefined") {
    const platform = (globalThis as { Platform?: { OS?: string } }).Platform;
    if (platform?.OS) {
      return platform.OS.toUpperCase();
    }
  }
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    return "RN";
  }
  return "NODE";
};

const platformLabel = resolvePlatformLabel();

const formatPrefix = (level: LogLevel, context?: string) => {
  const prefixParts = [platformLabel, level.toUpperCase(), context].filter(Boolean);
  return `[${prefixParts.join(":")}]`;
};

const emit = (level: LogLevel, message: unknown, options?: LogOptions, ...optionalParams: unknown[]) => {
  if (!shouldEmit(level)) {
    return;
  }
  const prefix = formatPrefix(level, options?.context);
  const payload = typeof message === "string" ? `${prefix} ${message}` : prefix;
  const method = console[level] ?? console.log;
  if (typeof message === "string") {
    method(payload, ...optionalParams);
  } else {
    method(prefix, message, ...optionalParams);
  }
};

export const logDebug = (message: unknown, options?: LogOptions, ...optionalParams: unknown[]) =>
  emit("debug", message, options, ...optionalParams);

export const logInfo = (message: unknown, options?: LogOptions, ...optionalParams: unknown[]) =>
  emit("info", message, options, ...optionalParams);

export const logWarn = (message: unknown, options?: LogOptions, ...optionalParams: unknown[]) =>
  emit("warn", message, options, ...optionalParams);

export const logError = (message: unknown, options?: LogOptions, ...optionalParams: unknown[]) =>
  emit("error", message, options, ...optionalParams);
