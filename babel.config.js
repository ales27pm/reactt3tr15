module.exports = function (api) {
  api.cache(true);
  const plugins = [];

  if (process.env.NODE_ENV === "test") {
    try {
      plugins.push(require.resolve("react-native-worklets/plugin"));
    } catch (error) {
      if (process.env.CI !== "true") {
        console.warn(
          `[babel] react-native-worklets/plugin unavailable: ${error.message}. Skipping worklet transforms for Jest.`,
        );
      }
    }
  } else {
    plugins.push("react-native-worklets/plugin");
  }

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
