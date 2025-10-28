import { useCallback } from "react";
import { useAppStore } from "../../state/appStore";
import { ONBOARDING_STEPS } from "../constants";

export const useOnboardingJourney = () => {
  const onboarding = useAppStore((state) => state.onboarding);
  const advanceStep = useAppStore((state) => state.advanceOnboarding);
  const complete = useAppStore((state) => state.completeOnboarding);
  const start = useAppStore((state) => state.startOnboarding);

  const startOnboarding = useCallback(() => {
    if (!onboarding.startedAt) {
      start();
    }
  }, [onboarding.startedAt, start]);

  const goToNext = useCallback(() => {
    const nextStep = advanceStep();
    if (!nextStep) {
      complete();
    }
  }, [advanceStep, complete]);

  const skipOnboarding = useCallback(() => {
    complete();
  }, [complete]);

  return {
    onboarding,
    steps: ONBOARDING_STEPS,
    goToNext,
    skipOnboarding,
    startOnboarding,
  };
};
