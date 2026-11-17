# 0002. Host the static export on Vercel

**Date:** 2026-11-16
**Status:** Accepted

## Headline
The static export is hosted on Vercel because the project already uses Next.js, I plan to use v0 for design drafts, and I already have an account, so one platform covers hosting and tooling at no cost.

## Decision
Deploy the Next.js static export (`output: 'export'`) to Vercel from `main`, on the free plan.

## Why
- The app is built with Next.js, and Vercel is the platform that builds it. It detects the framework automatically, so the first deploy needs no custom build configuration.
- I plan to use v0 to get quick design drafts. Keeping hosting and design tooling under one account keeps the number of services I have to manage small.
- I already have a Vercel account, so there is nothing new to set up.
- Cost is not a deciding factor. Both candidates have a free plan, and the traffic this project will receive is far below the free plan's limits. Limits of free plan as of 11-16-2026 (Fast Data Transfer 100 GB, CDN Requests 1M), 
- The hosting constraint from the plan is $0 and no backend. A static export on a free plan meets both.

## Alternatives rejected
- **Cloudflare Pages.** Also free, and it can host a static export. I did not reject it for cost or capability. Vercel won on fit: existing account, the same company as Next.js, and the v0 link.

## Evidence
- Live URL: https://pr-queue.vercel.app/.
- Free plan terms: https://vercel.com/pricing.
- Build time: 10 seconds.

## What I would change
- Hosting and design tooling share one vendor, so leaving would mean moving both. The static export keeps the app itself portable, since the build output is plain files that any static host can serve.
- If the free plan's terms or limits change in a way that affects this project, I would move to Cloudflare Pages.