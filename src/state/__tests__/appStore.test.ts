import { act } from "react-test-renderer";
import { useAppStore, getDefaultAppState } from "../appStore";

describe("appStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    const current = useAppStore.getState();
    useAppStore.setState(
      {
        ...current,
        ...getDefaultAppState(),
        hasHydrated: false,
      },
      true,
    );
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
});
