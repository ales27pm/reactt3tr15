import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useOnboardingJourney } from "../../onboarding/hooks/useOnboardingJourney";
import { useAppNavigation } from "../../navigation/hooks";
import { useAppStore } from "../../state/appStore";

const OnboardingTutorialScreen = () => {
  const { goToNext } = useOnboardingJourney();
  const navigation = useAppNavigation<"Main">();
  const onboardingCompleted = useAppStore((state) => state.onboarding.completed);

  useEffect(() => {
    if (onboardingCompleted) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    }
  }, [navigation, onboardingCompleted]);

  const handleFinish = () => {
    goToNext();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You&apos;re ready!</Text>
      <Text style={styles.subtitle}>
        Rotate with taps, swipe to move, and drop pieces by swiping down. Keep an eye on your combo meter to maximize
        rewards.
      </Text>
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Pro tips</Text>
        <Text style={styles.tipText}>• Hold pieces with a long press on the board.</Text>
        <Text style={styles.tipText}>• Hard drop with a double tap.</Text>
        <Text style={styles.tipText}>• Keep streaks alive to earn rare rewards.</Text>
      </View>
      <Pressable
        style={styles.primaryButton}
        onPress={handleFinish}
        accessibilityRole="button"
        testID="onboarding-tutorial-finish"
      >
        <Text style={styles.primaryButtonLabel}>Start Playing</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#020617",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd5f5",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  tipCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tipTitle: {
    color: "#38bdf8",
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 16,
  },
  tipText: {
    color: "#e2e8f0",
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: "#22d3ee",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonLabel: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default OnboardingTutorialScreen;
