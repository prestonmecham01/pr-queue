# 0001. CI runs checks as separate parallel jobs, triggered by pull requests and main

**Date:** 2026-11-16
**Status:** Accepted

## Headline
CI runs lint, type-check, test and build as four parallel jobs so every push reports all failures at once, and it runs only on pull requests and on `main` so each push produces one clean set of checks.

## Decision
1. **Separate parallel jobs.** Lint, type-check, test and build run as four jobs in a matrix, each on its own runner, with `fail-fast: false`.
2. **Narrower triggers.** The `push` trigger is limited to `main`. Pull requests run one set of checks on each push to the PR branch. Branches with no pull request run no checks. Opening a draft PR starts them.

## Why
**Parallel jobs**
- In a single job, the first failing step stops the rest, so a push only reports part of what is wrong. With parallel jobs, every push to a PR reports every issue that would block the merge.
- Each check is its own status. The branch protection list shows what failed without opening the details view.
- The app is small and will stay small. Each job takes about 15 seconds, and runner minutes are not limited on a public repo, so running four installs is not a concern.

**Narrower triggers**
- After setting up CI, every PR ran its checks twice (once for `push`, once for `pull_request`), which made the status list messy.
- I only need checks when a branch is ready to become a pull request. Until then the workspace is unfinished code and likely has errors.
- The PR run already tests the change merged with `main`, so a second run on the same push adds little and makes the status list harder to read.
- The trigger change was implemented with an AI agent after I reported the duplicate runs. I reviewed and accepted it (local, manual review).

## Alternatives rejected
- **One job with `if: always()` on each step.** It would report every failure, but as one combined check, so I would have to open the details to see which step failed.
- **Install once and share the result between jobs.** It would mean more workflow code, which makes the file harder to read, for no meaningful performance gain at this size.

## Evidence
- `fail-fast: false` is set. By default a failing matrix job cancels the others, which would defeat the goal. Tested with broken tests, types and failed linting a the same time: [https://github.com/prestonmecham01/pr-queue/actions/runs/43540736056].
- Less then 30 seconds to run, from the [https://github.com/prestonmecham01/pr-queue/actions/runs/43541712213/job/132283531932?pr=28].
- A passing run: [https://github.com/prestonmecham01/pr-queue/actions/runs/43541712213].
- Runner minutes on a public repo are not limited.

## What I would change
- If the project grows, CI gets slow, or the repo goes private (minutes would count against a quota), install once and share the result between jobs.
- If I want CI feedback on a branch before opening a pull request, revisit the `push` trigger. A draft PR covers this for now.
- Four installs per push is the known cost of this setup.
- If many people were working on the repo at the same time, I would consider installing once and sharing the results to save on resources.