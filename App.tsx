import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigator from "./src/navigation/AppNavigator";
import { useFeatureFlagStore } from "./src/state/featureFlagsStore";
import { logError, logInfo } from "./src/utils/logger";
import { captureBreadcrumb } from "./src/monitoring/crashReporter";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  const refreshRemoteConfig = useFeatureFlagStore((state) => state.refresh);
  const remoteStatus = useFeatureFlagStore((state) => state.status);

  useEffect(() => {
    if (remoteStatus !== "idle") {
      return;
    }

    captureBreadcrumb("Bootstrapping remote config");
    void refreshRemoteConfig()
      .then(() => {
        logInfo("Remote config synchronised on app start", { context: "app" });
      })
      .catch((error) => {
        logError("Failed to synchronise remote config on launch", { context: "app" }, error);
      });
  }, [refreshRemoteConfig, remoteStatus]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
