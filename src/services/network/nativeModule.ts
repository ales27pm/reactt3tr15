import { Platform, TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native";

import { logWarn } from "../../utils/logger";

import type { CurrentNetworkInfo, PacketCaptureOptions, PacketCaptureSession, VpnStatus, WifiNetwork } from "./types";

export interface NetworkDiagnosticsTurboModule extends TurboModule {
  scanWifiNetworks(): Promise<WifiNetwork[]>;
  getCurrentNetwork(): Promise<CurrentNetworkInfo | null>;
  getVpnStatus(): Promise<VpnStatus>;
  startPacketCapture(options: PacketCaptureOptions): Promise<PacketCaptureSession>;
  stopPacketCapture(sessionId: string): Promise<void>;
}

const MODULE_NAME = "NetworkDiagnostics";

let cachedModule: NetworkDiagnosticsTurboModule | null | undefined;

export function getNativeNetworkModule(): NetworkDiagnosticsTurboModule | null {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    const module = TurboModuleRegistry.get<NetworkDiagnosticsTurboModule>(MODULE_NAME);
    if (!module) {
      cachedModule = null;
      return cachedModule;
    }

    if (Platform.OS === "ios" || Platform.OS === "android") {
      cachedModule = module;
    } else {
      cachedModule = null;
    }
  } catch (error) {
    if (__DEV__) {
      logWarn(`[NetworkService] Failed to load native module: ${(error as Error).message}`, {
        context: "network-service",
      });
    }
    cachedModule = null;
  }

  return cachedModule;
}

export function resetNativeNetworkModuleCache() {
  cachedModule = undefined;
}
