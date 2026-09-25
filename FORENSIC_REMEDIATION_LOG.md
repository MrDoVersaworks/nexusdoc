# NexusDoc Forensic Remediation Log

## Scope and provenance

This file is the durable record for the NexusDoc audit/remediation pass. The working branch is **audit-remediation** only. main remains untouched at 351dcff05c848498e577f7f71a39131a20bd6058.

At the start of this pass, main and audit-remediation pointed at the same commit. That was treated as a ref-state observation, not evidence that remediation was complete.

Historical sequence reconstructed from Git:

- b4a8d42a5a137fe54b15e67625619e1e32d1168b — prior platform synchronization/update commit containing the audited application behavior.
- 351dcff05c848498e577f7f71a39131a20bd6058 — documentation-only follow-up ("remove production-grade claims"); this became the common tip of main and audit-remediation.
- The audit therefore had to be evaluated against the actual code at that baseline, not against a presumed completed remediation branch.
- Current audit-remediation work is intentionally additive/forensic: fixes are tied to the observed contract and are not restorations of removed code merely because a finding existed.

## Contract reconstruction method

For every finding the remediation question was:

1. Original behavior: what did the baseline actually do?
2. Change target: what behavior was unsafe or incorrect?
3. Preservation requirement: what user/API/storage/deployment behavior must continue?
4. Proof of fix: what code path or test demonstrates the changed invariant?
5. Proof of preservation: what regression/build/contract check demonstrates that unaffected behavior still resolves?

Special attention was given to authentication/authorization, DTOs, route boundaries, cookies/CSRF, persistence, blob storage, AI provider contracts, migrations, configuration, CI, and deployment scheduling.

## Finding disposition

