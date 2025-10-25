import { useCallback } from "react";
import { useAppStore } from "../../state/appStore";
import { trackRetentionEvent } from "../../analytics/analyticsClient";
import { ONBOARDING_STEPS } from "../constants";

export const useOnboardingJourney = () => {
  const onboarding = useAppStore((state) => state.onboarding);
  const advanceStep = useAppStore((state) => state.advanceOnboarding);
  const complete = useAppStore((state) => state.completeOnboarding);
  const start = useAppStore((state) => state.startOnboarding);

  const startOnboarding = useCallback(() => {
    if (!onboarding.startedAt) {
      start();
      void trackRetentionEvent({
        name: "Onboarding Started",
        properties: {
          step: onboarding.currentStep,
        },
      });
    }
  }, [onboarding.currentStep, onboarding.startedAt, start]);

  const goToNext = useCallback(() => {
    const nextStep = advanceStep();
    void trackRetentionEvent({
      name: "Onboarding Step Advanced",
      properties: {
        step: nextStep ?? "complete",
      },
    });
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
