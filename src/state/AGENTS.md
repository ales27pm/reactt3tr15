# src/state Store Charter

Scope: Zustand stores, engines, and supporting data under `src/state`.

- Maintain immutable state updates; avoid mutating nested objects directly. Use spread syntax or helper utilities to clone state fragments before modification.
- Extend store types precisely. Update `AppStore`, `TetrisStore`, and other exports with exhaustive discriminated unions instead of loose objects.
- Persisted state must include migration paths when structure changes. Introduce versioned persistence or ad-hoc migrations directly in the persistence middleware.
- Every new action or computed helper needs associated Jest coverage in `src/state/__tests__/`. Tests should cover hydration behaviour, persistence, and side effects like reward unlocks or streak tracking.
