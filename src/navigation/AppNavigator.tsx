import { useEffect, useRef } from "react";
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

  const prevEnabledRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prevEnabled = prevEnabledRef.current;

    if (prevEnabled === null) {
      prevEnabledRef.current = analyticsEnabled;
      configureAnalytics({ enabled: analyticsEnabled, userId: userId ?? undefined });
      return;
    }

    if (prevEnabled !== analyticsEnabled) {
      if (!analyticsEnabled) {
        void trackRetentionEvent({ name: "Analytics Opt-Out" });
        configureAnalytics({ enabled: false, userId: userId ?? undefined });
      } else {
        configureAnalytics({ enabled: true, userId: userId ?? undefined });
        void trackRetentionEvent({ name: "Analytics Opt-In" });
      }
      prevEnabledRef.current = analyticsEnabled;
      return;
    }

    if (userId) {
      configureAnalytics({ userId });
    }
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
