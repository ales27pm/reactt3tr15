# React T3TR15 Game Overview

React T3TR15 delivers a neon-soaked homage to classic Tetris. The app focuses on fast gameplay, snappy controls, and rewarding streaks. This document captures the current player experience.

## Core Loop
- **Drop Blocks:** Tap or swipe to move, rotate, and hard drop falling tetrominoes. Gravity accelerates as levels increase.
- **Clear Lines:** Clearing multiple lines at once increases the score multiplier and charges the glitch effects available in accessibility settings.
- **Session Tracking:** Each play session is recorded in `src/state/appStore.ts`. Sessions update streaks, total time played, and feed into reward-unlocking logic.

## Player Progression
- **Rewards:** The reward engine in `src/rewards/rewardEngine.ts` unlocks achievements for onboarding, consecutive sessions, and streak milestones. Rewards surface in the Rewards tab.
- **Matrix Styling:** Visual effects such as matrix rain, ghost pieces, and slash trails are configurable from the play screen settings overlay.
- **Reminders:** Daily reminder scheduling lives in `src/screens/Notifications/NotificationSettingsScreen.tsx` and `src/notifications/notificationService.ts`. Reminders help players maintain streaks without external services.

## Navigation & Onboarding
- **Onboarding Flow:** Screens under `src/screens/Onboarding` walk new players through the controls and optional reminder permissions. Completion flips the main navigator to the tab layout.
- **Main Tabs:** `src/navigation/MainTabsNavigator.tsx` exposes Play, Rewards, and Settings. Each tab uses explicit `testID` attributes so Detox can validate the critical flows.

## Testing Checklist
- Run `npm run typecheck`, `npm run lint`, and `npm test` before shipping changes.
- When modifying onboarding or navigation, execute the Detox script in `e2e/coreFlows.e2e.ts` to confirm the happy path still works.
