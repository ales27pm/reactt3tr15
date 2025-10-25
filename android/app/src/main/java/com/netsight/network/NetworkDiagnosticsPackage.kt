package com.netsight.network

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NetworkDiagnosticsPackage : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == "NetworkDiagnostics") {
      NetworkDiagnosticsModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    val moduleInfos = mapOf(
      "NetworkDiagnostics" to ReactModuleInfo(
        "NetworkDiagnostics",
        "com.netsight.network.NetworkDiagnosticsModule",
        false,
        false,
        false,
        false,
        true,
      ),
    )

    return ReactModuleInfoProvider { moduleInfos }
  }
}
