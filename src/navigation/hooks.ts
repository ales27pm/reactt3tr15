import { useNavigation, useRoute } from "@react-navigation/native";
import type { AppNavigationProp, AppRouteProp, RootStackParamList } from "./types";

export const useAppNavigation = <T extends keyof RootStackParamList>() => useNavigation<AppNavigationProp<T>>();

export const useAppRoute = <T extends keyof RootStackParamList>() => useRoute<AppRouteProp<T>>();
