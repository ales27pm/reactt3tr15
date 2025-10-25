# Animation & Micro-Interaction Specs

This spec translates the motion prototypes from the Figma `Prototype` page into production-ready guidelines. The reference implementation lives in [`src/design-system/animations`](../../src/design-system/animations).

## Press Feedback

- **Component**: Primary CTA buttons, quick-action chips.
- **Prototype**: Smart animate scale from 100% → 96% over 120ms, ease-out.
- **Implementation**: [`useScalePressFeedback`](../../src/design-system/animations/useScalePressFeedback.ts) hook wraps Reanimated shared values. Buttons adopt it by default.

### Interaction Contract

| State     | Animation                                                             | Notes                                    |
| --------- | --------------------------------------------------------------------- | ---------------------------------------- |
| Press In  | Scale to `0.96` using `withTiming` (120ms, `Easing.out(Easing.quad)`) | Triggered on `onPressIn`.                |
| Press Out | Return to `1` using `withTiming` (160ms, `Easing.out(Easing.cubic)`)  | Cancelled when disabled/loading.         |
| Disabled  | Opacity locked at `0.48`.                                             | Ensures clarity against surface colours. |

## Screen Transitions

- **Onboarding**: Figma prototype uses slide-left transitions. In code we map to React Navigation `SlideFromRightIOS` with 280ms duration.
- **Live Capture Drawer**: Bottom sheet uses 24px overshoot bounce (Gorhom bottom sheet). Figma Smart Animate replicates height change using same curve.

## Data Tile Micro-interaction

- Tiles pulse using a colour transition `bg-surface-50 → bg-brand-50` with opacity 0.14 during live capture events.
- Implementation target: `react-native-reanimated` colour interpolation keyed off WebSocket sample rate.

## Haptic Pairings

- Primary success CTA: `expo-haptics` `selectionAsync` triggered on release.
- Critical alerts: `notificationError` pattern to align with danger palette.

## Accessibility Considerations

- Animations respect reduced motion: wrap invocation in `useReducedMotion` (React Native Reanimated) and disable scale transitions when `true`.
- Minimum contrast maintained thanks to palette choices—no text sits below 4.5:1 ratio during animated states.

## QA Checklist

1. Verify animation timings against the Figma prototype using video capture (Figma mirror + Simulator).
2. Test with VoiceOver/TalkBack enabled to ensure focus does not skip while animations run.
3. Confirm haptics do not trigger when `Platform.OS === "web"` or when system haptics disabled.

Refer to [`usability-testing.md`](./usability-testing.md) for participant feedback on these interactions.