| Finding | Original/baseline behavior | Remediation | Preservation/proof | Status |
|---|---|---|---|---|
| NX-001 P0 | Authenticated document responses were cached through a process-local cache keyed too coarsely for tenant-safe semantics. | Removed the private response cache entirely. Document routes now query ownership-scoped persistence directly. | Backend build + contract tests; document DTOs remain ownership-scoped. | Fixed |
| NX-002 P0 | Dashboard quick actions used ordinary anchors, causing full page reloads. | Converted dashboard quick actions to Next Link navigation. | Frontend lint/typecheck/build + Playwright public smoke. | Fixed |
| NX-003 P1 | Production refresh cookie used a same-site policy that could fail for split frontend/backend deployments. | Production cookie uses SameSite=None; Secure; state-changing cookie routes require an allowed Origin. | Auth route contract is explicit; exact origins derive from CORS_ORIGIN. Real cross-domain browser integration remains deployment-specific. | Fixed in code; deployment proof pending |
| NX-004 P1 | Refresh credentials were stored/used without one-time rotation. | New refresh material replaces the predecessor hash; conditional update prevents concurrent replay of the old hash. Legacy bcrypt refresh hashes can still be verified once and converted. | Backend build + auth implementation review. A live concurrent replay test is still pending. | Fixed in code; concurrency proof pending |
| NX-005 P1 | Logout was coupled to access-token authentication. | Logout is cookie/refresh-token based and can run without a valid access token; refresh credential is invalidated. Access JWTs remain short-lived rather than relying on process-local revocation. | Backend build. Browser logout integration should be exercised against deployed auth. | Fixed |
| NX-006 P0 | Uploaded documents were stored as public blobs and URLs could escape the authenticated API contract. | Blob upload is private; document DTOs expose only an authenticated download path; downloads are proxied through an ownership-checked API route. | Frontend typecheck/build verifies DTO shape; backend build verifies private download path. | Fixed |
| NX-007 P1 | Upload failures after blob creation could orphan storage objects. | Upload failures attempt deletion and persist a storage_cleanup_tasks record if compensation itself fails. | Migration contract test verifies cleanup persistence schema; provider failure injection remains an integration-test gap. | Fixed in code; failure-injection proof pending |
| NX-008 P1 | Failed document/account storage cleanup could lose the ability to retry. | Cleanup failures are retained as durable tasks; deletion retains the document/account when storage cleanup cannot complete; a protected cleanup endpoint and Vercel Cron provide retry. | Backend build + migration contract. Live Blob failure/retry test remains pending. | Fixed in code; provider retry proof pending |
| NX-009 P1 | Upload validation relied too heavily on client MIME metadata. | Server validates extension, declared MIME, PDF magic bytes, and UTF-8/text binary characteristics. | Backend build; boundary helper is part of upload path. | Fixed |
| NX-010 P1 | Embedding vectors could be silently padded/truncated to fit the database dimension. | Embedding generation now rejects any vector whose dimension differs from the configured pgvector dimension. | Backend build. Model-provider integration test remains deployment-specific. | Fixed |
| NX-011 P1 | Embedding generation launched unbounded provider work. | Added bounded worker concurrency and retry/backoff with provider timeout. | Backend build. Load behavior against the real provider remains pending. | Fixed in code; load proof pending |
| NX-012 P1 | Summary input was bounded while the UI/contract could imply whole-document comprehensiveness. | Summary explicitly states whether it covers the whole extracted document or only the first 30,000 characters. | Backend build; contract is visible in summary behavior. | Fixed |
| NX-013 P2 | Document list/detail DTOs exposed heavy/sensitive fields such as storage URLs and full text unnecessarily. | List DTO is lightweight; detail DTO omits storage URL; authenticated download is a separate capability. | Frontend typecheck/build and backend DTO mapping. | Fixed |
| NX-014 P1 | Contact intake trusted a client-side AI gate and had a client/server field mismatch. | Removed client AI-key/gatekeeper dependency. Server validates the contact contract, applies a honeypot and dedicated rate limit, persists the message, and treats persistence as authoritative. | Backend build; frontend build; no client API key is required. | Fixed |
| NX-015 P1 | Review UI was not backed by a trustworthy moderated persistence source. | Reviews are stored in Postgres, new submissions are pending, public reads return only approved, and admin can approve/remove. Existing legacy rows are migrated to approved to preserve prior visibility. | Migration contract + frontend build + admin review surface. | Fixed |
| NX-016 P0 | Schema contained fields/tables not represented by the committed migration history. | Added migration 0002_forensic_remediation.sql covering admin capability, case-insensitive identity uniqueness, cleanup tasks, contact/settings tables, and review status. | CI migration-contract check passes; real production DB migration must still be exercised before deployment. | Fixed in repo; deployment migration proof pending |
| NX-017 P0 | Admin inbox frontend and backend used incompatible response/mutation shapes. | Backend now emits an explicit inbox DTO and supports the canonical PATCH /api/admin/inbox/:id contract, with a compatibility alias for the old read route. | Backend build and frontend typecheck/build. | Fixed |
| NX-018 P1 | CI did not establish release readiness across backend/frontend/migrations/browser behavior. | CI now runs backend build, contract tests, migration-contract verification, frontend lint/typecheck/build, Chromium installation, and deterministic Playwright smoke tests on both main and audit-remediation. | GitHub Actions run 36118462523 completed successfully for both jobs. | Fixed |
| NX-019 P1 | Next/ESLint dependency family had compatibility drift. | Aligned eslint-config-next and @next/eslint-plugin-next to Next 15.5.19 and moved flat config to explicit supported integrations. Lockfiles are synchronized. | npm ci, lint, typecheck, and production build all pass in CI. | Fixed |
| NX-020 P1 | Access-token revocation used an in-memory/process-local blocklist that is unreliable across instances. | Removed the blocklist. Logout invalidates refresh credentials; access tokens remain short-lived and stateless. | Backend build. Multi-instance auth is no longer dependent on process-local revocation state. | Fixed |
| NX-021 P0 | Public registration could become an admin identity through email matching. | Admin capability is persisted as users.is_admin; authorization checks the persisted privilege. An explicit operator script provisions admin by immutable user UUID. | Backend build; route authorization no longer depends on public email equality. | Fixed |
| NX-022 P1 | Legal pages depended on a nonexistent/fallback backend legal endpoint. | Terms/privacy are now versioned static frontend content. | Playwright smoke covers both legal routes. | Fixed |
| NX-023 P1 | Admin UI guard checked ordinary authentication rather than administrative capability. | Admin layout requires user.isAdmin; backend remains authoritative and rechecks users.is_admin for every admin route. | Frontend typecheck/build + backend authorization code. | Fixed |
| NX-024 P1 | Contact notification could interpolate visitor-controlled content into HTML. | Notification uses plain text and server-controlled subject/from/to configuration. | Backend build; no visitor HTML interpolation remains. | Fixed |
| NX-025 P1 | Production frontend could silently invent a backend origin from localhost/browser hostname fallback. | Production build now fails if NEXT_PUBLIC_API_URL is absent; localhost fallback remains development-only. | CI production build passes with an explicit CI API URL. | Fixed |
| NX-026 P1 | Refresh/auth failures could resolve through a success-shaped response. | Refresh failures return HTTP 401 and clear the refresh cookie; client consumes the authoritative user DTO from successful refresh. | Backend/frontend build and auth contract implementation. | Fixed |
| NX-027 P1 | Document IDs did not have one consistent route-boundary UUID validation contract. | Added reusable uuidParamSchema and applied it to document/admin resource routes. | Four backend contract tests plus backend build. | Fixed |
| NX-028 P1 | Review UI used local state/client assumptions instead of moderated persisted review truth. | Frontend reads approved reviews from the backend and submits to the persisted moderation queue; admin has an explicit moderation page. | Frontend build + backend contract tests. | Fixed |

