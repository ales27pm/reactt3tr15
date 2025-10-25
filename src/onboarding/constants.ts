export const ONBOARDING_STEPS = ["intro", "permissions", "tutorial"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const getNextStep = (current: OnboardingStep): OnboardingStep | null => {
  const idx = ONBOARDING_STEPS.indexOf(current);
  if (idx === -1) {
    return ONBOARDING_STEPS[0];
  }
  return ONBOARDING_STEPS[idx + 1] ?? null;
};
