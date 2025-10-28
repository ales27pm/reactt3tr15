# React T3TR15 Roadmap

This roadmap captures the next wave of production work based on the current codebase. Every item references the
modules that will be affected so engineers can jump straight into implementation.

## Gameplay Enhancements (High Priority)

1. **Adaptive difficulty curve**
   - Extend `src/state/tetrisStore.ts` to factor combo streaks and lock delays into level progression.
   - Mirror the new progression rules in `src/state/__tests__/tetrisStore.test.ts` to lock behaviour.
   - Surface the live difficulty tier inside `src/screens/TetrisScreen.tsx` so players understand speed shifts.
2. **Controller support**
   - Introduce an input adapter in `src/utils/input.ts` that maps gamepad events into store actions.
   - Update `src/screens/TetrisScreen.tsx` to register the adapter with `react-native-game-controller`.
   - Add QA coverage with Detox to ensure controller-connected devices pass the main loop smoke test.

## Retention & Rewards (Medium Priority)

1. **Weekly missions**
   - Persist mission definitions alongside rewards in `src/state/appStore.ts` (add migrations for new fields).
   - Expand `src/rewards/rewardEngine.ts` with mission evaluation helpers and write unit tests in
     `src/rewards/__tests__/rewardEngine.test.ts`.
   - Surface mission progress in `src/screens/Rewards/RewardsScreen.tsx` with accessible progress meters.
2. **Push notification experiments**
   - Implement notification categories in `src/notifications/notificationService.ts` (quiet hours, streak alerts).
   - Add settings toggles and analytics logging within `src/screens/Notifications/NotificationSettingsScreen.tsx`.
   - Coordinate with iOS entitlement updates in `ios/ReactT3TR15/Info.plist` and Android channel definitions under
     `android/app/src/main/AndroidManifest.xml`.

## Quality & Tooling (Ongoing)

1. **Performance profiling**
   - Instrument frame timings in `src/screens/TetrisScreen.tsx` and ship metrics to the logging pipeline via
     `src/utils/logger.ts`.
   - Document profiler setup in `docs/performance-playbook.md` (to be created) once tooling stabilises.
2. **Agent manifest hardening**
   - Extend `scripts/manage-agents.mjs` to assert that every scoped directory has a matching entry in the manifest.
   - Add CI coverage ensuring `npm run agent:sync` runs cleanly before merges.

## Documentation Follow-Ups

- Refresh onboarding copywriting guidelines in `docs/onboarding-style.md` after the new missions land.
- Keep the testing checklist aligned with new Detox scenarios and the upcoming controller support suite.
