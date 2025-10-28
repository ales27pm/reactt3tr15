//DO NOT REMOVE THIS CODE
import { logInfo } from "./src/utils/logger";

logInfo("Project ID is", { context: "index" }, process.env.EXPO_PUBLIC_NETSIGHT_PROJECT_ID);

import "./global.css";
import "react-native-get-random-values";
import { LogBox } from "react-native";
LogBox.ignoreLogs(["Expo AV has been deprecated", "Disconnected from Metro"]);

import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
