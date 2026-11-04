# PR Queue

Client-side PR triage dashboard that ranks pull requests by what needs attention first, and shows why. Next.js static export, AG-Grid, GitHub GraphQL, IndexedDB. No backend, and a demo mode with no login.

> **Status: work in progress (Sprint 0 of 6).** Everything below is planned, not yet built. This README grows as decisions are made and features ship.

**Live demo:** coming after the first deploy.

## What it will do (planned)

- Open on a "Needs attention" view, ranked by a small set of explainable rules (for example no recent activity, failing CI, review requested of you).
- Show a plain-language reason on every flagged row, so color is never the only signal.
- Let you snooze or dismiss pull requests locally. Nothing is ever written back to GitHub.
- Offer a demo mode that uses an anonymized snapshot of public pull request data, with no login.
- Offer a real-data mode using a read-only GitHub Personal Access Token, held in memory only.
- Be usable by keyboard, with accessibility testing documented, including what was tested and what is known to be uncovered.

## Tech

- Next.js (static export), TypeScript, Tailwind CSS
- AG-Grid Community
- GitHub GraphQL API
- Dexie.js (IndexedDB)
- Vitest, Playwright and axe-core, ESLint with jsx-a11y
- GitHub Actions, hosted on a free static host

## Project docs

- [Project plan](docs/PLAN.md)
- Design decisions: `docs/adr/` (added as decisions are made)

## License

MIT