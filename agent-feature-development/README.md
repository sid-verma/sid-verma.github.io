# Agent Feature Development Workspace

Generated on: February 19, 2026

This folder contains source-backed feature specs for improving this Jekyll blog (`Minimal Mistakes` base) with stronger UI/UX, typography, and AI/ML content architecture.

## Folder layout

- `agent-feature-development/01-source-shortlist.md`
  - Deep research list of engineering/UI/AI/ML websites and award-winning references.
- `agent-feature-development/02-capability-catalog.md`
  - Website capabilities mapped to concrete implementation targets in this repo.
- `agent-feature-development/03-feature-file-index.md`
  - Master index of AI-agent-ready feature development files.
- `agent-feature-development/features/*.md`
  - Implementation specs with:
    - objective and constraints
    - files to change
    - migration steps
    - starter snippets
    - acceptance checks
    - source links/citations

## How AI agents should use this

1. Start with `agent-feature-development/03-feature-file-index.md`.
2. Pick one `FD-*` file and implement exactly the listed scope.
3. Edit only the `Touched Files` in that feature file unless blockers require a scope update.
4. Run local verification checks from the feature file.
5. Update the checklist inside the feature file after implementation.

## Current repo assumptions used in specs

- Theme/layout stack: Jekyll + Minimal Mistakes.
- Core touchpoints:
  - `_includes/masthead.html`
  - `_layouts/single.html`
  - `_includes/archive-single.html`
  - `_includes/page__meta.html`
  - `_includes/head/custom.html`
  - `assets/js/custom.js`
  - `_sass/minimal-mistakes.scss`
  - `_sass/minimal-mistakes/_*.scss`

