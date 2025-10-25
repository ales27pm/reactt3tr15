const path = require("node:path");

const WORKLETS_PLUGIN = "react-native-worklets/plugin";
const WORKLETS_STUB = path.join(__dirname, "scripts", "babel", "react-native-worklets-plugin-stub.js");

module.exports = function (api) {
  api.cache(true);
  const plugins = [];

  if (process.env.NODE_ENV === "test") {
    let resolvedPlugin;
    try {
      resolvedPlugin = require.resolve(WORKLETS_PLUGIN);
    } catch (error) {
      if (process.env.CI !== "true") {
        console.warn(
          `[babel] react-native-worklets/plugin unavailable: ${error.message}. Falling back to a stub for Jest.`,
        );
      }
    }

    plugins.push(resolvedPlugin ?? WORKLETS_STUB);
  } else {
    plugins.push(WORKLETS_PLUGIN);
  }

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
