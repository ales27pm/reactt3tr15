import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingIntroScreen from "../screens/Onboarding/IntroScreen";
import OnboardingPermissionsScreen from "../screens/Onboarding/PermissionsScreen";
import OnboardingTutorialScreen from "../screens/Onboarding/TutorialScreen";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OnboardingIntro" component={OnboardingIntroScreen} />
    <Stack.Screen name="OnboardingPermissions" component={OnboardingPermissionsScreen} />
    <Stack.Screen name="OnboardingTutorial" component={OnboardingTutorialScreen} />
  </Stack.Navigator>
);

export default OnboardingNavigator;
