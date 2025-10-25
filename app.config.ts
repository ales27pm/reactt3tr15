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
  plugins: [
    [
      "sentry-expo",
      {
        organization: process.env.SENTRY_ORG ?? "netsight",
        project: process.env.SENTRY_PROJECT ?? "netsight-app",
        url: process.env.SENTRY_URL,
        setCommits: false,
        deploy: process.env.SENTRY_DEPLOY,
      },
    ],
  ],
  extra: {
    environment: process.env.EXPO_PUBLIC_APP_ENVIRONMENT ?? "development",
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
    remoteConfigUrl: process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL ?? "https://cdn.netsight.app/config/v1/mobile.json",
    featureFlagDefaults: {
      networkDiagnostics: true,
      allowPacketCapture: false,
    },
  },
};

export default appConfig;
