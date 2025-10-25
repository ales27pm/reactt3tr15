import { device, element, by, expect } from "detox";

describe("Core onboarding and diagnostics flows", () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it("completes onboarding and surfaces network diagnostics", async () => {
    await expect(element(by.id("onboarding-intro-get-started"))).toBeVisible();
    await element(by.id("onboarding-intro-get-started")).tap();

    await expect(element(by.id("onboarding-permissions-skip"))).toBeVisible();
    await element(by.id("onboarding-permissions-skip")).tap();

    await expect(element(by.id("onboarding-tutorial-finish"))).toBeVisible();
    await element(by.id("onboarding-tutorial-finish")).tap();

    await expect(element(by.id("tab-settings"))).toBeVisible();
    await element(by.id("tab-settings")).tap();

    await expect(element(by.id("settings-reminders-switch"))).toBeVisible();
    await expect(element(by.id("network-diagnostics-card"))).toBeVisible();
    await expect(element(by.id("network-diagnostics-vpn-status"))).toBeVisible();

    const scanButton = element(by.id("network-diagnostics-scan"));
    await expect(scanButton).toBeVisible();
    await scanButton.tap();
    await expect(element(by.id("network-diagnostics-list-empty"))).toBeVisible();
  });
});
