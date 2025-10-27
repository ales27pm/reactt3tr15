/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      config: "e2e/jest.config.js",
      runInBand: true,
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    "ios.sim.release": {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/Netsight.app",
      build:
        "EXPO_NO_TELEMETRY=1 npx expo prebuild --platform ios --non-interactive --no-install && cd ios && xcodebuild -project Netsight.xcodeproj -scheme Netsight -configuration Release -sdk iphonesimulator -derivedDataPath build",
    },
    "android.emu.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      build:
        "EXPO_NO_TELEMETRY=1 npx expo prebuild --platform android --non-interactive --no-install && cd android && ./gradlew assembleRelease",
    },
  },
  devices: {
    "ios.sim": {
      type: "ios.simulator",
      device: {
        type: "iPhone 15",
      },
    },
    "android.emu": {
      type: "android.emulator",
      avdName: "Pixel_7_API_34",
    },
  },
  configurations: {
    "ios.sim.release": {
      device: "ios.sim",
      app: "ios.sim.release",
    },
    "android.emu.release": {
      device: "android.emu",
      app: "android.emu.release",
    },
  },
};
