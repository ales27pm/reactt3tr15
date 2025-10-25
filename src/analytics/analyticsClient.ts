import { Platform } from "react-native";
import * as Application from "expo-application";
import { Buffer } from "buffer";
import { logDebug, logError, logInfo, logWarn } from "../utils/logger";

type SegmentPayload = {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  anonymousId?: string;
};

type FirebasePayload = {
  client_id: string;
  events: Array<{
    name: string;
    params?: Record<string, unknown>;
  }>;
  timestamp_micros?: number;
};

export type RetentionEventName =
  | "Onboarding Started"
  | "Onboarding Step Advanced"
  | "Onboarding Completed"
  | "Session Started"
  | "Session Completed"
  | "Reward Unlocked"
  | "Notification Scheduled"
  | "Notification Opt-Out"
  | "Analytics Opt-In"
  | "Analytics Opt-Out"
  | "Analytics Error";

export type RetentionEvent = {
  name: RetentionEventName;
  properties?: Record<string, unknown>;
};

type AnalyticsConfiguration = {
  enabled: boolean;
  userId?: string;
};

let configuration: AnalyticsConfiguration = {
  enabled: false,
};

const SEGMENT_WRITE_KEY = process.env.EXPO_PUBLIC_SEGMENT_WRITE_KEY;
const FIREBASE_MEASUREMENT_ID = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID;

const encodeBase64 = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  return Buffer.from(value, "utf8").toString("base64");
};

const convertEventNameToFirebase = (name: RetentionEventName) => {
  const normalized =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "event";
  return /^[a-z]/.test(normalized) ? normalized : `e_${normalized}`.slice(0, 40);
};

let cachedUserId: string | null = null;

const resolveUserId = async () => {
  if (cachedUserId) {
    return cachedUserId;
  }

  try {
    if (Platform.OS === "android" && Application.androidId) {
      cachedUserId = `android-${Application.androidId}`;
      return cachedUserId;
    }

    if (Platform.OS === "ios") {
      const vendorId = await Application.getIosIdForVendorAsync();
      if (vendorId) {
        cachedUserId = `ios-${vendorId}`;
        return cachedUserId;
      }
    }
  } catch (error) {
    logWarn("Unable to resolve vendor identifier", { context: "analytics" }, error as Error);
  }

  try {
    const installTime = await Application.getInstallationTimeAsync();
    if (installTime) {
      cachedUserId = `install-${installTime.getTime()}`;
      return cachedUserId;
    }
  } catch (error) {
    logWarn("Unable to fetch installation timestamp", { context: "analytics" }, error as Error);
  }

  cachedUserId = `anon-${Date.now()}`;
  return cachedUserId;
};

export const configureAnalytics = (config: Partial<AnalyticsConfiguration>) => {
  configuration = { ...configuration, ...config };
  logInfo(`Analytics ${configuration.enabled ? "enabled" : "disabled"}`, { context: "analytics" });
};

const sendToSegment = async (payload: SegmentPayload) => {
  if (!SEGMENT_WRITE_KEY) {
    logDebug("Segment write key not provided; skipping", { context: "analytics" });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch("https://api.segment.io/v1/track", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBase64(`${SEGMENT_WRITE_KEY}:`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Segment error: ${response.status} ${errorText}`);
    }

    logDebug(`Segment event sent: ${payload.event}`, { context: "analytics" });
  } catch (error) {
    logError("Segment dispatch failed", { context: "analytics" }, error as Error);
  } finally {
    clearTimeout(timeout);
  }
};

let firebaseDispatchWarningLogged = false;

const sendToFirebase = async (payload: FirebasePayload) => {
  if (!FIREBASE_MEASUREMENT_ID) {
    logDebug("Firebase measurement ID not provided; skipping", { context: "analytics" });
    return;
  }

  if (!firebaseDispatchWarningLogged) {
    logInfo("Firebase dispatch disabled; configure a secure proxy to enable", { context: "analytics" });
    firebaseDispatchWarningLogged = true;
  }

  logDebug("Firebase payload skipped", {
    context: "analytics",
    measurementConfigured: Boolean(FIREBASE_MEASUREMENT_ID),
    eventCount: payload.events.length,
    firstEvent: payload.events[0]?.name,
  });
};

export const trackRetentionEvent = async ({ name, properties }: RetentionEvent) => {
  if (!configuration.enabled) {
    logDebug(`Analytics disabled; skipping event ${name}`, { context: "analytics" });
    return;
  }

  const resolvedUserId = await resolveUserId();
  const configuredUserId = configuration.userId ?? undefined;
  const timestamp_micros = Date.now() * 1000;

  const segmentPayload: SegmentPayload = {
    event: name,
    properties,
    ...(configuredUserId ? { userId: configuredUserId } : { anonymousId: resolvedUserId }),
  };

  const firebasePayload: FirebasePayload = {
    client_id: resolvedUserId,
    timestamp_micros,
    events: [
      {
        name: convertEventNameToFirebase(name),
        params: properties,
      },
    ],
  };

  await Promise.all([sendToSegment(segmentPayload), sendToFirebase(firebasePayload)]);
};

export const trackRetentionError = async (error: Error, context: string) => {
  logError(error.message, { context: `analytics:${context}` }, error);
  await trackRetentionEvent({
    name: "Analytics Error",
    properties: {
      context,
      message: error.message,
    },
  });
};
