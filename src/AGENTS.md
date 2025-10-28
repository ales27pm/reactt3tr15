# src Implementation Guide

Scope: applies to all source files under `src/`, except where more specific nested AGENTS files override these rules.

## Patterns & Styling
- Author components and utilities in TypeScript with explicit types—lean on inference but avoid `any`.
- Use NativeWind tailwind classes and the design system tokens for styling. Refrain from inline magic numbers unless grounded in tokens or well-documented calculations.
- Co-locate unit tests within `__tests__` directories. Use Jest with React Testing Library or React Native Testing Library helpers as appropriate.

## React & Navigation
- Prefer functional components with hooks. When side effects are needed, wrap them in `useEffect` with well-defined dependency arrays and cancellation guards.
- Extend navigation types in `src/navigation` when introducing screens. Keep deep-link definitions synchronized across platforms.

## State & Utilities
- Access Zustand stores via exported selectors instead of reading the entire store in components. Derive memoized slices to avoid excessive renders.
- Shared utilities in `src/utils` should stay generic and well-tested—avoid scattering bespoke helpers across screens.

## Testing
- Write Jest tests for logic-heavy modules and Detox scenarios when UI flows change. Mirror coverage expectations already established in sibling files.
- Maintain consistent accessibility identifiers so automated tests can target key UI affordances (e.g., onboarding CTAs, pause buttons).
