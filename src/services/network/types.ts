export type NetworkSecurity =
  | 'open'
  | 'wep'
  | 'wpa'
  | 'wpa2'
  | 'wpa3'
  | 'enterprise'
  | 'unknown';

export interface WifiNetwork {
  ssid: string;
  bssid?: string;
  signalLevel?: number;
  frequencyMhz?: number;
  channel?: number;
  security: NetworkSecurity;
  lastSeen?: number;
}

export interface CurrentNetworkInfo extends WifiNetwork {
  interfaceName?: string;
  ipAddress?: string | null;
}

export interface VpnStatus {
  active: boolean;
  type?: string;
  name?: string;
  hasRoute?: boolean;
}

export interface PacketCaptureOptions {
  /**
   * Interface to capture, e.g. "en0" for WiFi or "pdp_ip0" for cellular on iOS.
   */
  interfaceName: string;
  /**
   * Absolute path where the capture should be persisted. Implementations are allowed
   * to rotate the file if they need to conform to sandboxing restrictions.
   */
  outputPath?: string;
  /**
   * Maximum bytes per file before rotating. Platforms may ignore when unsupported.
   */
  rotateEveryBytes?: number;
}

export interface PacketCaptureSession {
  id: string;
  interfaceName: string;
  outputPath?: string;
  startedAt: number;
}
