# Native Network Diagnostics Setup

This guide explains how to enable the TurboModule-based network diagnostics bridges on iOS and Android. The bridges expose Wi-Fi scanning, VPN status detection, and packet-capture orchestration hooks consumed from `src/services/network`.

## Prerequisites

- React Native new architecture enabled (`"newArchEnabled": true` in `app.json`).
- Expo prebuild or bare React Native native folders generated.
- Xcode 16+ and Android Studio Iguana+.
- macOS Sonoma or newer when preparing rvictl tethered captures.

## iOS Configuration

1. **Enable required entitlements**
   - In `ios/<AppName>.entitlements` add:
     ```xml
     <key>com.apple.developer.networking.HotspotConfiguration</key>
     <true/>
     <key>com.apple.developer.networking.networkextension</key>
     <array>
       <string>packet-tunnel-provider</string>
       <string>app-proxy-provider</string>
     </array>
     <key>com.apple.developer.networking.wifi-info</key>
     <true/>
     ```
   - Attach the NetworkExtension entitlement to an Apple Developer enterprise profile or local development provisioning profile.

2. **Link the TurboModule**
   - After running `npx expo prebuild` (or in a bare app), add `NetworkDiagnosticsModule.mm` and `NetworkDiagnosticsModule.h` to the Xcode project under a new group `NetworkDiagnostics`.
   - Ensure the files are part of the main application target and compiled as Objective-C++ (`.mm`).
   - Add the module to `Podfile` via:
     ```ruby
     pod 'NetworkDiagnostics', :path => '../ios/NetworkDiagnostics'
     ```
     or include the files directly in the app target if not distributing as a pod.

3. **Register the TurboModule**
   - For bridgeless/new architecture apps, extend `AppTurboModuleManagerDelegate`:

     ```objc
     #import "NetworkDiagnosticsModule.h"

     - (Class)getModuleClassFromName:(const char *)name {
       if (strcmp(name, "NetworkDiagnostics") == 0) {
         return NetworkDiagnosticsModule.class;
       }
       return [super getModuleClassFromName:name];
     }
     ```

   - For classic architecture compatibility, add `NetworkDiagnosticsModule` to `RCTBridgeDelegate`'s `extraModulesForBridge` list when necessary.

4. **rvictl tethered capture workflow**
   - Install the Xcode Command Line Tools to obtain `/usr/sbin/rvictl`.
   - Connect the target iOS device via USB and trust the host Mac.
   - Start a remote virtual interface:
     ```bash
     sudo rvictl -s <DEVICE-UDID>
     ```
   - Capture packets using Wireshark or `tcpdump` against the newly created `rvi0` interface:
     ```bash
     sudo tcpdump -i rvi0 -w ~/Captures/session.pcap
     ```
   - When finished, tear down the interface:
     ```bash
     sudo rvictl -x <DEVICE-UDID>
     ```
   - The React Native app should call `startPacketCapture` only after a tethered session is established. If the API call is rejected, fall back to the manual rvictl steps above.

## Android Configuration

1. **Grant VPN and Wi-Fi permissions**
   - In `android/app/src/main/AndroidManifest.xml` add:

     ```xml
     <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
     <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
     <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
     <uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />
     <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
     <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
     <uses-permission android:name="android.permission.INTERNET" />

     <application ...>
       <service
         android:name=".capture.VpnCaptureService"
         android:permission="android.permission.BIND_VPN_SERVICE"
         android:exported="false" />
     </application>
     ```

   - Devices on Android 13+ must also approve _Nearby Wi-Fi devices_ at runtime.

2. **Register the TurboModule package**
   - In `MainApplication.kt` (or `MainApplication.java`), add:

     ```kotlin
     import com.netsight.network.NetworkDiagnosticsPackage

     override fun getPackages(): List<ReactPackage> =
       super.getPackages() + listOf(NetworkDiagnosticsPackage())
     ```

   - For new architecture builds, update `MainApplicationReactNativeHost.getPackages()` and `ReactPackageTurboModuleManagerDelegate.Builder.addPackage(NetworkDiagnosticsPackage())`.

3. **Implement a VpnService-based capture**
   - Create a `VpnService` subclass (e.g. `capture.VpnCaptureService`) that configures a TUN interface and writes packets to app storage.
   - Prompt users for VPN consent before invoking `startPacketCapture`. The JavaScript service already surfaces descriptive errors until a concrete implementation is wired.

4. **Testing on emulator/devices**
   - Use `adb shell cmd wifi start-scan` to trigger background scans when throttled.
   - Validate VPN routing with `adb shell dumpsys connectivity` and confirm the `TRANSPORT_VPN` flag is set.

## JavaScript Integration

The `src/services/network` helpers automatically:

- Use the TurboModule implementation on native platforms.
- Fall back to `expo-network` for network state when the native module is unavailable (web, simulator without entitlements, CI).
- Provide actionable logging for packet capture limitations, guiding engineers toward rvictl (iOS) or VpnService (Android).

Invoke from application code as follows:

```ts
import {
  getCurrentNetwork,
  getVpnStatus,
  scanWifiNetworks,
  startPacketCapture,
  stopPacketCapture,
} from "@/services/network";

const networks = await scanWifiNetworks();
const current = await getCurrentNetwork();
const vpn = await getVpnStatus();
```

For packet captures, wrap calls in try/catch and display the error messages surfaced by the module when the host setup is incomplete.
