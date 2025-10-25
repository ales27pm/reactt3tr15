import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useOnboardingJourney } from "../../onboarding/hooks/useOnboardingJourney";
import type { OnboardingStackParamList } from "../../navigation/types";
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelScheduledReminders,
} from "../../notifications/notificationService";
import { logError } from "../../utils/logger";
import { useAppStore } from "../../state/appStore";

export type OnboardingPermissionsScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  "OnboardingPermissions"
>;

const OnboardingPermissionsScreen = ({ navigation }: OnboardingPermissionsScreenProps) => {
  const { goToNext } = useOnboardingJourney();
  const toggleReminders = useAppStore((state) => state.toggleReminders);
  const setReminderTime = useAppStore((state) => state.setReminderTime);
  const registerNotificationSchedule = useAppStore((state) => state.registerNotificationSchedule);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async (enableNotifications: boolean) => {
    if (enableNotifications) {
      try {
        await requestNotificationPermissions();
        await scheduleDailyReminder({ hour: 20, minute: 0 });
        setReminderTime("20:00");
        registerNotificationSchedule(new Date().toISOString());
        toggleReminders(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logError(message, { context: "onboarding" }, err);
        setError(message);
        toggleReminders(false);
        registerNotificationSchedule(null);
      }
    } else {
      toggleReminders(false);
      await cancelScheduledReminders();
      registerNotificationSchedule(null);
    }
    goToNext();
    navigation.replace("OnboardingTutorial");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stay in the loop</Text>
      <Text style={styles.subtitle}>
        Enable reminders to receive gentle nudges when it&apos;s time to keep your streak alive. You can change this
        anytime in settings.
      </Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable reminders</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={(value) => {
            setNotificationsEnabled(value);
            if (error) {
              setError(null);
            }
          }}
          accessibilityRole="switch"
          testID="onboarding-permissions-toggle"
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={styles.primaryButton}
        onPress={() => handleContinue(notificationsEnabled)}
        accessibilityRole="button"
        testID="onboarding-permissions-continue"
      >
        <Text style={styles.primaryButtonLabel}>Continue</Text>
      </Pressable>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => {
          setNotificationsEnabled(false);
          void handleContinue(false);
        }}
        testID="onboarding-permissions-skip"
      >
        <Text style={styles.secondaryButtonLabel}>Skip for now</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 28,
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
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  switchLabel: {
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#f87171",
    textAlign: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#22d3ee",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonLabel: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryButtonLabel: {
    color: "#94a3b8",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});

export default OnboardingPermissionsScreen;
