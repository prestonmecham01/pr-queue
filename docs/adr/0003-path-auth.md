# ADR 0003: Fine-grained, read-only PAT for GitHub access

Status: Accepted
Date: 2026-11-17

## Headline

PR Queue authenticates with a user-pasted, fine-grained, read-only GitHub personal access token (PAT), not OAuth and not a classic token.

## Decision

- The app queries the GitHub GraphQL API with a fine-grained PAT.
- The token is read-only, has a short expiry, and is held in memory only.

## Why

- I want the smallest possible permissions as a responsible security measure. A fine-grained token lets me restrict access to only the repositories I select.
- Each fine-grained token is limited to one owner and only the selected repos, and can be tuned to exactly the permissions needed.
- GitHub recommends fine-grained tokens over classic ones whenever possible.
- The token belongs to the user and is pasted in at runtime, so the app never ships a secret in its code.

## Alternatives rejected and why

- **Classic PAT:** broader access. GitHub's docs say it can reach every repository the user can access.
- **OAuth app:** the code exchange requires the app's `client_secret`, and a browser app cannot keep it secret. GitHub's best-practices page says a single-page app would have to ship the secret in its code. I did not test OAuth. A user-pasted fine-grained token avoids the problem.
- **GitHub App plus stateless proxy:** this app is designed to be fully client-side, and the proxy needs a backend. Deferred to Phase 2 in the plan.

## Numbers or evidence

- Spike (2026-11-17): fine-grained token, Pull requests read-only, 7-day expiry. Status 200.
- Cost: the spike query returned 20 PRs for 1 point. It was a light query (no nested data, no pagination). I am hopeful a larger query with nested data and pagination will fit within the 5,000 points per hour limit, but the real query's cost is not measured yet.
- The token read a public repo I had not selected (`jtleek/datasharing`) and my own private repo. Both worked.
- The token creation form allows one Resource owner only.
- Not tested:
  - cross-org private access
  - permissions needed for CI status and review requests (Sprint 3)
  - OAuth
- Sources (all checked 2026-11-17):
  - Managing your personal access tokens: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
  - Rate limits and query limits for the GraphQL API (5,000 points per hour): https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api
  - Best practices for creating an OAuth app: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app
  - Authorizing OAuth apps: TODO add URL

## What I would change

- If a backend becomes acceptable, move to a GitHub App plus a stateless proxy.
- Measure the real triage query's cost and re-check the minimum permission set in Sprint 3.
