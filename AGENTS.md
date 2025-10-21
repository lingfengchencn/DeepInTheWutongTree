<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Repository Guidelines

## Project Structure & Module Organization
- Keep product discovery artifacts in `docs/` (see `docs/epic.md`) and preserve brand files such as `docs/logo.png`.
- Place application code under `src/` with subfolders that mirror the epic pillars: `tour/`, `archive/`, `community/`, and `valuation/`.
- Share UI and utility logic through `src/shared/`, store seed data in `data/`, and co-locate specs as `*.spec.ts` beside the modules they verify.
- Record architecture decisions in `docs/architecture/` so future contributors understand the intent behind each module.

## Build, Test, and Development Commands
- Target Node 20 with pnpm 8; run `pnpm install` after pulling to sync dependencies.
- `pnpm dev`: launches the Vite dev server for the AI tour demo.
- `pnpm build`: produces the static bundle for demos and archive snapshots.
- `pnpm lint`: runs ESLint and Prettier; CI blocks merges on lint failures.
- `pnpm test`: executes Vitest suites and reports coverage.

## Coding Style & Naming Conventions
- Write client logic in TypeScript with JSX, using two-space indentation, single quotes, and trailing commas where supported.
- React components follow PascalCase (`TourPanel.tsx`), hooks and utilities use camelCase, and directories stay kebab-case.
- Store narrative content as Markdown in `content/<building-slug>.md` and export shared schemas from `src/shared/models`.
- Run `pnpm lint --fix` before committing to apply the agreed ESLint + Prettier rules.

## Testing Guidelines
- Unit and integration tests live next to the code as `*.spec.ts`, using Vitest `describe`/`it` structure.
- UI flow and map tests sit in `tests/e2e/` with Playwright; fixtures reside in `tests/fixtures/`.
- Keep statement and branch coverage at or above 80%; confirm locally with `pnpm test -- --coverage` before pushing.
- When narratives or models change, refresh related snapshots and cite data sources in the PR.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (e.g., `feat: add valuation heatmap layer`) and keep each commit focused on a single concern.
- Every PR includes a summary, linked issue or epic section, test evidence (`pnpm lint`, `pnpm test`), and UI screenshots or GIFs when visuals change.
- Assign at least one reviewer per module touched and wait for automated checks to pass before requesting merge.

## Security & Configuration Tips
- Store API tokens, map credentials, and archival exports in `.env.local`; publish a sanitized `.env.example` for onboarding.
- Avoid committing personal data gathered for the digital archive—strip identifiers or move sensitive files to a secure location.
