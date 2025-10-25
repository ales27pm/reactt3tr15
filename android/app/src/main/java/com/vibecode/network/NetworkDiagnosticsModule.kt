package com.vibecode.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.ScanResult
import android.net.wifi.WifiManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

private const val TAG = "NetworkDiagnosticsModule"

class NetworkDiagnosticsModule(
  reactContext: ReactApplicationContext,
) : NativeNetworkDiagnosticsSpec(reactContext) {

  private val appContext = reactContext.applicationContext
  private val wifiManager: WifiManager? =
    appContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
  private val connectivityManager: ConnectivityManager? =
    appContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager

  override fun getName(): String = "NetworkDiagnostics"

  override fun scanWifiNetworks(promise: Promise) {
    try {
      val manager = wifiManager
      if (manager == null) {
        Log.w(TAG, "WifiManager not available")
        promise.resolve(Arguments.createArray())
        return
      }

      val scanResults = manager.scanResults ?: emptyList()
      val array = Arguments.createArray()
      for (result in scanResults) {
        array.pushMap(result.toWritableMap())
      }
      promise.resolve(array)
    } catch (security: SecurityException) {
      Log.e(TAG, "scanWifiNetworks failed due to permission error", security)
      promise.reject(
        "E_WIFI_PERMISSION",
        "WiFi scan requires ACCESS_FINE_LOCATION and nearby Wi-Fi permissions.",
        security,
      )
    } catch (throwable: Throwable) {
      Log.e(TAG, "scanWifiNetworks failed", throwable)
      promise.reject("E_WIFI_SCAN", throwable.message, throwable)
    }
  }

  override fun getCurrentNetwork(promise: Promise) {
    try {
      val manager = wifiManager
      if (manager == null) {
        Log.w(TAG, "WifiManager not available for current network")
        promise.resolve(null)
        return
      }

      val info = manager.connectionInfo
      if (info == null || info.networkId == -1) {
        promise.resolve(null)
        return
      }

      val frequency = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) info.frequency else -1
      val map = Arguments.createMap().apply {
        putString("ssid", formatSsid(info.ssid))
        putString("bssid", info.bssid)
        putDouble("signalLevel", info.rssi.toDouble())
        if (frequency > 0) {
          putDouble("frequencyMhz", frequency.toDouble())
        }
        val channel = frequencyToChannel(frequency)
        if (channel != -1) {
          putInt("channel", channel)
        } else {
          putNull("channel")
        }
        putString("security", "unknown")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          putString("interfaceName", info.networkSpecifier)
        }
        putString("ipAddress", formatIp(info.ipAddress))
      }

      promise.resolve(map)
    } catch (throwable: Throwable) {
      Log.e(TAG, "getCurrentNetwork failed", throwable)
      promise.reject("E_CURRENT_NETWORK", throwable.message, throwable)
    }
  }

  override fun getVpnStatus(promise: Promise) {
    try {
      val manager = connectivityManager
      if (manager == null) {
        promise.resolve(Arguments.createMap().apply { putBoolean("active", false) })
        return
      }

      val activeNetwork = manager.activeNetwork
      val capabilities = manager.getNetworkCapabilities(activeNetwork)
      val hasVpn = capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true
      val map = Arguments.createMap().apply {
        putBoolean("active", hasVpn)
        putString("type", if (hasVpn) "vpn" else "none")
        putBoolean("hasRoute", capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true)
      }
      promise.resolve(map)
    } catch (throwable: Throwable) {
      Log.e(TAG, "getVpnStatus failed", throwable)
      promise.reject("E_VPN_STATUS", throwable.message, throwable)
    }
  }

  override fun startPacketCapture(options: Map<String, Any?>, promise: Promise) {
    val message =
      "Android packet capture requires a VpnService implementation. Launch the diagnostics capture activity before calling this API."
    Log.e(TAG, message)
    promise.reject("E_ANDROID_CAPTURE_UNSUPPORTED", message)
  }

  override fun stopPacketCapture(sessionId: String, promise: Promise) {
    val message =
      "stopPacketCapture requires an active VpnService session. Track lifecycle in the host application."
    Log.e(TAG, message)
    promise.reject("E_ANDROID_CAPTURE_UNSUPPORTED", message)
  }

  private fun ScanResult.toWritableMap() = Arguments.createMap().apply {
    putString("ssid", formatSsid(SSID))
    putString("bssid", BSSID ?: "")
    putDouble("signalLevel", level.toDouble())
    putDouble("frequencyMhz", frequency.toDouble())
    val channel = frequencyToChannel(frequency)
    if (channel != -1) {
      putInt("channel", channel)
    } else {
      putNull("channel")
    }
    putString("security", parseSecurity(capabilities))
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
      putDouble("lastSeen", timestamp.toDouble())
    }
  }

  /**
   * Parses the Wi-Fi security capabilities string and returns a normalized security type.
   * Handles common combinations like WPA2-Enterprise, WPA3-Enterprise, and EAP.
   * Limitations: May not detect all proprietary or future security types.
   */
  private fun parseSecurity(capabilities: String?): String {
    val caps = capabilities ?: return "unknown"
    val capsLower = caps.lowercase()

    return when {
      capsLower.contains("wep") -> "wep"
      // WPA3-Enterprise or WPA3-EAP
      capsLower.contains("wpa3") &&
        (capsLower.contains("eap") || capsLower.contains("enterprise")) -> "wpa3-enterprise"
      capsLower.contains("wpa3") -> "wpa3"
      // WPA2-Enterprise or WPA2-EAP
      capsLower.contains("wpa2") &&
        (capsLower.contains("eap") || capsLower.contains("enterprise")) -> "wpa2-enterprise"
      capsLower.contains("wpa2") -> "wpa2"
      // WPA-Enterprise or WPA-EAP
      capsLower.contains("wpa") &&
        (capsLower.contains("eap") || capsLower.contains("enterprise")) -> "wpa-enterprise"
      capsLower.contains("wpa") -> "wpa"
      // EAP or Enterprise without WPA/WPA2/WPA3
      capsLower.contains("eap") || capsLower.contains("enterprise") -> "enterprise"
      else -> "open"
    }
  }

  private fun formatSsid(ssid: String?): String? {
    if (ssid == null || ssid == WifiManager.UNKNOWN_SSID) return null
    return if (ssid.startsWith("\"") && ssid.endsWith("\"") && ssid.length > 1) {
      ssid.substring(1, ssid.length - 1)
    } else {
      ssid
    }
  }

  private fun frequencyToChannel(frequency: Int): Int {
    return when {
      frequency in 2412..2472 -> (frequency - 2407) / 5
      frequency == 2484 -> 14
      frequency in 5170..5825 -> (frequency - 5000) / 5
      frequency in 5925..7125 -> (frequency - 5945) / 5 + 1
      else -> -1
    }
  }

  private fun formatIp(ip: Int): String {
    return String.format(
      "%d.%d.%d.%d",
      ip and 0xff,
      ip shr 8 and 0xff,
      ip shr 16 and 0xff,
      ip shr 24 and 0xff,
    )
  }
}
