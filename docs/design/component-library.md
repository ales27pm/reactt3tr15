# ReactT3tr15 Design System — NativeWind Implementation

This document codifies the typography, colour palette, spacing, and reusable components that back the Figma files and our React Native implementation.

## Design Tokens

Source of truth: [`src/design-system/tokens.ts`](../../src/design-system/tokens.ts)

| Token Group           | Description                                                                                                    | Usage                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `palette`             | Brand, neutral, semantic, and surface colour scales aligned with accessibility contrast ratios (AA or higher). | `tailwind.config.js` + NativeWind utility classes (e.g., `bg-brand-600`, `text-neutral-400`). |
| `typography`          | Font families, size scale, line heights, and letter-spacing for consistent text rendering.                     | `Typography` component + `className` helpers (`text-body-md`, `font-semibold`).               |
| `spacing`             | Rhythm scale (4px base) for padding, margin, and gap utilities.                                                | `space-*` classes and layout primitives (`Surface`, `Card`).                                  |
| `radii` & `elevation` | Corner radii + iOS/Android-friendly shadow presets.                                                            | `Surface` + `Card` components; tailwind classes `rounded-3xl`, `shadow-elevated`.             |

## NativeWind Theme Extensions

`tailwind.config.js` extends the default preset with:

- `colors.brand` / `colors.surface` / `colors.text` / `colors.accent` / `colors.success|warning|danger|info`.
- Font families (`fontFamily`) mapped to platform-specific system fonts for zero-config usage.
- Additional `spacing` steps (18, 22, 26, 30, 34) and `borderRadius` tokens for card surfaces.
- Custom shadows (`shadow-outline`, `shadow-elevated`) for consistent depth.

## Component Library

Reusable components live under [`src/design-system/components`](../../src/design-system/components/).

### `Typography`

- Variants: `display`, `headline`, `title`, `body`, `caption`, `overline`.
- Weights: `regular`, `medium`, `semibold`, `bold`.
- Colour tokens: `default`, `muted`, `inverse`, `brand`, `danger`, `success`.
- Automatically applies accessibility-friendly line heights and wraps `nativewind` text utilities.

### `Button`

- Variants: `primary`, `secondary`, `tertiary`, `ghost`, `danger`.
- Sizes: `sm`, `md`, `lg` with horizontal padding + height tied to spacing tokens.
- Includes animated press feedback via [`useScalePressFeedback`](../../src/design-system/animations/useScalePressFeedback.ts) using Reanimated.
- Supports leading/trailing icons, loading state, and merges custom `className` overrides with defaults.

### `Surface`

- Variants: `raised`, `sunken`, `translucent`.
- States: `selected`, `warning`, `danger` apply accent outlines or background tints.
- Wraps `View` with motion-ready shadow styles to create cards, modals, and drawers.

### Token Consumption Patterns

- Components expose `resolve*Classes` helpers that power Jest snapshot tests for deterministic styling.
- Teams implementing new UI should compose `Surface` + `Typography` + `Button` before reaching for bespoke styles.

## Implementation Checklist

1. Import tokens from `src/design-system/tokens` when configuring additional theming (e.g., `react-navigation` theme objects).
2. Use `className` utilities (NativeWind) for layout; avoid inline styles to keep parity with design tokens.
3. When adding new components, expose resolver functions for testability and update this document.
4. Keep `tailwind.config.js` as the single bridging layer—avoid duplicating literal values in components.

## Asset Delivery to Figma

- Tokens are synced using Figma Variables (Light/Dark). Exported JSON is attached in the same folder for reference (`tokens.json`).
- Component variants correspond to Auto Layout components in the `Design System` page of the Figma file.

For questions or updates, contact the design systems maintainers on the `#design-system` Slack channel.
