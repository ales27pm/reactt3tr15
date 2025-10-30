const fs = require("node:fs");
const path = require("node:path");

function resolveIosAppName() {
  const podfilePath = path.join(__dirname, "ios", "Podfile");

  try {
    const contents = fs.readFileSync(podfilePath, "utf8");
    const match = contents.match(/target ['"](.+?)['"] do/);

    if (match && match[1]) {
      return match[1];
    }
  } catch (error) {
    console.warn(`[detox] Failed to read Podfile while inferring the iOS app name: ${error.message}`);
  }

  return "Netsight";
}

const iosAppName = resolveIosAppName();
const iosBuildProductsDir = path.posix.join("ios", "build", "Build", "Products", "Release-iphonesimulator");

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
      binaryPath: path.posix.join(iosBuildProductsDir, `${iosAppName}.app`),
      build: [
        "CI=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_ENABLE_CONTROLLER_DEBUG=1 npx expo prebuild --platform ios",
        "EXPO_PUBLIC_ENABLE_CONTROLLER_DEBUG=1 npx pod-install",
        `cd ios && EXPO_PUBLIC_ENABLE_CONTROLLER_DEBUG=1 xcodebuild -workspace ${iosAppName}.xcworkspace -scheme ${iosAppName} -configuration Release -sdk iphonesimulator -derivedDataPath build`,
      ].join(" && "),
    },
    "android.emu.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      build: [
        "CI=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_ENABLE_CONTROLLER_DEBUG=1 npx expo prebuild --platform android --no-install",
        "cd android && EXPO_PUBLIC_ENABLE_CONTROLLER_DEBUG=1 ./gradlew assembleRelease",
      ].join(" && "),
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
