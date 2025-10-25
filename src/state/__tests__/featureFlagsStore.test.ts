jest.mock("../../services/config/remoteConfig", () => {
  const actual = jest.requireActual("../../services/config/remoteConfig");
  return {
    ...actual,
    loadRemoteConfig: jest.fn().mockResolvedValue(actual.getDefaultRemoteConfig()),
    clearRemoteConfigCache: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import { useFeatureFlagStore } from "../featureFlagsStore";
import { loadRemoteConfig, getDefaultRemoteConfig } from "../../services/config/remoteConfig";

const getState = () => useFeatureFlagStore.getState();

describe("featureFlagsStore", () => {
  beforeEach(() => {
    useFeatureFlagStore.setState({
      config: getDefaultRemoteConfig(),
      status: "idle",
      error: null,
      lastSyncedAt: null,
    });
    (loadRemoteConfig as jest.Mock).mockClear();
  });

  it("refreshes and updates state", async () => {
    const refreshedConfig = {
      ...getDefaultRemoteConfig(),
      version: 42,
      featureFlags: {
        ...getDefaultRemoteConfig().featureFlags,
        networkDiagnostics: {
          ...getDefaultRemoteConfig().featureFlags.networkDiagnostics,
          enabled: false,
        },
      },
    };
    (loadRemoteConfig as jest.Mock).mockResolvedValueOnce(refreshedConfig);

    await getState().refresh({ forceRefresh: true });

    const state = getState();
    expect(state.status).toBe("ready");
    expect(state.config.version).toBe(42);
    expect(state.isEnabled("networkDiagnostics")).toBe(false);
    expect(loadRemoteConfig).toHaveBeenCalledWith({ forceRefresh: true });
  });

  it("sets error state when refresh fails", async () => {
    const error = new Error("network unavailable");
    (loadRemoteConfig as jest.Mock).mockRejectedValueOnce(error);

    await expect(getState().refresh({ forceRefresh: true })).rejects.toThrow("network unavailable");

    const state = getState();
    expect(state.status).toBe("error");
    expect(state.error).toBe("network unavailable");
  });
});
