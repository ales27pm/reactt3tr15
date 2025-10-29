/**
 * React Native CLI autolinks native modules by default. We only use the
 * `react-native-worklets` package for its Babel plugin, so linking the native
 * library causes duplicate classes alongside `react-native-reanimated`.
 *
 * Explicitly disabling autolinking keeps the JavaScript tooling available while
 * preventing Gradle from compiling the native module.
 */
module.exports = {
  dependencies: {
    "react-native-worklets": {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
