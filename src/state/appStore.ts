import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { differenceInCalendarDays } from "date-fns";
import { evaluateRewards } from "../rewards/rewardEngine";
import { getNextStep, ONBOARDING_STEPS, type OnboardingStep } from "../onboarding/constants";
import { logInfo } from "../utils/logger";

export type Reward = {
  id: string;
  title: string;
  description: string;
  points: number;
  earnedAt: string;
};

type OnboardingState = {
  currentStep: OnboardingStep;
  completed: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

type SessionState = {
  sessionCount: number;
  totalPlaySeconds: number;
  activeSessionStartedAt: string | null;
  lastSessionAt: string | null;
  dailyStreak: number;
  lastSessionDay: string | null;
  recentSessions: string[];
};

type NotificationState = {
  remindersEnabled: boolean;
  reminderTime: string | null;
  lastScheduledAt: string | null;
};

export type AppState = {
  onboarding: OnboardingState;
  session: SessionState;
  rewards: Reward[];
  notifications: NotificationState;
};

type AppActions = {
  startOnboarding: () => void;
  advanceOnboarding: () => OnboardingStep | null;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  recordSessionStart: () => void;
  recordSessionEnd: (durationSeconds: number) => void;
  toggleReminders: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
  registerNotificationSchedule: (timestamp: string | null) => void;
  setHasHydrated: (value: boolean) => void;
};

export type AppStore = AppState & { hasHydrated: boolean } & AppActions;

const defaultState: AppState = {
  onboarding: {
    currentStep: ONBOARDING_STEPS[0],
    completed: false,
    startedAt: null,
    completedAt: null,
  },
  session: {
    sessionCount: 0,
    totalPlaySeconds: 0,
    activeSessionStartedAt: null,
    lastSessionAt: null,
    dailyStreak: 0,
    lastSessionDay: null,
    recentSessions: [],
  },
  rewards: [],
  notifications: {
    remindersEnabled: false,
    reminderTime: "20:00",
    lastScheduledAt: null,
  },
};

export const getDefaultAppState = (): AppState => JSON.parse(JSON.stringify(defaultState));

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      hasHydrated: false,
      startOnboarding: () => {
        const startedAt = new Date().toISOString();
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            startedAt: state.onboarding.startedAt ?? startedAt,
          },
        }));
      },
      advanceOnboarding: () => {
        let nextStep: OnboardingStep | null = null;
        set((state) => {
          nextStep = getNextStep(state.onboarding.currentStep);
          if (!nextStep) {
            return {};
          }
          return {
            onboarding: {
              ...state.onboarding,
              currentStep: nextStep,
            },
          } satisfies Partial<AppState>;
        });
        return nextStep;
      },
      completeOnboarding: () => {
        const completedAt = new Date().toISOString();
        let unlockedCount = 0;
        set((state) => {
          if (state.onboarding.completed) {
            return state;
          }
          const updatedState: AppState = {
            ...state,
            onboarding: {
              ...state.onboarding,
              completed: true,
              completedAt,
            },
          };
          const unlocked = evaluateRewards(updatedState, state.rewards);
          unlockedCount = unlocked.length;
          return {
            ...updatedState,
            rewards: [...state.rewards, ...unlocked],
          };
        });
        logInfo("Onboarding completed", { context: "onboarding" }, { completedAt, rewardsUnlocked: unlockedCount });
      },
      resetOnboarding: () => {
        set((state) => ({
          onboarding: {
            ...defaultState.onboarding,
            startedAt: null,
          },
          session: {
            ...state.session,
            sessionCount: 0,
            dailyStreak: 0,
            totalPlaySeconds: 0,
            recentSessions: [],
            activeSessionStartedAt: null,
            lastSessionAt: null,
            lastSessionDay: null,
          },
        }));
      },
      recordSessionStart: () => {
        const startedAt = new Date().toISOString();
        set((state) => ({
          session: {
            ...state.session,
            activeSessionStartedAt: startedAt,
          },
        }));
        logInfo("Session started", { context: "session" }, { startedAt });
      },
      recordSessionEnd: (durationSeconds: number) => {
        const endedAt = new Date().toISOString();
        let unlockedCount = 0;
        let newDailyStreak = 1;
        set((state) => {
          const lastSessionDay = state.session.lastSessionDay;
          const currentDay = endedAt.slice(0, 10);
          if (lastSessionDay) {
            const diff = differenceInCalendarDays(new Date(endedAt), new Date(`${lastSessionDay}T00:00:00Z`));
            newDailyStreak = diff === 0 ? state.session.dailyStreak : diff === 1 ? state.session.dailyStreak + 1 : 1;
          }

          const sessionCount = state.session.sessionCount + 1;
          const totalPlaySeconds = state.session.totalPlaySeconds + durationSeconds;
          const recentSessions = [...state.session.recentSessions, endedAt].slice(-14);

          const updatedState: AppState = {
            ...state,
            session: {
              sessionCount,
              totalPlaySeconds,
              activeSessionStartedAt: null,
              lastSessionAt: endedAt,
              dailyStreak: newDailyStreak,
              lastSessionDay: currentDay,
              recentSessions,
            },
          };

          const unlocked = evaluateRewards(updatedState, state.rewards);
          unlockedCount = unlocked.length;

          return {
            ...updatedState,
            rewards: [...state.rewards, ...unlocked],
          };
        });

        logInfo("Session completed", { context: "session" }, {
          endedAt,
          durationSeconds,
          sessionCount: get().session.sessionCount,
          streak: get().session.dailyStreak,
          rewardsUnlocked: unlockedCount,
        });
      },
      toggleReminders: (enabled) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            remindersEnabled: enabled,
          },
        }));
        logInfo(`Reminders ${enabled ? "enabled" : "disabled"}`, { context: "notifications" });
      },
      setReminderTime: (time) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            reminderTime: time,
          },
        }));
      },
      registerNotificationSchedule: (timestamp) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            lastScheduledAt: timestamp,
          },
        }));
      },
      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboarding: state.onboarding,
        session: state.session,
        rewards: state.rewards,
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHasHydrated?.(true);
        }
      },
    },
  ),
);

export const useAppSelector = <T>(selector: (state: AppState) => T) => useAppStore(selector);
