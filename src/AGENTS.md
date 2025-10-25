# src Implementation Guide

Scope: applies to all source files under `src/`, except where more specific nested AGENTS files override these rules.

## Patterns & Styling
- Author components and utilities in TypeScript with explicit types—enable strict inference rather than relying on `any`.
- Lean on NativeWind tailwind classes and the design system tokens for styling consistency. Refrain from inline magic numbers unless grounded in tokens or documented calculations.
- Co-locate unit tests within `__tests__` directories. Use Jest with React Testing Library or node test utilities as appropriate.

## React & Navigation
- Prefer functional components with hooks. When side effects are needed, wrap them in `useEffect` with well-defined dependency arrays and cancellation guards.
- Extend navigation types in `src/navigation` when introducing screens. Keep deep-linking definitions synchronized across platforms.

## State & Services
- Access Zustand stores via exported selectors instead of reading the entire store in components. Derive memoized slices to avoid excessive renders.
- Service modules under `src/services` should expose typed async APIs with comprehensive error handling and logging through `logger.ts`.

## Testing & Instrumentation
- Write Jest tests for logic-heavy modules and Detox scenarios when UI flows change. Mirror coverage expectations already established in sibling files.
- Emit analytics events and monitoring signals consistently—when adding new flows, update analytics schemas and ensure opt-in/opt-out respect persists.
