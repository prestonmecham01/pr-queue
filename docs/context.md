# PR Queue: context for reviewers

## Goal
A client-side pull request triage dashboard. It opens on a "Needs attention"
view that ranks PRs with small, explainable flag rules and shows a text
reason for each flag. It is a portfolio project, and every decision is
recorded as an ADR.

## Constraints
- Strictly client-side, no backend. Next.js static export, TypeScript
  strict, Tailwind v4.
- AG-Grid Community only. No Enterprise features.
- Auth is a user-pasted, read-only fine-grained PAT held in memory only
  (ADR 0003). No OAuth, token-exchange server or API routes.
- The hosted site is demo-first. Demo mode serves an anonymized snapshot of
  a public repo through the same data layer as real mode.
- Nothing is written back to GitHub.
- The plan is frozen in docs/PLAN.md. Changes are recorded as ADRs.

## ADR index
| ADR | Decision | Status |
| --- | --- | --- |
| [0001](adr/0001-ci-parallel-jobs-and-triggers.md) | CI runs parallel check jobs; triggers limited to PRs and main | Accepted |
| [0002](adr/0002-vercel-hosting.md) | Host the static export on Vercel | Accepted |
| [0003](adr/0003-pat-auth.md) | Fine-grained read-only PAT held in memory for GitHub auth | Accepted |