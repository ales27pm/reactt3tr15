# React T3TR15 Game Overview

React T3TR15 delivers a neon-soaked homage to classic Tetris. The production build focuses on fast gameplay,
reliable session tracking, and reward-driven retention. This document reflects the current implementation.

## Gameplay Systems

- **Core engine:** `src/state/tetrisStore.ts` orchestrates the falling piece lifecycle, hold queue, combo tracking,
  and lock-delay flow. It relies on `src/state/engine.ts` for Super Rotation System kicks, scoring math, and ghost
  drop projections.
- **Piece randomisation:** The store uses a 7-bag generator (`generateBag` in `src/state/tetrisStore.ts`) to
  maintain fair distributions while ensuring the upcoming queue stays at least fourteen pieces ahead.
- **Line clears & scoring:** `clearLines` and `calculateScore` in `src/state/engine.ts` power soft-drop bonuses,
  combo multipliers, and back-to-back rewards surfaced by the store when locking a piece.
- **Visual FX:** The playfield toggles matrix rain (`src/components/MatrixRain.tsx`), slash trails
  (`src/components/SlashTrail.tsx`), ASCII rendering (`src/utils/ascii.ts`), and scanline glitches controlled via
  state flags.

## Controls & Feedback (`src/screens/TetrisScreen.tsx`)

- **Gestures:** The screen wires swipe, tap, and double-tap gestures through `react-native-gesture-handler` to call
  store actions for soft drops, hard drops, horizontal movement, holds, and rotations.
- **Timing loop:** `useMainLoop` provides session lifecycle hooks, while a `requestAnimationFrame` loop manages
  gravity pacing with acceleration derived from the current level. Gravity honours lock delay using
  `LOCK_DELAY_MS` in the store.
- **Haptics & audio:** Haptics trigger on iOS through `Vibration`, gated by `enableHaptics`. SFX playback routes
  through `src/utils/sfx.ts` and respects the `enableSfx` toggle persisted in the store.
- **Accessibility:** Gridlines, ghost projection, hints, and ASCII glyphs all gate on persistent toggles so players
  can tailor readability.

## Session Lifecycle & Progression

- **Main loop integration:** `src/mainLoop/useMainLoop.ts` listens to the React Native `AppState` to automatically
  start and end sessions, logging the session duration through `useAppStore` actions.
- **Persistent state:** `src/state/appStore.ts` persists onboarding, session history, notification preferences, and
  earned rewards via `zustand` + AsyncStorage. Recent sessions and streak counters feed retention analytics.
- **Reward engine:** `src/rewards/rewardEngine.ts` evaluates streaks (daily and weekly), total sessions, and
  onboarding completion to issue point-bearing rewards displayed in `src/screens/Rewards/RewardsScreen.tsx`.

## Navigation & Onboarding

- **Navigator structure:** `src/navigation/AppNavigator.tsx` routes between `OnboardingNavigator` and
  `MainTabsNavigator` after hydration. Main tabs expose Play, Rewards, and Settings, each annotated with
  deterministic `tabBarButtonTestID` props for Detox.
- **Onboarding journey:** Screens under `src/screens/Onboarding` coordinate through
  `src/onboarding/hooks/useOnboardingJourney.ts`. The flow collects notification consent, schedules reminders via
  `src/notifications/notificationService.ts`, and surfaces advanced play tips before launching the main tabs.

## Notifications & Retention

- **Settings screen:** `src/screens/Notifications/NotificationSettingsScreen.tsx` lets players toggle reminders,
  reschedule the daily ping, and review the last scheduling timestamp. All actions log outcomes for debugging via
  `src/utils/logger.ts`.
- **Reminder orchestration:** `scheduleDailyReminder`, `cancelScheduledReminders`, and
  `requestNotificationPermissions` (in `src/notifications/notificationService.ts`) centralise platform-specific
  handling so both onboarding and settings reuse the same code path.

## Testing & Quality Gates

- **Automated checks:** Run `npm run typecheck`, `npm run lint`, and `npm test` before shipping changes. Detox specs
  in `e2e/coreFlows.e2e.ts` cover onboarding and the primary gameplay happy path.
- **Logging:** `src/utils/logger.ts` wraps `console` with contextual metadata to simplify log correlation across
  navigation, sessions, notifications, and rewards.
