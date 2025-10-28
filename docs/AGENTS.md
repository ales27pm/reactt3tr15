# docs Authorship Guide

Scope: documentation under `docs/` (game design briefs, scoring notes, UX research).

- Keep documents up to date with the implemented Tetris experience. Whenever mechanics, UI flows, or scoring models change, update the matching markdown source in the same pull request.
- Use descriptive section headings, tables, and bullet lists—avoid placeholder text. Include diagrams or ASCII tables when they clarify gameplay.
- Cross-reference app modules using fully-qualified paths (e.g., `src/state/tetrisStore.ts`) so engineers can trace requirements to code.
- Maintain the roadmap in `docs/roadmap.md` alongside feature work; retire completed items and document new initiatives as they enter development.
- Prefer American English spelling, wrap lines at ~120 characters, and use fenced code blocks for commands or configuration snippets.
