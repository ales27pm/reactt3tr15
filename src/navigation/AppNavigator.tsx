import { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../state/appStore";
import { configureAnalytics, trackRetentionEvent } from "../analytics/analyticsClient";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { MainTabsNavigator } from "./MainTabsNavigator";
import type { RootStackParamList } from "./types";
import { logInfo } from "../utils/logger";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const onboardingCompleted = useAppStore((state) => state.onboarding.completed);
  const analyticsEnabled = useAppStore((state) => state.analytics.enabled);
  const userId = useAppStore((state) => state.analytics.userId);

  useEffect(() => {
    configureAnalytics({ enabled: analyticsEnabled, userId: userId ?? undefined });
    void trackRetentionEvent({
      name: analyticsEnabled ? "Analytics Opt-In" : "Analytics Opt-Out",
    });
  }, [analyticsEnabled, userId]);

  useEffect(() => {
    logInfo(`Onboarding completed: ${onboardingCompleted}`, { context: "navigation" });
  }, [onboardingCompleted]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {onboardingCompleted ? (
        <Stack.Screen name="Main" component={MainTabsNavigator} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