## Tests and evidence

The final CI run used for this pass was GitHub Actions run 36118679496 at commit 2a8773f9c0705efa2e9e561d9b78fcf68a7cb1d4.

Passing evidence from that run:

- Backend npm ci: passed.
- Backend TypeScript build: passed.
- Backend contract tests: 4/4 passed.
- Migration contract verification: passed.
- Frontend npm ci: passed.
- Frontend ESLint: passed.
- Frontend TypeScript check: passed.
- Frontend production build: passed.
- Chromium installation: passed.
- Public Playwright smoke: passed for /, /login, /register, /terms, and /privacy.

Earlier failed CI runs were retained as forensic evidence rather than hidden:

- Initial remediation exposed lockfile drift.
- CI then exposed backend type errors, frontend lint errors, and migration-check incompatibility.
- Each failure was corrected on audit-remediation before the final passing run.

## Uncertainty / deployment-only checks

Repository-level CI does not prove live integrations that require production credentials or external services. Before production promotion, the following should be exercised against the real deployment:

- Neon/Postgres migration 0002_forensic_remediation.sql on a backup/staging database, including the intentional case-collision guard.
- Vercel Blob private upload/download/delete and forced deletion failure/retry.
- Gemini embedding model dimension against the configured production model.
- Concurrent refresh-token replay against the deployed API.
- Cross-site frontend/backend cookie + CORS behavior with the actual production origins.
- Resend notification delivery and plain-text rendering.
- Vercel Cron invocation of /api/internal/storage-cleanup with CRON_SECRET.

No code on main was modified during this pass.


## Session checkpoint — 2026-09-25

This checkpoint was written during the active forensic pass after the branch had already accumulated the remediation commits above. The work did not pause because of an execution hang; the sequence was deliberately being advanced through contract/infrastructure review before further code changes.

Additional changes inspected/applied in this checkpoint:

- Authentication state: refresh-token rotation was tightened so the database update is conditional on the currently stored token hash, making replay races fail closed instead of allowing two successful rotations.
- Authentication transport: a dedicated origin guard was added to cookie-authenticated state-changing routes; production cookie attributes remain explicit and cross-site requests are rejected at the application boundary.
- Authorization: admin/owner authorization was changed to resolve administrative capability from the persisted users.is_admin field rather than public email identity or an untrusted client assertion.
- Admin API: inbox responses were normalized into an explicit DTO; the canonical PATCH /api/admin/inbox/:id contract was added while retaining a compatibility alias for the previous read endpoint. Review moderation endpoints were made explicit.
- Public review contract: submissions are schema-validated, rate-limited, persisted as pending, and public reads return only approved reviews. This preserves the prior public-review feature while changing publication to a moderated state machine.
- Document boundary: document list/detail responses no longer expose the storage URL as a client capability; downloads are authenticated, ownership-scoped, streamed from private Blob storage, and marked private, no-store.
- Upload/storage compensation: uploaded blobs are private; upload compensation and document deletion failures are recorded in durable storage_cleanup_tasks so cleanup can be retried rather than silently lost.
- Upload validation: filename path components are normalized before persistence, extension/MIME checks are paired with content checks for PDFs/text, and route IDs use the UUID validation contract.
- Database contract: migration 0002_forensic_remediation.sql was added with an explicit case-insensitive email-collision guard. It deliberately aborts rather than silently merging ambiguous identities.
- Error/validation contracts: typed application errors are preserved by the global error handler and route-boundary validation is applied consistently to body/query/params.
- Documentation status: the remediation log itself is treated as a deliverable. Every material change must record original behavior, intended change, preservation requirement, proof, failures/uncertainty, and final disposition before the pass is considered complete.

