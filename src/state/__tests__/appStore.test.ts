import AsyncStorage from "@react-native-async-storage/async-storage";
import { act } from "react-test-renderer";
import { useAppStore, getDefaultAppState } from "../appStore";
import { logInfo } from "../../utils/logger";

jest.mock("../../utils/logger", () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

describe("appStore", () => {
  const storageKey = "app-store";
  const { persist } = useAppStore as typeof useAppStore & {
    persist: { rehydrate: () => Promise<void> };
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();

    const current = useAppStore.getState();
    useAppStore.setState(
      {
        ...current,
        ...getDefaultAppState(),
        hasHydrated: false,
      },
      true,
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("marks onboarding as complete and unlocks reward", () => {
    act(() => {
      useAppStore.getState().completeOnboarding();
    });

    const state = useAppStore.getState();
    expect(state.onboarding.completed).toBe(true);
    expect(state.rewards.some((reward) => reward.id === "onboarding_complete")).toBe(true);
  });

  it("increments session metrics and calculates streaks across days", () => {
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    act(() => {
      useAppStore.getState().recordSessionStart();
      useAppStore.getState().recordSessionEnd(120);
    });

    let state = useAppStore.getState();
    expect(state.session.sessionCount).toBe(1);
    expect(state.session.dailyStreak).toBe(1);
    expect(state.rewards.some((reward) => reward.id === "session_first")).toBe(true);

    jest.setSystemTime(new Date("2024-01-02T12:00:00Z"));
    act(() => {
      useAppStore.getState().recordSessionStart();
      useAppStore.getState().recordSessionEnd(60);
    });

    jest.setSystemTime(new Date("2024-01-03T12:00:00Z"));
    act(() => {
      useAppStore.getState().recordSessionStart();
      useAppStore.getState().recordSessionEnd(90);
    });

    state = useAppStore.getState();
    expect(state.session.sessionCount).toBe(3);
    expect(state.session.dailyStreak).toBeGreaterThanOrEqual(3);
    expect(state.rewards.some((reward) => reward.id === "session_three")).toBe(true);
    expect(state.rewards.some((reward) => reward.id === "streak_three")).toBe(true);
  });

  it("toggles reminders, persists changes, and logs the action", async () => {
    await act(async () => {
      useAppStore.getState().toggleReminders(true);
    });

    const state = useAppStore.getState();
    expect(state.notifications.remindersEnabled).toBe(true);
    expect(logInfo).toHaveBeenCalledWith("Reminders enabled", { context: "notifications" });

    const setItemMock = AsyncStorage.setItem as jest.Mock;
    expect(setItemMock).toHaveBeenCalled();
    const [, payload] = setItemMock.mock.calls[setItemMock.mock.calls.length - 1];
    const persisted = JSON.parse(payload);
    expect(persisted.state.notifications.remindersEnabled).toBe(true);
  });

  it("hydrates reminder settings and updates scheduled notifications", async () => {
    const persistedState = {
      state: {
        ...getDefaultAppState(),
        notifications: {
          remindersEnabled: true,
          reminderTime: "09:00",
          lastScheduledAt: "2024-01-01T09:00:00.000Z",
        },
      },
      version: 0,
    };

    await AsyncStorage.setItem(storageKey, JSON.stringify(persistedState));
    (AsyncStorage.setItem as jest.Mock).mockClear();

    await act(async () => {
      await persist.rehydrate();
    });

    expect(useAppStore.getState().notifications).toEqual({
      remindersEnabled: true,
      reminderTime: "09:00",
      lastScheduledAt: "2024-01-01T09:00:00.000Z",
    });

    await act(async () => {
      useAppStore.getState().setReminderTime("21:30");
      useAppStore.getState().registerNotificationSchedule("2024-01-02T10:00:00.000Z");
    });

    const { notifications } = useAppStore.getState();
    expect(notifications.reminderTime).toBe("21:30");
    expect(notifications.lastScheduledAt).toBe("2024-01-02T10:00:00.000Z");

    const setItemMock = AsyncStorage.setItem as jest.Mock;
    expect(setItemMock).toHaveBeenCalled();
    const [, payload] = setItemMock.mock.calls[setItemMock.mock.calls.length - 1];
    const persisted = JSON.parse(payload);
    expect(persisted.state.notifications.reminderTime).toBe("21:30");
    expect(persisted.state.notifications.lastScheduledAt).toBe("2024-01-02T10:00:00.000Z");
  });
});
