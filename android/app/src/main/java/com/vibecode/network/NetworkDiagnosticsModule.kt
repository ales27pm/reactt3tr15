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
        putString("ssid", info.ssid?.trim('"'))
        putString("bssid", info.bssid)
        putDouble("signalLevel", info.rssi.toDouble())
        if (frequency > 0) {
          putDouble("frequencyMhz", frequency.toDouble())
        }
        putInt("channel", frequencyToChannel(frequency))
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
    putString("ssid", SSID ?: "")
    putString("bssid", BSSID ?: "")
    putDouble("signalLevel", level.toDouble())
    putDouble("frequencyMhz", frequency.toDouble())
    putInt("channel", frequencyToChannel(frequency))
    putString("security", parseSecurity(capabilities))
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
      putDouble("lastSeen", timestamp.toDouble())
    }
  }

  private fun parseSecurity(capabilities: String?): String {
    val caps = capabilities ?: return "unknown"
    return when {
      caps.contains("WEP", true) -> "wep"
      caps.contains("WPA3", true) -> "wpa3"
      caps.contains("WPA2", true) -> "wpa2"
      caps.contains("WPA", true) -> "wpa"
      caps.contains("EAP", true) -> "enterprise"
      else -> "open"
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
