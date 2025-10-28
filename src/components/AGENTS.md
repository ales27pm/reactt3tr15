# src/components Design Guide

Scope: shared UI components under `src/components` and nested directories.

- Compose UI primitives using design-system components (buttons, typography, modal shells) before introducing bespoke styles.
- Ensure every component is platform-aware: guard iOS/Android specific code with `Platform.OS` checks and provide fallbacks for web.
- Prefer controlled props over implicit state. When internal state is required, expose callbacks so consuming screens can persist data.
- Add visual regression coverage via storybook snippets or screenshot tests when modifying reusable UI (coordinate with Detox where applicable).
- Export a single public interface per file. Group supporting helpers within the same module but do not leak them from index barrels unless necessary.
