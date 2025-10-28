import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { logDebug, logInfo } from "../utils/logger";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.DEFAULT,
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
      .filter((notification) => {
        const reminderTag = (notification.content as Notifications.NotificationContent | undefined)?.data?.reminderTag;
        return reminderTag === REMINDER_IDENTIFIER;
      })
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
  );
  logDebug("Cleared scheduled reminders", { context: "notifications" });
};

const configureTrigger = (schedule: NotificationSchedule): Notifications.DailyTriggerInput => {
  const hour = Math.min(23, Math.max(0, schedule.hour | 0));
  const minute = Math.min(59, Math.max(0, schedule.minute | 0));
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };
};

export const scheduleDailyReminder = async (schedule: NotificationSchedule) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error("Notification permission not granted");
  }

  await cancelScheduledReminders();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to drop blocks!",
      body: "Keep your streak alive by finishing a round today.",
      sound: Platform.OS === "ios" ? undefined : "default",
      data: { reminderTag: REMINDER_IDENTIFIER },
    },
    trigger: configureTrigger(schedule),
  });

  logInfo(`Scheduled reminder ${identifier}`, { context: "notifications" });

  return identifier;
};
