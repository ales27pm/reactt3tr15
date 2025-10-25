import type { ExpoConfig } from "expo/config";

const appConfig: ExpoConfig = {
  name: "vibecode",
  slug: "vibecode",
  scheme: "vibecode",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    edgeToEdgeEnabled: true,
  },
  plugins: [
    [
      "sentry-expo",
      {
        organization: process.env.SENTRY_ORG ?? "vibecode",
        project: process.env.SENTRY_PROJECT ?? "vibecode-app",
        url: process.env.SENTRY_URL,
        setCommits: false,
        deploy: process.env.SENTRY_DEPLOY,
      },
    ],
  ],
  extra: {
    environment: process.env.EXPO_PUBLIC_APP_ENVIRONMENT ?? "development",
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
    remoteConfigUrl: process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL ?? "https://cdn.vibecode.app/config/v1/mobile.json",
    featureFlagDefaults: {
      networkDiagnostics: true,
      allowPacketCapture: false,
    },
  },
};

export default appConfig;
