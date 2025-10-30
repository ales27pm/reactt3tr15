import { device, element, by, expect, waitFor } from "detox";

const completeOnboardingFlow = async () => {
  await expect(element(by.id("onboarding-intro-get-started"))).toBeVisible();
  await element(by.id("onboarding-intro-get-started")).tap();

  await expect(element(by.id("onboarding-permissions-skip"))).toBeVisible();
  await element(by.id("onboarding-permissions-skip")).tap();

  await expect(element(by.id("onboarding-tutorial-finish"))).toBeVisible();
  await element(by.id("onboarding-tutorial-finish")).tap();
};

describe("Controller input smoke test", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await completeOnboardingFlow();
  });

  it("responds to controller events without breaking the main loop", async () => {
    await expect(element(by.id("tetris-screen"))).toBeVisible();
    await expect(element(by.id("tetris-playfield"))).toBeVisible();
    await expect(element(by.text("Score: 0"))).toBeVisible();

    await element(by.id("controller-debug-hard-drop")).tap();

    await waitFor(element(by.text("Score: 0")))
      .not.toExist()
      .withTimeout(5000);

    await element(by.id("controller-debug-pause")).tap();
    await expect(element(by.text("RESUME"))).toBeVisible();

    await element(by.id("controller-debug-pause")).tap();
    await expect(element(by.text("PAUSE"))).toBeVisible();
  });
});
