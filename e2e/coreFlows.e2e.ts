import { device, element, by, expect } from "detox";

describe("Core onboarding and gameplay flows", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it("completes onboarding and surfaces reminder settings", async () => {
    await expect(element(by.id("onboarding-intro-get-started"))).toBeVisible();
    await element(by.id("onboarding-intro-get-started")).tap();

    await expect(element(by.id("onboarding-permissions-skip"))).toBeVisible();
    await element(by.id("onboarding-permissions-skip")).tap();

    await expect(element(by.id("onboarding-tutorial-finish"))).toBeVisible();
    await element(by.id("onboarding-tutorial-finish")).tap();

    await expect(element(by.id("tab-settings"))).toBeVisible();
    await element(by.id("tab-settings")).tap();

    await expect(element(by.id("settings-reminders-switch"))).toBeVisible();
    await expect(element(by.id("settings-tip-card"))).toBeVisible();
  });
});
