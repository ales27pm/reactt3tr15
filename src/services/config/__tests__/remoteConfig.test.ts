jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("../../../monitoring/crashReporter", () => ({
  updateCrashReporting: jest.fn(),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateCrashReporting } from "../../../monitoring/crashReporter";
import {
  clearRemoteConfigCache,
  getDefaultRemoteConfig,
  loadRemoteConfig,
  type RemoteConfig,
} from "../remoteConfig";

const updateCrashReportingMock = updateCrashReporting as jest.Mock;

describe("remoteConfig", () => {
  beforeEach(async () => {
    jest.resetModules();
    updateCrashReportingMock.mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.removeItem as jest.Mock).mockClear();
    delete (globalThis as { fetch?: typeof fetch }).fetch;
    delete process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL;
    delete process.env.EXPO_PUBLIC_REMOTE_CONFIG_FALLBACK;
    await clearRemoteConfigCache();
  });

  it("returns defaults when no remote URL is configured", async () => {
    const config = await loadRemoteConfig({ forceRefresh: true });

    expect(config).toEqual(getDefaultRemoteConfig());
    expect(updateCrashReportingMock).toHaveBeenCalledWith({ enabled: true, sampleRate: 0.05 });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining("remote-config"),
      expect.stringContaining("\"featureFlags\""),
    );
  });

  it("merges overrides from remote payload", async () => {
    process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL = "https://config.vibecode.app/app.json";
    const overrides: Partial<RemoteConfig> = {
      version: 2,
      featureFlags: {
        networkDiagnostics: {
          enabled: false,
          allowWifiScan: false,
          allowPacketCapture: true,
          wifiScanIntervalSeconds: 120,
        },
        crashReporting: {
          enabled: false,
          sampleRate: 0.25,
        },
      },
      network: {
        diagnosticsPollingIntervalSeconds: 180,
      },
    };

    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => overrides,
    });

    const config = await loadRemoteConfig({ forceRefresh: true });

    expect(config.version).toBe(2);
    expect(config.featureFlags.networkDiagnostics.enabled).toBe(false);
    expect(config.featureFlags.networkDiagnostics.allowPacketCapture).toBe(true);
    expect(config.featureFlags.crashReporting.sampleRate).toBe(0.25);
    expect(config.network.diagnosticsPollingIntervalSeconds).toBe(180);
    expect(updateCrashReportingMock).toHaveBeenCalledWith({ enabled: false, sampleRate: 0.25 });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://config.vibecode.app/app.json",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("re-uses cached config when available and forceRefresh is false", async () => {
    const cached = {
      ...getDefaultRemoteConfig(),
      version: 3,
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cached));
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({ ok: false });

    const firstLoad = await loadRemoteConfig({ forceRefresh: true });
    expect(firstLoad.version).toBe(3);

    (global.fetch as jest.Mock).mockClear();
    const secondLoad = await loadRemoteConfig();
    expect(secondLoad.version).toBe(3);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
