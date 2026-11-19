# ADR 0004: AI-assisted coding policy

Status: Accepted
Date: 2026-11-19

## Headline

AI may write and review code in this project under full human review. This ADR is the single disclosure, replacing per-PR labels.

## Decision

- AI may write boilerplate, update existing code, and write code I have already specified. It may also review my code and help me work through solving problems.
- I review 100% of AI-written code and can explain all of it.
- I write the reasons and numbers in ADRs.
- This ADR is the disclosure that AI is a normal part of my process. I do not label individual PRs, commits or decisions.
- This changes plan §11 ("The developer writes all code") and drops the "local, manual review" label from plan §10.
- Edits to match the changes done in this PR:
  - the PR template line asking to label AI feedback

## Why

- Reviewing 100% of AI-written code and being able to explain every line is a basic expectation of responsible development, whether AI wrote the code or not.
- Labelling every PR where AI helped would repeat the same information on nearly all of them. I expect that one clear description of how I use AI is what readers actually want.
- AI saves me time on work I can already specify, such as boilerplate and edits, so I spend my time on decisions and review.

## Alternatives rejected and why

- **Label every PR where AI helped:** redundant, because nearly every PR would carry it.
- **Label only formal persona reviews:** more process than it is worth, since AI feedback is a constant part of how I work.
- **Keep plan §11 as written, with AI writing no code:** slower, and hand-writing boilerplate does not improve the review.

## Numbers or evidence

- No measured numbers. This is a process decision.
- It changes the text of plan §10 and §11 in `docs/PLAN.md`.

## What I would change

- If a reader wants more detail, add a short "how I use AI" section to the README.
- Revisit this policy if I ever ship code I have not fully reviewed.