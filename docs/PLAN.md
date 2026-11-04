# PR Queue: Canonical Plan

## 0. How to use this document

This is the single source of truth for the project. It is meant to be committed as `docs/PLAN.md`.

**For any LLM or person reviewing it:**
- Do NOT rewrite this document. Suggest changes as a short list ("change X to Y because Z").
- Do NOT reverse anything in Section 2 without explicitly flagging it and giving a reason.
- Do NOT add scope. If you suggest an addition, say what should be cut to make room.
- If you are unsure about a current fact (API behavior, pricing, feature tiers), say so and name what to verify in the official docs. Do not invent API fields or features.

Once Sprint 1 starts, this plan is frozen. Later changes are recorded as ADRs, not as rewrites.

---

## 1. Purpose and success measure

PR Queue is a client-side pull request triage dashboard, built as a front-end portfolio project.

The project has two jobs:
1. Show the work: real, measured, well-built front-end engineering.
2. Keep its own record: every decision, trade-off and number is written down in a fixed format (ADRs) so the reasoning can be pointed at instead of reconstructed.

**Success is a finished, well-documented, measured project.** A finished modest project beats an unfinished ambitious one.

---

## 2. Decisions already made (do not reverse without flagging)

- Strictly client-side, zero backend, Next.js static export, $0 hosting.
- Auth is a user-pasted, read-only Personal Access Token (PAT) held in memory only. No OAuth, no token-exchange proxy (GitHub's token exchange is not reliably usable from a pure browser app; verify current status).
- The hosted site is demo-first. Real-data mode is intended for running locally or self-hosting, though it works on the hosted site too.
- AG-Grid Community edition only. No Enterprise features.
- Master/Detail is replaced by a plain custom React side panel outside the grid.
- No Web Worker unless profiling proves it is needed (decision measured and documented either way).
- Persona (AI review) work is local only. No LLM runs in public CI.
- Ship early: a live URL after Sprint 1, a working demo after Sprint 2.

---

## 3. Product: what it does

### Problem statement
Pull requests sit for hours or days waiting for review. PR Queue is a distraction-free, high-performance dashboard that tells an engineer which pull requests need attention first, and why.

### What makes it triage (not just a table)
1. **Opinionated default.** The app opens on a "Needs attention" view, already filtered and ranked by the flag rules below. The first screen answers "what should I look at first?"
2. **Visible reasons.** Each flagged row shows short text explaining why ("Review requested of you, no activity for 9 days, CI failing"). Color is never the only signal.
3. **A way to work through the queue.** Local-only snooze, dismiss, or mark-reviewed, stored in IndexedDB (Dexie), plus an "Open on GitHub" link for the actual review. A count shows progress ("12 need attention, 3 snoozed").
4. **Nothing is written back to GitHub.** The PAT is read-only. The README states this plainly.

### Flag rules (3 to 5, small and explainable)
Implemented as a pure, unit-tested function: PR in, list of flags with reasons out. Thresholds live in one config object.
- Review requested of me and waiting more than N days
- No activity for N days (prefer last-updated over open-age, so long-running branches and drafts are not falsely flagged; document the choice in an ADR)
- CI failing
- Very large PR (hard to review)
- No reviewer assigned
Drafts are excluded or given separate treatment.

### Controls
- An external number input (threshold N days) and a sort dropdown, built as native, labeled HTML controls outside the grid.
- "Inactive for N or more days" is a filter (AG-Grid external filter). "Most inactive first" is a sort (computed column plus programmatic sort state). They share one threshold value held in a single app-state source of truth.
- "Now" is captured once and passed into the day calculations, so results are stable, testable, and work with demo data whose timestamps may be shifted.
- Saved Views must store this external state (threshold, sort option) alongside the grid's own column and filter state, because external filter state is not part of the grid's filter model.
- Keep the palette calm and limited: one flag style per severity, and let users hide a flag type. If half the rows are red, nothing stands out.
- A polite live region announces results, for example "Showing 14 pull requests with no activity for 7 or more days."

---

## 4. Tech stack

- Next.js (static export, `output: 'export'`), TypeScript (strict), Tailwind CSS (v0 / shadcn/ui may be used for initial layout scaffolding; the developer reviews and can explain all generated code and is prepared to explain how AI tooling was used)
- AG-Grid Community (DOM virtualization, custom cell renderers, row and cell class rules, external filter, programmatic sort state)
- GitHub GraphQL API (one round trip for nested data; `rateLimit` tracked)
- Dexie.js over IndexedDB (cache with stale-while-revalidate; triage state)
- Vitest, Playwright + axe-core, ESLint with jsx-a11y
- GitHub Actions CI
- Hosting: Cloudflare Pages or Vercel free tier

---

## 5. Auth and security

- User pastes a read-only PAT. Token held in memory only, never in localStorage. Honest trade-off: this reduces persistence risk but does not make the app immune to XSS, and a hard refresh requires re-pasting.
- Fine-grained PATs are scoped to a single user or organization; a cross-org view may need a classic read-only PAT. Verify in the Sprint 1 spike against official GitHub docs, and record the choice in an ADR.
- **Cache gap:** private PR data persists in IndexedDB while the token does not. Provide a prominent "Clear local data / sign out" button and state this on the landing page and in the README.
- **Threat-model ADR:** what is protected against (token persistence, over-privileged access), what is not (XSS, a malicious browser extension), and the mitigations.
- Mitigations: strict CSP via a `_headers` file on the host, no third-party scripts or analytics, minimal dependencies, link to create a read-only short-lived token. Check whether GitHub supports pre-filled fine-grained token URLs before claiming it.
- README wording (only if true of what is built): "The hosted site is demo-first. To use your own data, run it locally or self-host. The app asks for a read-only, short-lived token, keeps it in memory only, and never sends it anywhere except GitHub."
- Document the rejected alternative (GitHub App plus stateless proxy) in one paragraph.

---

## 6. Demo Mode data pipeline

**Goal:** the demo runs the same data layer as real mode (query, parsing, Dexie sync, rate-limit footer), with no `isDemo` branching in components.

- **Primary approach:** Mock Service Worker (MSW) GraphQL handlers, enabled only in Demo Mode, serving a captured snapshot. Works on static hosting (service worker file in `public/`).
- **Fallback:** a `getPullRequests()` data-source interface with a fixture-backed implementation of the same response shape. If MSW takes more than about a day to get working with the static export, switch to the fallback and record the choice in an ADR.
- **Capture script:** a one-off, committed Node/TypeScript script runs the real GraphQL query against a public repo using a PAT from an environment variable (never committed or logged), paginates, and saves RAW responses including the `rateLimit` block. A metadata file records source repo, capture date, and query cost. Target roughly 1,000 PRs. Doubles as the Sprint 1 spike.
- **Repo selection:** choose by criteria (busy, mixed CI statuses, drafts, labels, review activity, varied ages, not enormous). Candidates such as TanStack/query or facebook/docusaurus must be checked against these criteria before committing.
- **Anonymization (separate, deterministic, tested):**
  - Strip PR bodies, comments, real names, emails, avatar and profile URLs.
  - Replace logins with consistent pseudonyms (mapping file not committed).
  - Pick the most frequently review-requested pseudonym as the hardcoded "Demo User" so "reviews requested of me" returns results.
  - Keep fields the app needs (labels, CI status, dates, sizes).
  - Handle timestamps: either show the capture date, or shift at load so staleness flags look realistic. Document the choice.
- **Required Vitest test:** fails if any original login, email pattern, avatar URL, or profile URL remains in the shipped demo data.
- Serve the dataset from `public/` and lazy-load it; do not import it into the JS bundle.
- Landing-page note: "Demo uses an anonymized snapshot of public pull request data captured on <date> from <repo>. Not affiliated with or endorsed by the project. Usernames are replaced with pseudonyms."
- Not a lawyer: check GitHub's terms and the chosen repo's contribution guidelines if there is any doubt.

---

## 7. Accessibility

- **Automated first:** `eslint-plugin-jsx-a11y` from Sprint 1; axe-core via Playwright in CI from Sprint 2.
- **Keyboard:** basic grid keyboard navigation and a basic detail side panel on Enter in Sprint 2. Side panel focus management: focus moves into the panel on open; Escape closes it and returns focus to the originating row. A written Keyboard Map is produced in Sprint 5. AG-Grid has built-in keyboard support, but the quality of focus handling around the side panel is the real test and belongs in the manual testing record.
- **Screen readers:** `aria-live="polite"` announcements for filter and sort changes, limited to meaningful changes.
- Respect `prefers-reduced-motion`.
- **Neuro-inclusive choices are heuristics, not laws:** soft contrast (avoid pure black on pure white), literal text labels on abstract icons, predictable layout, progressive disclosure. Document the reasoning and confidence. Contrast preferences have mixed evidence; present them as design choices.
- **Standards:** WCAG 2.2 criteria cited by number and name, and W3C COGA guidance. Spot-check any citation that changes the code against the official W3C text.
- **Honest testing record:** automated tools catch only part of accessibility. Document what was tested manually, which screen readers (VoiceOver/NVDA), a logged hour of real hands-on use, and what is known to be uncovered. Avoid claims like "100% accessible" or "100% keyboard navigable."

---

## 8. Errors, API limits, performance

- **Rate limit:** read the `rateLimit` object on each GraphQL response; show a small footer budget bar (calm green, amber below a threshold). Caching reduces point usage.
- **Errors:** React Error Boundaries (`react-error-boundary`) with a calm message and a "Try Again" reset.
- **Web Worker:** do not add one as a buzzword. Build filtering and sorting on the main thread first. Generate a synthetic dataset (50,000+ rows, derived from the real snapshot with new pseudonyms) and profile it. If there is jank, add a Web Worker with Comlink and capture before/after traces. If there is none, the absence of a worker is a legitimate, documented result. Plan B: if a worker story is still wanted, build client-side full-text search over PR text, where index-building is genuinely heavy. Either way, record the decision and numbers in an ADR.

---

## 9. Hosting and CI

- Static export to Cloudflare Pages or Vercel (free tier), HTTPS included.
- GitHub Actions on every push: ESLint (with jsx-a11y), TypeScript type-check, Vitest (including the anonymization test and the flag-rule tests), and from Sprint 2 Playwright + axe-core. Failing checks block deploys.

---

## 10. Communication layer

Design goal: the repo carries the explanations, so reasoning can be read and referenced instead of reconstructed.

- **ADRs** in `docs/adr/`, written the moment a decision is made, always in this fixed shape:
  1. One-line headline
  2. Decision
  3. Why
  4. Alternatives rejected and why
  5. Numbers or evidence
  6. What I would change
  Label any AI feedback that influenced one as "local, manual review."
- **One-page cheat sheet** generated from the ADRs: each decision's headline, key numbers, and the 2 to 3 questions expected about it.
- **Case-study README**, drafted continuously: problem, three key decisions with rejected alternatives and trade-offs, measured results, known limitations.
- **Video:** a rough 2 to 3 minute v1 walkthrough after Sprint 2 (Demo Mode), a polished version at the end. Reviewers can see the work without a live conversation.
- **Walkthrough format:** a screen-share tour of the repo, ADRs and cheat sheet, navigating to the relevant document for each question.

---

## 11. AI-assisted review workflow (local only)

- The developer writes all code; personas review it. Run locally (for example Claude Code in VS Code with subagents in `.claude/agents/`). No persona runs in public CI. Public artifacts are curated ADRs and notes only; raw persona output stays private.
- **Time box:** maximum 2 hours per week of persona work.
- **Shared `context.md`** fed to every persona: goals, constraints, auth decision, ADR index.
- **Findings log:** date, persona, finding, what was done. Aim for 3 to 5 solid examples where feedback changed code or a decision. Drop any persona that does not earn its time, and note why in an ADR.
- Personas are one or two models wearing different hats, not independent minds.

**Mandatory prefix for every persona prompt:**

> Context: This application is strictly client-side, zero backend, Next.js static export, $0 hosting, using the GitHub API directly from the browser. Authentication is strictly handled via a user-provided Personal Access Token (PAT) pasted directly into the client. Do not suggest OAuth flows, token exchange servers, backend session management, server-side features, getServerSideProps, or API routes. Use AG-Grid Community edition only (do not suggest Enterprise features like Master/Detail rows, built-in Excel export, Side Bars, or Row Grouping). If you believe a constraint should be changed, explicitly flag it rather than silently providing a workaround. Only flag issues you can point to in the provided code or docs. Use severity levels and keep output short.

**Personas:**
- **Principal Architect** (suggested: Claude): reviews approach before coding, challenges trade-offs, helps draft ADRs.
- **Accessibility Lead:** WCAG 2.2 and W3C COGA. Looks beyond automated tools at cognitive load, predictability and sensory control. Treats neuro-inclusive choices as heuristics with reasoning and confidence. Cites criteria by number and name; the developer verifies against W3C text.
- **Security Reviewer** (suggested: a different model family, for example Gemini; send nothing private to free-tier APIs): XSS, CSP, in-memory PAT handling, IndexedDB clearing, dependency risk, from a client-only perspective.
- **Skeptical Interviewer:** reads the README and ADRs and asks hard questions ("Why a Web Worker? Show the measurement." "Where is the evidence for this accessibility claim?" "Why Next.js instead of Vite?"). Flags claims the repo cannot back up.

---

## 12. Roadmap (12 weeks, about 20 hours per week)

### Sprint 1 (Weeks 1 and 2): Skeleton and de-risking
- Initialize Next.js + TypeScript + Tailwind; v0 for layout scaffolding.
- GitHub Actions: ESLint + jsx-a11y, TypeScript, Vitest.
- Deploy the static export to a public URL.
- 1-hour spike: run the real GraphQL query with a PAT; verify fine-grained vs classic PAT behavior, cross-org scope, and point cost; save a real response for fixtures.
- Write `context.md` and the Architect persona; first ADRs; start the rolling README. Save this plan as `docs/PLAN.md`.
- **Done when:** live URL; broken code fails CI; first ADRs written; PAT decision recorded.

### Sprint 2 (Weeks 3 and 4): AG-Grid and Demo Mode (heaviest sprint)
- Capture script, anonymization, and the anonymization test.
- Demo data served via MSW (or the fallback interface).
- AG-Grid with column schemas and custom cell renderers; "Try Demo" button; Demo Mode "me" so the review-requested filter works.
- Flag-rule function with unit tests; highlighted rows with visible reasons; default "Needs attention" view on demo data.
- Basic keyboard navigation and a basic detail side panel on Enter.
- axe-core + Playwright in CI.
- Rough v1 video; ADRs.
- Add the accessibility persona
- **Cut order if it overruns:** v1 video first; then axe CI moves to Sprint 3 (linting stays); then the default "Needs attention" ranking moves to Sprint 3 (highlighting stays).
- **Done when:** the public link opens a fast, populated, keyboard-usable grid in Demo Mode with flagged rows and reasons.

### Sprint 3 (Weeks 5 and 6): Real auth and data pipeline
- PAT input UI, token held in memory only.
- Optimized GraphQL query for real triage data (review requests, last activity, size, CI status), with pagination.
- `rateLimit` footer bar.
- "Clear local data / sign out" button.
- Threat-model ADR; findings log;
- Add the Security Reviewer persona and run it on the PAT handling, the cache and the clear-data button.
- **Done when:** a user can paste a PAT, see real PRs with flags, and wipe the session.

### Sprint 4 (Weeks 7 and 8): Caching, controls, triage state, performance
- Dexie schema and sync with stale-while-revalidate.
- External threshold input and sort dropdown (external filter plus programmatic sort), with shared state.
- Saved Views, storing both grid state and the external control state.
- Local snooze/dismiss with the "N need attention, N snoozed" count and an "Open on GitHub" link.
- Synthetic large dataset; profile main-thread performance; Web Worker with Comlink only if justified (or Plan B full-text search).
- ADR with before/after traces or the documented no-worker result.
- **Done when:** refresh loads from cache instantly; the triage controls work and persist in Saved Views; the worker decision is measured.

### Sprint 5 (Weeks 9 and 10): Accessibility refinement and resilience
- Refine side panel focus management; written Keyboard Map.
- Manual screen reader testing and a logged hands-on hour; document gaps.
- ARIA live announcements; reduced-motion handling.
- Error Boundaries with "Try Again."
- Add the Skeptical Interviewer persona and run it against the README and ADRs; fix the gaps it finds in the written docs.
- ADRs.
- **Done when:** documented manual tests exist and gaps are stated honestly.

### Sprint 6 (Weeks 11 and 12): Communication polish and buffer
- Finalize the case-study README, one-page cheat sheet, and the final 2-minute video.
- Fix remaining UI bugs.
- Use this sprint as buffer if earlier sprints slipped.
- **Done when:** README complete, video published, cheat sheet written, and at least one screen-share walkthrough of the repo has been done with a friend or a persona.

---

## 13. Phase 2 ideas (deferred until after the 12 weeks;)

- Bring Your Own LLM insights (user-supplied API key, client-side)
- Web Speech API navigation and read-aloud
- Dynamic data import sliders (control GraphQL payload size)
- Client-side Excel export via ExcelJS
- JSON export/import of cache and saved views
- GitHub App plus stateless token-exchange proxy (the deferred auth alternative)

---

## 14. Cut list (drop without guilt if behind)

In rough order:
1. Persona work beyond the 2-hour weekly box
2. Local snooze/dismiss (triage state)
3. Full-text search (if built only to justify a worker)
4. Custom theming beyond Tailwind defaults
5. Keyboard-map polish and deep custom ARIA live regions (rely on semantic HTML and AG-Grid defaults)
6. Saved Views (move to Phase 2 if Sprint 4 is overloaded)

---

## 15. Open items to verify before relying on them

- GitHub's current status on PKCE and CORS for the token endpoint (the plan avoids OAuth either way)
- Fine-grained PAT scopes for GraphQL and cross-org use; whether pre-filled token-creation URLs exist
- That Master/Detail, the Side Bar, Set Filter, and Excel export are Enterprise features, and that external filter, programmatic sort state, row/cell class rules and custom renderers are Community (check AG-Grid's Community vs Enterprise page)
- Whether async transaction updates are available in Community (only relevant if a live-update simulation is added later)
- MSW current setup with Next.js static export and Cloudflare Pages/Vercel
- Candidate demo repos against the selection criteria
- WCAG criterion numbers and wording used in documentation
- Pricing and terms for any AI tooling used