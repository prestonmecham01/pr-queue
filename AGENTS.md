# AGENTS.md

Instructions for AI coding agents working in this repo. Keep this file short. The full plan is in `docs/PLAN.md` (frozen: do not edit it; changes are recorded as ADRs in `docs/adr/`).

## What this project is

PR Queue: a client-side pull request triage dashboard and front-end portfolio project. The developer must be able to explain every line in a code review, so clarity beats cleverness.

## Hard constraints (flag, don't work around)

- Strictly client-side. Zero backend. Next.js static export (`output: 'export'`). $0 hosting.
- No API routes, `getServerSideProps`, server actions, middleware, or server-only features.
- Auth is a user-pasted, read-only GitHub Personal Access Token held in memory only. Never write it to localStorage, sessionStorage, IndexedDB, cookies, logs, or URLs. Never send it anywhere except the GitHub API. No OAuth, no token-exchange server.
- AG-Grid Community edition only. No Enterprise features (Master/Detail, Side Bar, Set Filter, row grouping, Excel export). The detail view is a plain React side panel outside the grid.
- No Web Worker unless profiling data in an ADR justifies it.
- If you think a constraint should change, say so and stop. Don't silently build around it.

## How to work

- Make small, focused changes. One logical change per commit. No unrequested refactors or extra features.
- Don't add a dependency without asking first, and say why it's needed.
- Explain what you changed and why in plain language, so the developer can review and understand it.
- Don't invent API fields, library options, or version-specific syntax. If unsure, say what to verify in the official docs.
- When a change reflects a real decision (library choice, data model, trade-off), suggest an ADR using the format in `docs/adr/`. Don't write ADR content as if the developer decided something they haven't.
- Never claim something is "secure," "100% accessible," or "100% keyboard navigable" in code comments, docs, or UI text. Describe what was done and tested.

## Code conventions

- TypeScript strict. No `any` without a comment explaining why.
- Flag rules (what needs attention and why) are a pure function: PR in, flags with reasons out. No UI or date side effects inside it. Pass "now" in as an argument.
- Components don't branch on "demo mode." Demo data comes through the same data layer as real data.
- Tailwind for styling. Keep the palette calm and limited.

## Accessibility

- Use semantic HTML first. Labeled native controls outside the grid.
- Color is never the only signal; flagged rows show text reasons.
- Icons that stand alone need a visible text label.
- Respect `prefers-reduced-motion`.
- Side panel: focus moves in on open; Escape closes it and returns focus to the originating row.
- Announce meaningful changes through one polite live region. Don't announce every update.
- Cite WCAG criteria by number and name, and tell the developer to verify them against the W3C text.

## Demo data and privacy

- Demo data must be anonymized: no real usernames, emails, names, avatar URLs, or profile URLs. The anonymization test must pass.
- Never commit tokens, `.env` files, or the real-to-pseudonym mapping file.

## Commands

Fill these in once the project is scaffolded:

- Install: `npm install` (use `npm ci` for a clean install that matches the lockfile)
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Type-check: `npm run type-check`
- Unit tests (Vitest): `npm run test` (single run; don't use watch mode, it never exits)
- Accessibility tests (Playwright + axe): `TODO`
- Build: `npm run build`

Run lint, type-check, and tests before saying a task is done.

## Commits

Imperative, one change each, for example `docs: add README stub`. Mention the ADR when a commit implements one.