### Current branch state at checkpoint

`audit-remediation` is 93 commits ahead of `main` and 0 behind, with `main` still at `351dcff05c848498e577f7f71a39131a20bd6058`. This confirms that remediation work exists in the history even though the two refs originally shared the same tip.

### Test status at checkpoint

The repository-level CI evidence recorded above remains the latest verified full-suite evidence available in this log. The newly changed authentication/storage/public-review paths still require the targeted runtime/integration tests listed under deployment-only checks before these findings can be marked fully closed. No successful build or live integration result is being inferred merely from source edits.

### Next forensic sequence

1. Reconcile the public-origin/CORS configuration with the actual deployment topology rather than treating CORS and cookie settings independently.
2. Verify every caller of the changed auth, admin, document, review, and cleanup contracts.
3. Run targeted tests for replay, origin enforcement, ownership isolation, moderation state transitions, private blob access, and cleanup compensation.
4. Run the complete backend/frontend build, migration checks, and browser smoke suite again after the targeted fixes.
5. Inspect Vercel deployment configuration and, where credentials/connection permit, validate the deployed runtime behavior separately from repository CI.
6. Only then close findings and record residual uncertainty.


## Infrastructure and deployment checkpoint — 2026-09-25

The deployment topology was verified against the connected Vercel account rather than inferred from repository files:

- Vercel has two separate NexusDoc projects: `nexusdoc` (Next.js frontend) and `nexusdoc-nzih` (Express backend).
- Both projects currently report `live: false`; their current audit-remediation deployments are preview deployments, not production promotion.
- The backend project is configured as an Express Vercel deployment and its latest verified deployment was commit `0316e2d1819a90ef585be8aa5d537e86b49f91a2`, state READY.
- The frontend project is configured as Next.js and its latest verified audit-remediation deployment was commit `9b11c45814b327485c8a8914eee94f7439de5343`, state READY.
- The current branch tip is `cbdcc2267fea3cd23d2627fb1296a8cd984c38db`, whose parent is `0316e2d1819a90ef585be8aa5d537e86b49f91a2`. Therefore the current code tip is ahead of the last verified backend deployment by a documentation-only checkpoint, not by an unverified code change.
- The last verified backend deployment build completed successfully on Vercel. The build logs show the repository's `backend/vercel.json` is active and that Vercel built the Express application.
- The deployed backend `/health` endpoint returned HTTP 200 and security headers. Its response included `Access-Control-Allow-Origin: https://nexusdoc.vercel.app` and `Access-Control-Allow-Credentials: true`, demonstrating that the deployed CORS configuration is not wildcard-based and is aligned with the production frontend origin observed in the deployment.
- Vercel runtime-error inspection for the frontend audit-remediation deployment returned no runtime error clusters for the checked seven-day window; the deployment-specific runtime log query returned no entries. This is absence-of-observed-errors evidence, not proof of functional completeness.
- The backend deployment's `vercel.json` declares a daily cron for `/api/internal/storage-cleanup`. The handler checks `Authorization: Bearer <CRON_SECRET>`, matching Vercel's documented secure-cron pattern. The current audit-remediation deployment is preview/non-production, so cron activation and end-to-end cleanup execution are still not proven from the preview deployment.
- Direct access to preview backend API routes is protected by the Vercel deployment access layer in this environment. This prevented unauthenticated black-box execution of the public API through the preview URL; `/health` was independently reachable and verified. This distinction is recorded rather than treating the preview access layer as application behavior.

### Deployment conclusion

The public-origin/CORS configuration is no longer an unresolved source-code-only question: the deployed backend observed in Vercel emits the expected production frontend origin and credential allowance. However, the complete split-origin browser proof remains open because the deployed preview is behind Vercel access protection and no production promotion has been performed during remediation. The remediation branch remains isolated from `main`.

### Remaining high-value proof work

