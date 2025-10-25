import { differenceInCalendarDays, parseISO } from "date-fns";
import { logDebug } from "../utils/logger";
import type { AppState, Reward } from "../state/appStore";

export type RewardDefinition = {
  id: string;
  title: string;
  description: string;
  points: number;
  once?: boolean;
  condition: (state: AppState) => boolean;
};

const rewardDefinitions: RewardDefinition[] = [
  {
    id: "onboarding_complete",
    title: "Welcome Aboard",
    description: "Completed onboarding",
    points: 100,
    once: true,
    condition: (state) => state.onboarding.completed,
  },
  {
    id: "session_first",
    title: "First Session",
    description: "Finished your first play session",
    points: 200,
    once: true,
    condition: (state) => state.session.sessionCount >= 1 && !!state.session.lastSessionAt,
  },
  {
    id: "session_three",
    title: "Getting the Hang",
    description: "Completed three sessions",
    points: 350,
    once: true,
    condition: (state) => state.session.sessionCount >= 3,
  },
  {
    id: "streak_three",
    title: "3-Day Streak",
    description: "Played three days in a row",
    points: 500,
    once: true,
    condition: (state) => state.session.dailyStreak >= 3,
  },
  {
    id: "weekly_engagement",
    title: "Weekly Warrior",
    description: "Completed five sessions within seven days",
    points: 650,
    once: true,
    condition: (state) => {
      const dates = state.session.recentSessions
        .map((isoDate) => parseISO(isoDate))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      if (dates.length < 5) {
        return false;
      }

      let left = 0;
      for (let right = 0; right < dates.length; right += 1) {
        while (differenceInCalendarDays(dates[right], dates[left]) > 6) {
          left += 1;
        }
        if (right - left + 1 >= 5) {
          return true;
        }
      }

      return false;
    },
  },
];

export const evaluateRewards = (state: AppState, existingRewards: Reward[]): Reward[] => {
  const existingIds = new Set(existingRewards.map((reward) => reward.id));
  const unlocked: Reward[] = [];
  const nowIso = new Date().toISOString();

  rewardDefinitions.forEach((definition) => {
    if (definition.once && existingIds.has(definition.id)) {
      return;
    }

    if (definition.condition(state)) {
      const reward: Reward = {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        points: definition.points,
        earnedAt: nowIso,
      };
      existingIds.add(reward.id);
      unlocked.push(reward);
    }
  });

  if (unlocked.length > 0) {
    logDebug(`Unlocked ${unlocked.length} reward(s)`, { context: "rewards" });
  }

  return unlocked;
};
