import type { ExpoConfig } from "expo/config";

const appConfig: ExpoConfig = {
  name: "Netsight",
  slug: "netsight",
  scheme: "netsight",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.anonymous.netsight",
  },
  android: {
    edgeToEdgeEnabled: true,
    package: "com.anonymous.netsight",
  },
  extra: {
    environment: process.env.EXPO_PUBLIC_APP_ENVIRONMENT ?? "development",
    leaderboardSyncUrl: process.env.EXPO_PUBLIC_LEADERBOARD_SYNC_URL ?? "https://cdn.reactt3tr15.com/leaderboard.json",
    rewardWebhookUrl: process.env.EXPO_PUBLIC_REWARD_WEBHOOK_URL ?? "https://hooks.reactt3tr15.com/rewards",
  },
};

export default appConfig;
