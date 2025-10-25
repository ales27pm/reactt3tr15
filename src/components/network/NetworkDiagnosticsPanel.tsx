import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  getCurrentNetwork,
  getVpnStatus,
  scanWifiNetworks,
  type CurrentNetworkInfo,
  type VpnStatus,
  type WifiNetwork,
} from "../../services/network";
import { useNetworkDiagnosticsSettings } from "../../state/featureFlagsStore";
import { logError, logInfo } from "../../utils/logger";
import { captureBreadcrumb, captureError } from "../../monitoring/crashReporter";

const formatNetworkLabel = (network: CurrentNetworkInfo | null): string => {
  if (!network) {
    return "No active connection";
  }
  const ssid = network.ssid ?? network.interfaceName ?? "Unknown";
  return `${ssid}${network.ipAddress ? ` (${network.ipAddress})` : ""}`;
};

const formatVpnStatus = (status: VpnStatus | null): string => {
  if (!status || !status.active) {
    return "Inactive";
  }
  const typeLabel = status.type ? ` via ${status.type}` : "";
  const routeLabel = status.hasRoute === false ? " (no route)" : "";
  return `Active${typeLabel}${routeLabel}`;
};

const renderWifiNetwork = (network: WifiNetwork) => (
  <View key={`${network.ssid ?? "unknown"}-${network.frequencyMhz ?? "na"}`} style={styles.networkRow}>
    <Text style={styles.networkSsid}>{network.ssid ?? "Hidden network"}</Text>
    <Text style={styles.networkMeta}>{network.security ?? "Unknown security"}</Text>
  </View>
);

export const NetworkDiagnosticsPanel = () => {
  const featureSettings = useNetworkDiagnosticsSettings();
  const [currentNetwork, setCurrentNetwork] = useState<CurrentNetworkInfo | null>(null);
  const [vpnStatus, setVpnStatus] = useState<VpnStatus | null>(null);
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDiagnostics = async () => {
      try {
        const [network, vpn] = await Promise.all([getCurrentNetwork(), getVpnStatus()]);
        if (cancelled) {
          return;
        }
        setCurrentNetwork(network);
        setVpnStatus(vpn);
        captureBreadcrumb("Network diagnostics loaded", {
          hasNetwork: Boolean(network),
          vpnActive: Boolean(vpn?.active),
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : "Unable to load network details";
        logError(message, { context: "network-diagnostics" }, err);
        setError(message);
      }
    };

    void loadDiagnostics();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleScan = useCallback(async () => {
    if (!featureSettings.allowWifiScan) {
      setError("Wi-Fi scanning is disabled by policy");
      return;
    }

    setIsScanning(true);
    setError(null);
    try {
      const networks = await scanWifiNetworks();
      setWifiNetworks(networks);
      logInfo(`Wi-Fi scan completed with ${networks.length} result(s)`, { context: "network-diagnostics" });
      captureBreadcrumb("Wifi scan complete", { count: networks.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to scan Wi-Fi";
      setError(message);
      captureError(err, { tags: { feature: "network-diagnostics" } });
    } finally {
      setIsScanning(false);
    }
  }, [featureSettings.allowWifiScan]);

  const allowPacketCapture = featureSettings.allowPacketCapture && Platform.OS === "ios";

  const wifiList = useMemo(() => {
    if (wifiNetworks.length === 0) {
      return (
        <Text style={styles.emptyState} testID="network-diagnostics-list-empty">
          {featureSettings.allowWifiScan
            ? "No Wi-Fi networks detected. Try scanning again near an access point."
            : "Wi-Fi scanning is disabled on this build."}
        </Text>
      );
    }
    return wifiNetworks.map(renderWifiNetwork);
  }, [featureSettings.allowWifiScan, wifiNetworks]);

  return (
    <View style={styles.container} testID="network-diagnostics-card">
      <Text style={styles.title}>Network diagnostics</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Current network</Text>
        <Text style={styles.value} testID="network-diagnostics-current-network">
          {formatNetworkLabel(currentNetwork)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>VPN status</Text>
        <Text style={styles.value} testID="network-diagnostics-vpn-status">
          {formatVpnStatus(vpnStatus)}
        </Text>
      </View>
      <View style={styles.scanRow}>
        <Text style={styles.label}>Nearby Wi-Fi networks</Text>
        {featureSettings.allowWifiScan && (
          <Pressable
            style={[styles.actionButton, isScanning && styles.actionButtonDisabled]}
            onPress={handleScan}
            disabled={isScanning}
            testID="network-diagnostics-scan"
          >
            {isScanning ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.actionLabel}>Scan</Text>}
          </Pressable>
        )}
      </View>
      <View style={styles.listContainer}>{wifiList}</View>
      {allowPacketCapture && (
        <Text style={styles.caption} testID="network-diagnostics-pcap-note">
          Packet capture is enabled. Use rvictl with tethered devices to inspect 802.11 frames safely.
        </Text>
      )}
      {error && (
        <Text style={styles.error} testID="network-diagnostics-error">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    gap: 16,
  },
  title: {
    color: "#38bdf8",
    fontSize: 20,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  scanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#cbd5f5",
    fontSize: 14,
    flex: 1,
  },
  value: {
    color: "#f8fafc",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  listContainer: {
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#020617",
    gap: 12,
  },
  networkRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingBottom: 8,
  },
  networkSsid: {
    color: "#f8fafc",
    fontWeight: "600",
  },
  networkMeta: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },
  emptyState: {
    color: "#64748b",
    textAlign: "center",
  },
  caption: {
    color: "#f8fafc",
    fontSize: 12,
    lineHeight: 16,
  },
  error: {
    color: "#f87171",
  },
  actionButton: {
    backgroundColor: "#22d3ee",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  actionLabel: {
    color: "#0f172a",
    fontWeight: "700",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
});

export default NetworkDiagnosticsPanel;
