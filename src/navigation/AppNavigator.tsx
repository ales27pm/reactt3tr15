import { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../state/appStore";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { MainTabsNavigator } from "./MainTabsNavigator";
import type { RootStackParamList } from "./types";
import { logInfo } from "../utils/logger";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const onboardingCompleted = useAppStore((state) => state.onboarding.completed);
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    logInfo(`Onboarding completed: ${onboardingCompleted}`, { context: "navigation" });
  }, [onboardingCompleted, hasHydrated]);

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