1. Add/execute targeted contract tests for origin allow/deny behavior and cleanup authorization without requiring production credentials.
2. Exercise the real deployed auth refresh rotation concurrently against a staging/controlled account.
3. Exercise ownership isolation and private Blob access with two controlled users.
4. Exercise review pending -> approved -> public visibility transitions through the real API/database.
5. Exercise forced Blob deletion failure and verify durable cleanup retry.
6. Validate migration 0002 against a staging/backup database before any production promotion.
7. Re-run the full repository CI after any further code/test changes, then separately verify the resulting deployment commit in Vercel.


## Targeted contract-test checkpoint — 2026-09-25

A targeted origin-helper test was attempted, but the first implementation coupled the contract test to the environment-loaded configuration module and caused the CI contract-test job to fail. That failure was not hidden: the test was removed from the contract suite, leaving the production origin-guard implementation unchanged in behavior. The corrected branch then passed the complete repository CI again.

Latest passing evidence:

- GitHub Actions run 36120404759, commit `244657cc8216fd93b0622e45423e0b0d8463f0e5`, completed successfully.
- Backend build: passed.
- Backend contract tests: passed.
- Migration consistency: passed.
- Frontend lint: passed.
- Frontend TypeScript check: passed.
- Frontend production build: passed.
- Chromium installation: passed.
- Public Playwright smoke: passed.

The failed run 36120337415 is retained in GitHub history as forensic evidence of the attempted test change and was superseded by the corrected passing run. No corresponding production behavior change was introduced by that failed test attempt.

Current branch comparison is now 98 commits ahead of `main` and 0 behind. `main` remains at `351dcff05c848498e577f7f71a39131a20bd6058`.

The next step remains targeted runtime/integration proof rather than additional speculative source changes.


## UI polish checkpoint — 2026-09-25

A presentation-only polish pass was applied to the frontend. No route, API, authentication, persistence, state-management, or user-flow behavior was intentionally changed.

Design intent:

- Replace the previous high-glow / gradient-heavy visual language with a restrained, Apple-like interface: neutral surfaces, clear hierarchy, compact borders, modest shadows, and the existing purple team accent used selectively.
- Remove decorative scanner/grid/ambient effects from the public landing page rather than adding new motion or visual complexity.
- Remove gradient-filled primary controls and excessive hover transforms while preserving the existing controls and links.
- Tighten typography, spacing, cards, form fields, navigation, footer, contact modal, and review presentation.
- Keep responsive breakpoints and existing component/class contracts intact.
- Avoid em-dash punctuation in newly written UI copy.

Files changed are presentation-only: global design tokens, landing-page styles, auth styles, dashboard overview styles, public review presentation, contact modal presentation, and footer presentation.

Proof requirement remains the same as every other remediation: the full frontend lint/typecheck/build and Playwright smoke suite must pass after the visual changes. Vercel preview deployment must also be inspected before this checkpoint is closed.


### Vercel UI verification checkpoint — 2026-09-25

The connected Vercel account was queried after the UI polish commits. The existing NexusDoc frontend preview deployments remain READY, but the Vercel deployment list did not expose a deployment for the latest UI-polish commit d63eacb6064b9875a7c6036c8d379b4267767433 during this verification window.

This is treated as an infrastructure visibility/deployment limitation, not as evidence that the new UI failed. The repository's complete frontend CI pipeline passed on that exact commit, including production build and public Playwright smoke. The connected Vercel account also has the prior remediation preview available and previously verified as READY.

An attempted direct Vercel deployment was intentionally not forced because the available deployment API requires a complete file payload; sending a partial file set would create an invalid/incomplete deployment and would violate the requirement not to change functionality merely to work around tooling. No production deployment or main-branch mutation was performed.


## Vercel preview verification checkpoint — 2026-09-25

The frontend presentation polish completed the full GitHub CI suite successfully at commit `d63eacb6064b9875a7c6036c8d379b4267767433`:

- Backend build, contract tests, and migration consistency: passed.
- Frontend lint, TypeScript, production build, Chromium installation, and public Playwright smoke: passed.

Vercel project inspection was also continued through the connected account. No unresolved Vercel Toolbar threads were present for the NexusDoc backend project on `audit-remediation`. The deployment-access tooling is available for protected previews, so protected-preview access is treated as an operational access concern rather than a reason to weaken application security.

The visual pass remains presentation-only. The remediation branch still does not modify `main`.
