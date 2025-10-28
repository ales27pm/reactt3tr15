import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  OnboardingIntro: undefined;
  OnboardingPermissions: undefined;
  OnboardingTutorial: undefined;
};

export type MainTabParamList = {
  Play: undefined;
  Rewards: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type AppNavigationProp<RouteName extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  RouteName
>;

export type AppRouteProp<RouteName extends keyof RootStackParamList> = RouteProp<RootStackParamList, RouteName>;
