import { useCallback, useEffect, useMemo, useRef } from "react";
import { AppState as RNAppState } from "react-native";
import { useAppStore } from "../state/appStore";
import { logInfo } from "../utils/logger";

export type SessionLifecycleHook = {
  beginSession: () => void;
  endSession: (reason?: "manual" | "background") => void;
  sessionCount: number;
  streak: number;
};

export const useMainLoop = (): SessionLifecycleHook => {
  const recordSessionStart = useAppStore((state) => state.recordSessionStart);
  const recordSessionEnd = useAppStore((state) => state.recordSessionEnd);
  const sessionCount = useAppStore((state) => state.session.sessionCount);
  const streak = useAppStore((state) => state.session.dailyStreak);
  const activeSessionStartedAtRef = useRef<number | null>(null);

  const endSession = useCallback(
    (reason: "manual" | "background" = "manual") => {
      if (!activeSessionStartedAtRef.current) {
        return;
      }
      const durationMs = Date.now() - activeSessionStartedAtRef.current;
      const durationSeconds = Math.max(1, Math.round(durationMs / 1000));
      recordSessionEnd(durationSeconds);
      activeSessionStartedAtRef.current = null;
      logInfo(`Session ended (${reason}) after ${durationSeconds}s`, { context: "main-loop" });
    },
    [recordSessionEnd],
  );

  const beginSession = useCallback(() => {
    if (activeSessionStartedAtRef.current) {
      return;
    }
    recordSessionStart();
    activeSessionStartedAtRef.current = Date.now();
    logInfo("Session started", { context: "main-loop" });
  }, [recordSessionStart]);

  useEffect(() => {
    const subscription = RNAppState.addEventListener("change", (status) => {
      if (status === "active") {
        beginSession();
      } else {
        endSession("background");
      }
    });
    return () => subscription.remove();
  }, [beginSession, endSession]);

  useEffect(() => {
    beginSession();
    return () => {
      endSession("manual");
    };
  }, [beginSession, endSession]);

  return useMemo(
    () => ({
      beginSession,
      endSession,
      sessionCount,
      streak,
    }),
    [beginSession, endSession, sessionCount, streak],
  );
};
