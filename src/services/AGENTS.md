# src/services Implementation Guide

Scope: service abstractions, network diagnostics facades, and configuration modules in `src/services`.

- Encapsulate platform-specific behaviour within dedicated adapters (see `network/nativeModule.ts`). Provide clear TypeScript interfaces in `types.ts` files and expose a single entry point through `index.ts`.
- Validate inputs rigorously and surface domain-specific errors using helpers from `src/utils/errors.ts`. Do not throw raw errors without context.
- Integrate logging via `logger.ts` and analytics events so diagnostics remain observable.
- Unit test service logic using Jest, mocking native bridges responsibly while still asserting that fallbacks work when permissions or hardware are unavailable.
