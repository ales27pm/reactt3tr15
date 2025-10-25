import * as Network from "expo-network";
import { Platform } from "react-native";

import { logError, logWarn } from "../../utils/logger";

import {
  type CurrentNetworkInfo,
  type PacketCaptureOptions,
  type PacketCaptureSession,
  type VpnStatus,
  type WifiNetwork,
} from "./types";
import { getNativeNetworkModule } from "./nativeModule";

const LOG_TAG = "[NetworkService]";

async function fallbackCurrentNetwork(): Promise<CurrentNetworkInfo | null> {
  try {
    const [state, ip] = await Promise.all([Network.getNetworkStateAsync(), Network.getIpAddressAsync()]);

    if (!state || !state.isConnected) {
      return null;
    }

    return {
      ssid: state.type ?? "unknown",
      security: "unknown",
      interfaceName: state.type ?? undefined,
      ipAddress: ip,
    };
  } catch (error) {
    logError(`${LOG_TAG} Failed to resolve fallback current network`, { context: "network-service" }, error);
    return null;
  }
}

async function fallbackVpnStatus(): Promise<VpnStatus> {
  try {
    const state = await Network.getNetworkStateAsync();
    return {
      active: Boolean(state?.type === Network.NetworkStateType.VPN),
      type: state?.type ?? undefined,
      hasRoute: state?.isInternetReachable ?? false,
    };
  } catch (error) {
    logError(`${LOG_TAG} Failed to resolve fallback VPN status`, { context: "network-service" }, error);
    return { active: false };
  }
}

function logUnsupported(method: string) {
  logWarn(`${LOG_TAG} ${method} is unavailable on ${Platform.OS}.`, {
    context: "network-service",
  });
}

export async function scanWifiNetworks(): Promise<WifiNetwork[]> {
  const nativeModule = getNativeNetworkModule();
  if (!nativeModule) {
    logUnsupported("scanWifiNetworks");
    return [];
  }

  try {
    return await nativeModule.scanWifiNetworks();
  } catch (error) {
    logError(`${LOG_TAG} Native scan failed`, { context: "network-service" }, error);
    return [];
  }
}

export async function getCurrentNetwork(): Promise<CurrentNetworkInfo | null> {
  const nativeModule = getNativeNetworkModule();
  if (!nativeModule) {
    logUnsupported("getCurrentNetwork");
    return fallbackCurrentNetwork();
  }

  try {
    const value = await nativeModule.getCurrentNetwork();
    if (!value) {
      return fallbackCurrentNetwork();
    }
    return value;
  } catch (error) {
    logError(`${LOG_TAG} Native current network lookup failed`, { context: "network-service" }, error);
    return fallbackCurrentNetwork();
  }
}

export async function getVpnStatus(): Promise<VpnStatus> {
  const nativeModule = getNativeNetworkModule();
  if (!nativeModule) {
    logUnsupported("getVpnStatus");
    return fallbackVpnStatus();
  }

  try {
    return await nativeModule.getVpnStatus();
  } catch (error) {
    logError(`${LOG_TAG} Native VPN status lookup failed`, { context: "network-service" }, error);
    return fallbackVpnStatus();
  }
}

export async function startPacketCapture(options: PacketCaptureOptions): Promise<PacketCaptureSession> {
  const nativeModule = getNativeNetworkModule();
  if (!nativeModule) {
    const message = `${LOG_TAG} Packet capture requires installing the native bridge. Fallback to rvictl or Android VpnService.`;
    logError(message, { context: "network-service" });
    throw new Error(message);
  }

  try {
    return await nativeModule.startPacketCapture(options);
  } catch (error) {
    logError(`${LOG_TAG} Failed to start packet capture`, { context: "network-service" }, error);
    throw error;
  }
}

export async function stopPacketCapture(sessionId: string): Promise<void> {
  const nativeModule = getNativeNetworkModule();
  if (!nativeModule) {
    const message = `${LOG_TAG} stopPacketCapture called without native implementation.`;
    logError(message, { context: "network-service" });
    throw new Error(message);
  }

  try {
    await nativeModule.stopPacketCapture(sessionId);
  } catch (error) {
    logError(`${LOG_TAG} Failed to stop packet capture`, { context: "network-service" }, error);
    throw error;
  }
}

export * from "./types";
