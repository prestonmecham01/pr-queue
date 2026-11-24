# ADR 0005: Demo data source

Status: Accepted
Date: 2026-11-23

## Headline

Demo Mode uses an anonymized snapshot of all open pull requests from `rails/rails`, captured in sequential pages of 25.

## Decision

- Repo: `rails/rails`.
- Scope: every open PR at capture time (1,325 on 2026-11-23), drafts included. No sampling.
- Page size: 25 PRs per page, fetched one page after another.
- The capture script retries on 502 and 504, de-duplicates by PR number, and checks that the number fetched matches `totalCount`. PRs opened or closed during the ~2-minute run can cause duplicates, misses, or offsetting changes the count check can't see. That's acceptable for a demo snapshot

## Why

- The data meets the plan §6 criteria. CI is mixed (562 passing, 121 failing, 642 with no CI), there are drafts (37), review activity (111 PRs with review requests), labels, and varied ages (569 not updated in a year).
- Failing CI is a minority (121 of 1,325), so a "CI failing" flag will stand out (plan §3).
- 1,325 PRs is more than the roughly 1,000 target, which gives the grid more rows to work with.
- Taking the whole set means there is no sampling rule to defend.
- 25 per page is the largest size that completed the full capture without a timeout.

## Alternatives rejected and why

- **microsoft/vscode:** over 3,000 open PRs. A `gh pr list` query that included CI data timed out. Capturing it would need a sampling rule or a much longer capture.
- **TanStack/query:** 86 open PRs, too few for a convincing demo.
- **flutter/flutter:** 811 open PRs, 365 drafts and 327 with review requests, but 759 showed FAILURE. On the PRs I checked, the cause was the repo-wide `tree-status` check, so the CI state was not meaningful. None were older than a year, and pages were slower (up to 7.6 s at 25 per page).
- **Capping Rails at 1,000:** the first 1,000 held 29 of the 37 drafts, so the cap gains nothing and needs a sampling rule.
- **100 PRs per page:** one run's first page took 10.6 s and the next returned a 502.
- **50 PRs per page:** a full run stopped after 21 pages, with pages taking up to 10.2 s.

## Numbers or evidence

- Counts as of 2026-11-23 (one capture, from `scripts/graphql-nested-test.mjs`): 1,325 fetched, 1,325 unique, 37 drafts, 111 with review requests, 569 not updated in a year, CI 562 SUCCESS / 121 FAILURE / 642 none.
- Observed by hand, not counted by script: 52 labels with over 20 in active use, and review decisions of 5 required, 25 approved and 43 changes requested.

| Page size | Result | Slowest page | Cost per page |
|---|---|---|---|
| 25 | 53 of 53 pages OK, two full runs (131 s and 184 s total) | 4.5 s and 5.8 s | 1 |
| 50 | stopped after 21 pages | 10.2 s | 3 |
| 100 | one page OK, next page 502 | 10.6 s | 5 |

- Full capture at 25 per page costs 53 points, about 1% of the hourly budget.
- GitHub's docs: 5,000 points per hour per user; requests over 10 seconds are terminated with a 502 or 504; cost is based on the number of requests per connection divided by 100.

## What I would change

- If the final capture query adds more nested data, re-measure the cost and time per page and lower the page size if pages are nearing or exceeding 10s.
- If a demo with more drafts is wanted (Rails has 37, about 3%), look again at a repo with a higher draft share.
