import type { ExpoConfig } from "expo/config";

const appConfig: ExpoConfig = {
  name: "Netsight",
  slug: "netsight",
  scheme: "netsight",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  icon: "./assets/app-icon.png",
  splash: {
    image: "./assets/splash.png",
    backgroundColor: "#050b1f",
    resizeMode: "contain",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.anonymous.netsight",
    splash: {
      image: "./assets/splash.png",
      backgroundColor: "#050b1f",
      resizeMode: "contain",
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: "com.anonymous.netsight",
    adaptiveIcon: {
      foregroundImage: "./assets/app-icon.png",
      backgroundColor: "#050b1f",
    },
  },
  extra: {
    environment: process.env.EXPO_PUBLIC_APP_ENVIRONMENT ?? "development",
    leaderboardSyncUrl: process.env.EXPO_PUBLIC_LEADERBOARD_SYNC_URL ?? "https://cdn.reactt3tr15.com/leaderboard.json",
    rewardWebhookUrl: process.env.EXPO_PUBLIC_REWARD_WEBHOOK_URL ?? "https://hooks.reactt3tr15.com/rewards",
  },
};

export default appConfig;
