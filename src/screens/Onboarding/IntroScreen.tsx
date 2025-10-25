import { useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useOnboardingJourney } from "../../onboarding/hooks/useOnboardingJourney";
import type { OnboardingStackParamList } from "../../navigation/types";

export type OnboardingIntroScreenProps = NativeStackScreenProps<OnboardingStackParamList, "OnboardingIntro">;

const OnboardingIntroScreen = ({ navigation }: OnboardingIntroScreenProps) => {
  const { startOnboarding, goToNext, onboarding } = useOnboardingJourney();

  useEffect(() => {
    startOnboarding();
  }, [startOnboarding]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to React T3TR15</Text>
      <Text style={styles.subtitle}>
        You&apos;re moments away from mastering high-speed Tetris battles. Let&apos;s personalize your experience to
        keep the wins coming.
      </Text>
      <Pressable
        style={styles.primaryButton}
        onPress={() => {
          goToNext();
          navigation.replace("OnboardingPermissions");
        }}
        accessibilityRole="button"
        testID="onboarding-intro-get-started"
      >
        <Text style={styles.primaryButtonLabel}>Get Started</Text>
      </Pressable>
      {onboarding.completed && (
        <Text style={styles.muted} accessibilityLiveRegion="polite">
          You can revisit onboarding anytime from settings.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#030712",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#e2e8f0",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#38bdf8",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 999,
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  primaryButtonLabel: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
  },
  muted: {
    color: "#94a3b8",
    marginTop: 24,
    textAlign: "center",
  },
});

export default OnboardingIntroScreen;
