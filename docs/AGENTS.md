# docs Authorship Guide

Scope: documentation under `docs/` (product briefs, design artefacts, network setup guides).

- Keep documents up to date with the implemented product. Whenever logic, flows, or research inputs change, update the matching markdown source in the same pull request.
- Use descriptive section headings, tables, and bullet lists—avoid placeholder text. Include architecture diagrams or sequence descriptions when relevant.
- Cross-reference app modules using fully-qualified paths (e.g., `src/services/network/index.ts`) so engineers can trace requirements to code.
- Prefer American English spelling, wrap lines at ~120 characters, and use fenced code blocks for commands or configuration snippets.
- When adding new documentation subfolders, register an AGENTS entry in the manifest if specialised rules apply.
