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
      if (state.session.recentSessions.length < 5) {
        return false;
      }
      const first = parseISO(state.session.recentSessions[0]);
      const last = parseISO(state.session.recentSessions[state.session.recentSessions.length - 1]);
      return differenceInCalendarDays(last, first) <= 6;
    },
  },
];

export const evaluateRewards = (state: AppState, existingRewards: Reward[]): Reward[] => {
  const existingIds = new Set(existingRewards.map((reward) => reward.id));
  const unlocked: Reward[] = [];

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
        earnedAt: new Date().toISOString(),
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
