package com.netsight.network

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule

abstract class NativeNetworkDiagnosticsSpec protected constructor(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), TurboModule {

  abstract fun scanWifiNetworks(promise: Promise)
  abstract fun getCurrentNetwork(promise: Promise)
  abstract fun getVpnStatus(promise: Promise)
  abstract fun startPacketCapture(options: Map<String, Any?>, promise: Promise)
  abstract fun stopPacketCapture(sessionId: String, promise: Promise)
}
