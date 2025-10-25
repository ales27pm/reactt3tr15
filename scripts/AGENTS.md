# scripts Maintenance Guide

Scope: automation, tooling, and helper scripts in `scripts/`.

- Write Node scripts using modern ES modules. Prefer async/await with explicit error surfaces and exit codes.
- Provide idempotent behaviour—rerunning a script should not produce divergent outcomes (e.g., `manage-agents.mjs` writes files only when content changes).
- Document usage in script headers or README updates, and expose npm script aliases (see `package.json`).
- Log actionable messages via `console.info`/`console.error` so CI and developers understand the outcome.
