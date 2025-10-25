jest.mock("../nativeModule", () => ({
  getNativeNetworkModule: jest.fn(),
}));

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(),
  getIpAddressAsync: jest.fn(),
  NetworkStateType: { VPN: "VPN" },
}));

import * as ExpoNetwork from "expo-network";
import { getNativeNetworkModule } from "../nativeModule";
import { getCurrentNetwork, getVpnStatus, scanWifiNetworks, startPacketCapture, stopPacketCapture } from "../index";

const nativeModuleMock = getNativeNetworkModule as jest.Mock;
const getNetworkStateMock = ExpoNetwork.getNetworkStateAsync as jest.Mock;
const getIpAddressMock = ExpoNetwork.getIpAddressAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Network service fallbacks", () => {
  beforeEach(() => {
    nativeModuleMock.mockReturnValue(null);
  });

  it("returns empty wifi list without native module", async () => {
    await expect(scanWifiNetworks()).resolves.toEqual([]);
  });

  it("falls back to expo-network for current network", async () => {
    getNetworkStateMock.mockResolvedValue({
      type: "wifi",
      isConnected: true,
    });
    getIpAddressMock.mockResolvedValue("192.168.1.24");

    await expect(getCurrentNetwork()).resolves.toEqual({
      ssid: "wifi",
      security: "unknown",
      interfaceName: "wifi",
      ipAddress: "192.168.1.24",
    });
  });

  it("falls back to expo-network for VPN status", async () => {
    getNetworkStateMock.mockResolvedValue({
      type: ExpoNetwork.NetworkStateType.VPN,
      isConnected: true,
      isInternetReachable: true,
    });

    await expect(getVpnStatus()).resolves.toEqual({
      active: true,
      type: ExpoNetwork.NetworkStateType.VPN,
      hasRoute: true,
    });
  });

  it("throws when packet capture invoked without native module", async () => {
    await expect(startPacketCapture({ interfaceName: "en0" })).rejects.toThrow(
      "Packet capture requires installing the native bridge",
    );

    await expect(stopPacketCapture("session")).rejects.toThrow(
      "stopPacketCapture called without native implementation",
    );
  });
});

describe("Network service native path", () => {
  const nativeInstance = {
    scanWifiNetworks: jest.fn().mockResolvedValue([{ ssid: "Mock", security: "wpa2" }]),
    getCurrentNetwork: jest.fn().mockResolvedValue({
      ssid: "Mock",
      security: "wpa2",
      interfaceName: "wlan0",
    }),
    getVpnStatus: jest.fn().mockResolvedValue({ active: true, type: "IKEv2", hasRoute: true }),
    startPacketCapture: jest.fn().mockResolvedValue({
      id: "capture-1",
      interfaceName: "wlan0",
      startedAt: Date.now(),
    }),
    stopPacketCapture: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    nativeModuleMock.mockReturnValue(nativeInstance);
  });

  it("uses native implementation when available", async () => {
    await expect(scanWifiNetworks()).resolves.toEqual([{ ssid: "Mock", security: "wpa2" }]);
    await expect(getCurrentNetwork()).resolves.toEqual({
      ssid: "Mock",
      security: "wpa2",
      interfaceName: "wlan0",
    });
    await expect(getVpnStatus()).resolves.toEqual({ active: true, type: "IKEv2", hasRoute: true });
    await expect(startPacketCapture({ interfaceName: "wlan0" })).resolves.toEqual(
      expect.objectContaining({ interfaceName: "wlan0" }),
    );
    await expect(stopPacketCapture("capture-1")).resolves.toBeUndefined();
  });
});
