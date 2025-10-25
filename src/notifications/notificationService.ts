import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { logDebug, logInfo } from "../utils/logger";
import { trackRetentionEvent } from "../analytics/analyticsClient";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type NotificationSchedule = {
  hour: number;
  minute: number;
};

const REMINDER_IDENTIFIER = "daily_engagement_reminder";

export const requestNotificationPermissions = async () => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    logDebug("Notification permissions already granted", { context: "notifications" });
    return true;
  }

  const response = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
    },
  });

  const granted = response.granted || response.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  logInfo(`Notification permission result: ${granted ? "granted" : "denied"}`, { context: "notifications" });
  return granted;
};

export const cancelScheduledReminders = async () => {
  const schedules = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    schedules
      .filter((notification) => notification.identifier === REMINDER_IDENTIFIER)
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
  );
  logDebug("Cleared scheduled reminders", { context: "notifications" });
};

const configureTrigger = (schedule: NotificationSchedule): Notifications.DailyTriggerInput => ({
  hour: schedule.hour,
  minute: schedule.minute,
  repeats: true,
});

export const scheduleDailyReminder = async (schedule: NotificationSchedule) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error("Notification permission not granted");
  }

  await cancelScheduledReminders();

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: "Time to drop blocks!",
      body: "Keep your streak alive by finishing a round today.",
      sound: Platform.OS === "ios" ? undefined : "default",
    },
    trigger: configureTrigger(schedule),
  });

  logInfo(`Scheduled reminder ${identifier}`, { context: "notifications" });
  await trackRetentionEvent({
    name: "Notification Scheduled",
    properties: {
      hour: schedule.hour,
      minute: schedule.minute,
    },
  });

  return identifier;
};
