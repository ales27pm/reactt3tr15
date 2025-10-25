import AsyncStorage from "@react-native-async-storage/async-storage";
import { logInfo, logWarn } from "../../utils/logger";
import type { CrashReporterFeatureConfig } from "../../monitoring/crashReporter";
import { updateCrashReporting } from "../../monitoring/crashReporter";

export type NetworkDiagnosticsFlag = {
  enabled: boolean;
  allowWifiScan: boolean;
  allowPacketCapture: boolean;
  wifiScanIntervalSeconds: number;
};

export type CrashReportingFlag = CrashReporterFeatureConfig & {
  sampleRate: number;
};

export type RemoteConfig = {
  version: number;
  updatedAt: string;
  featureFlags: {
    networkDiagnostics: NetworkDiagnosticsFlag;
    crashReporting: CrashReportingFlag;
  };
  network: {
    diagnosticsPollingIntervalSeconds: number;
  };
};

export type RemoteConfigOverrides = Partial<RemoteConfig>;

const STORAGE_KEY = "@vibecode/remote-config";
const LOG_TAG = "[RemoteConfig]";

const parseEnvBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value == null) {
    return fallback;
  }
  const normalised = value.trim().toLowerCase();
  if (normalised.length === 0) {
    return fallback;
  }
  return normalised === "1" || normalised === "true";
};

const parseEnvNumber = (value: string | undefined, fallback: number): number => {
  if (value == null) {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DEFAULT_CONFIG: RemoteConfig = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  featureFlags: {
    networkDiagnostics: {
      enabled: parseEnvBoolean(process.env.EXPO_PUBLIC_FEATURE_NETWORK_DIAGNOSTICS, true),
      allowWifiScan: true,
      allowPacketCapture: parseEnvBoolean(process.env.EXPO_PUBLIC_FEATURE_PACKET_CAPTURE, false),
      wifiScanIntervalSeconds: 60,
    },
    crashReporting: {
      enabled: parseEnvBoolean(process.env.EXPO_PUBLIC_FEATURE_CRASH_REPORTING, true),
      sampleRate: parseEnvNumber(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE, 0.05),
    },
  },
  network: {
    diagnosticsPollingIntervalSeconds: 60,
  },
};

let cachedConfig: RemoteConfig | null = null;

const cloneConfig = (config: RemoteConfig): RemoteConfig => JSON.parse(JSON.stringify(config));

const mergeConfig = (base: RemoteConfig, overrides: RemoteConfigOverrides | null | undefined): RemoteConfig => {
  if (!overrides) {
    return cloneConfig(base);
  }

  const merged: RemoteConfig = {
    ...base,
    ...overrides,
    featureFlags: {
      ...base.featureFlags,
      ...overrides.featureFlags,
      networkDiagnostics: {
        ...base.featureFlags.networkDiagnostics,
        ...overrides.featureFlags?.networkDiagnostics,
      },
      crashReporting: {
        ...base.featureFlags.crashReporting,
        ...overrides.featureFlags?.crashReporting,
      },
    },
    network: {
      ...base.network,
      ...overrides.network,
    },
  };

  return merged;
};

const persistConfig = async (config: RemoteConfig) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    logWarn(`${LOG_TAG} Failed to persist remote config`, { context: "remote-config" }, error);
  }
};

const readPersistedConfig = async (): Promise<RemoteConfig | null> => {
  try {
    const payload = await AsyncStorage.getItem(STORAGE_KEY);
    if (!payload) {
      return null;
    }
    return JSON.parse(payload) as RemoteConfig;
  } catch (error) {
    logWarn(`${LOG_TAG} Failed to read cached config`, { context: "remote-config" }, error);
    return null;
  }
};

const resolveRemoteConfigUrl = (): string | null => {
  const fromEnv = process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  const extraDefaults = (process.env.EXPO_PUBLIC_REMOTE_CONFIG_FALLBACK ?? "").trim();
  if (extraDefaults) {
    return extraDefaults;
  }
  return null;
};

const fetchRemoteConfig = async (): Promise<RemoteConfigOverrides | null> => {
  const url = resolveRemoteConfigUrl();
  if (!url) {
    logWarn(`${LOG_TAG} Remote config URL missing, using defaults`, { context: "remote-config" });
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    const json = (await response.json()) as RemoteConfigOverrides;
    return json;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logWarn(`${LOG_TAG} Failed to download remote config: ${message}`, { context: "remote-config" });
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const getDefaultRemoteConfig = (): RemoteConfig => cloneConfig(DEFAULT_CONFIG);

export const loadRemoteConfig = async (options: { forceRefresh?: boolean } = {}): Promise<RemoteConfig> => {
  if (!options.forceRefresh && cachedConfig) {
    return cloneConfig(cachedConfig);
  }

  const baseline = cachedConfig ?? (await readPersistedConfig()) ?? DEFAULT_CONFIG;

  const overrides = await fetchRemoteConfig();
  const merged = mergeConfig(baseline, overrides);
  cachedConfig = merged;
  void persistConfig(merged);
  updateCrashReporting({
    enabled: merged.featureFlags.crashReporting.enabled,
    sampleRate: merged.featureFlags.crashReporting.sampleRate,
  });
  logInfo(`${LOG_TAG} Loaded config version ${merged.version}`, { context: "remote-config" });
  return cloneConfig(merged);
};

export const getFeatureFlag = (config: RemoteConfig, flag: keyof RemoteConfig["featureFlags"]): boolean => {
  return Boolean(config.featureFlags[flag]?.enabled);
};

export const isNetworkDiagnosticsEnabled = (config: RemoteConfig): boolean =>
  config.featureFlags.networkDiagnostics.enabled;

export const getNetworkDiagnosticsSettings = (config: RemoteConfig): NetworkDiagnosticsFlag =>
  config.featureFlags.networkDiagnostics;

export const clearRemoteConfigCache = async (): Promise<void> => {
  cachedConfig = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logWarn(`${LOG_TAG} Failed to clear cached config`, { context: "remote-config" }, error);
  }
};
