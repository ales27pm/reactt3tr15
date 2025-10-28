import { useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import { useAppStore } from "../../state/appStore";
import { scheduleDailyReminder, cancelScheduledReminders } from "../../notifications/notificationService";
import { logError, logInfo } from "../../utils/logger";

export type NotificationSettingsScreenProps = BottomTabScreenProps<MainTabParamList, "Settings">;

const NotificationSettingsScreen = () => {
  const remindersEnabled = useAppStore((state) => state.notifications.remindersEnabled);
  const reminderTime = useAppStore((state) => state.notifications.reminderTime);
  const lastScheduledAt = useAppStore((state) => state.notifications.lastScheduledAt);
  const toggleReminders = useAppStore((state) => state.toggleReminders);
  const setReminderTime = useAppStore((state) => state.setReminderTime);
  const registerNotificationSchedule = useAppStore((state) => state.registerNotificationSchedule);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (value: boolean) => {
    setError(null);
    setIsScheduling(true);
    const previous = remindersEnabled;
    try {
      toggleReminders(value);
      if (value) {
        const [hours, minutes] = (reminderTime ?? "20:00").split(":").map((v) => Number.parseInt(v, 10));
        await scheduleDailyReminder({ hour: hours, minute: minutes });
        registerNotificationSchedule(new Date().toISOString());
      } else {
        await cancelScheduledReminders();
        registerNotificationSchedule(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logError(message, { context: "notifications" }, err);
      setError(message);
      toggleReminders(previous);
      registerNotificationSchedule(previous ? lastScheduledAt : null);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSchedule = async (time: string) => {
    setError(null);
    setIsScheduling(true);
    try {
      const [hours, minutes] = time.split(":").map((v) => Number.parseInt(v, 10));
      await scheduleDailyReminder({ hour: hours, minute: minutes });
      setReminderTime(time);
      registerNotificationSchedule(new Date().toISOString());
      logInfo(`Reminder rescheduled to ${time}`, { context: "notifications" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logError(message, { context: "notifications" }, err);
      setError(message);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.rowTitle}>Daily reminders</Text>
          <Text style={styles.rowSubtitle}>Stay on track with a daily nudge.</Text>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={handleToggle}
          disabled={isScheduling}
          testID="settings-reminders-switch"
        />
      </View>
      <View style={styles.row}>
        <View>
          <Text style={styles.rowTitle}>Reminder time</Text>
          <Text style={styles.rowSubtitle}>{reminderTime ?? "20:00"}</Text>
        </View>
        <Pressable
          style={styles.actionButton}
          disabled={isScheduling}
          onPress={() => handleSchedule(reminderTime ?? "20:00")}
          testID="settings-reminders-reschedule"
        >
          <Text style={styles.actionButtonLabel}>Reschedule</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.tipCard} testID="settings-tip-card">
        <Text style={styles.tipTitle}>Keep your streak alive</Text>
        <Text style={styles.tipBody}>
          Drop in for at least one match every day to earn bonus rewards and climb the leaderboard. Enable reminders to
          get a gentle ping when it&apos;s time to play.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  rowTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "600",
  },
  rowSubtitle: {
    color: "#64748b",
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: "#22d3ee",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  actionButtonLabel: {
    color: "#0f172a",
    fontWeight: "700",
  },
  error: {
    color: "#f87171",
    marginTop: 16,
  },
  tipCard: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
  },
  tipTitle: {
    color: "#f8fafc",
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 16,
  },
  tipBody: {
    color: "#cbd5f5",
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;
