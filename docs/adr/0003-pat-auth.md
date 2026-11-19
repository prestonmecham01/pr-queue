# ADR 0003: Fine-grained, read-only PAT for GitHub access

Status: Accepted
Date: 2026-11-17

## Headline

PR Queue authenticates with a user-pasted, fine-grained, read-only GitHub personal access token (PAT), not OAuth and not a classic token.

## Decision

- The app queries the GitHub GraphQL API with a fine-grained PAT.
- The token is read-only, has a short expiry, and is held in memory only.
- Trade-off: In memory storage does not stop XSS or malicious browser extensions, and a reload means pasting the token again.  The Sprint 3 threat-model ADR will cover this.

## Why

- I want the smallest possible permissions as a responsible security measure. A fine-grained token lets me restrict access to only the repositories I select.
- Each fine-grained token is limited to one owner and only the selected repos, and can be tuned to exactly the permissions needed.
- GitHub recommends fine-grained tokens over classic ones whenever possible.
- The token belongs to the user and is pasted in at runtime, so the app never ships a secret in its code.
- GitHub enforces the token expiry when created.  The app can only recommend one.

## Alternatives rejected and why

- **Classic PAT:** broader access. GitHub's docs say it can reach every repository the user can access.
- **OAuth app:** the code exchange requires the app's `client_secret`, and a browser app cannot keep it secret. GitHub's best-practices page says a single-page app would have to ship the secret in its code. I did not test OAuth. A user-pasted fine-grained token avoids the problem.
- **GitHub App plus stateless proxy:** this app is designed to be fully client-side, and the proxy needs a backend. Deferred to Phase 2 in the plan.
- **Device Flow:** Device flow needs no client_secret, but GitHub says to use it only in constrained environments (CLIs, IoT, headless systems).  I did not test whether it works from a browser.

## Numbers or evidence

- Spike (2026-11-17): fine-grained token, Pull requests read-only, 7-day expiry. Status 200.
- Cost: the spike query returned 20 PRs for 1 point. It was a light query (no nested data, no pagination). I am hopeful a larger query with nested data and pagination will fit within the 5,000 points per hour limit, but the real query's cost is not measured yet.
- The token read a public repo I had not selected (`jtleek/datasharing`) and my own private repo. Both worked. Reading public repos needs no selection and Github's docs say fine-grained tokens always include read only access to public repositories.
- The token creation form allows one Resource owner only.
- Not tested:
  - cross-org private access (one token covers one owner at a time)
  - permissions needed for CI status and review requests (Sprint 3)
  - OAuth
- Sources:
  - Managing your personal access tokens: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens (checked 2026-11-17)
  - Rate limits and query limits for the GraphQL API (5,000 points per hour): https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api (checked 2026-11-17)
  - Best practices for creating an OAuth app: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app (checked 2026-11-17)
  - Authenticating to the REST API with an OAuth app: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authenticating-to-the-rest-api-with-an-oauth-app (checked 2026-11-19)

## What I would change

- If a backend becomes acceptable, move to a GitHub App plus a stateless proxy.
- Measure the real triage query's cost and re-check the minimum permission set in Sprint 3.
- Revisit the one-owner limit if users need several organizations at once. 