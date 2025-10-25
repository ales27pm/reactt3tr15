import { afterAll, afterEach, beforeAll, beforeEach, jest } from "@jest/globals";
import detox from "detox";
import adapter from "detox/runners/jest/adapter";

jest.setTimeout(120000);

beforeAll(async () => {
  await detox.init(undefined, { launchApp: false });
});

afterAll(async () => {
  await detox.cleanup();
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterEach(async () => {
  await adapter.afterEach();
});
