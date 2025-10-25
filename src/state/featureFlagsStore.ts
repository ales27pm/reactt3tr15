import { create } from "zustand";
import { logError, logInfo } from "../utils/logger";
import {
  clearRemoteConfigCache,
  getDefaultRemoteConfig,
  getNetworkDiagnosticsSettings,
  loadRemoteConfig,
  type RemoteConfig,
} from "../services/config/remoteConfig";

export type RemoteConfigStatus = "idle" | "loading" | "ready" | "error";

export type FeatureFlagStore = {
  config: RemoteConfig;
  status: RemoteConfigStatus;
  error: string | null;
  lastSyncedAt: string | null;
  refresh: (options?: { forceRefresh?: boolean }) => Promise<void>;
  reset: () => Promise<void>;
  isEnabled: (flag: keyof RemoteConfig["featureFlags"]) => boolean;
};

export const useFeatureFlagStore = create<FeatureFlagStore>((set, get) => ({
  config: getDefaultRemoteConfig(),
  status: "idle",
  error: null,
  lastSyncedAt: null,
  refresh: async (options) => {
    try {
      set({ status: "loading", error: null });
      const config = await loadRemoteConfig({ forceRefresh: options?.forceRefresh });
      set({
        config,
        status: "ready",
        lastSyncedAt: new Date().toISOString(),
      });
      logInfo("Remote config synchronised", { context: "feature-flags" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logError(`Remote config refresh failed: ${message}`);
      set({
        status: "error",
        error: message,
        config: getDefaultRemoteConfig(),
      });
      throw error;
    }
  },
  reset: async () => {
    await clearRemoteConfigCache();
    set({
      config: getDefaultRemoteConfig(),
      status: "idle",
      error: null,
      lastSyncedAt: null,
    });
  },
  isEnabled: (flag) => {
    const { config } = get();
    return Boolean(config.featureFlags[flag]?.enabled);
  },
}));

export const useNetworkDiagnosticsSettings = () =>
  useFeatureFlagStore((state) => getNetworkDiagnosticsSettings(state.config));
