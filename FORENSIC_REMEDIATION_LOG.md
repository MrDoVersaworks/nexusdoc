

## CI trigger checkpoint — 2026-09-25

The merged production-migration commit was verified to have passed the full PR CI suite before merge. A subsequent push to `main` is intentionally being made to trigger the repository's `NexusDoc CI` workflow for the integrated `main` state, so the branch receives a fresh GitHub Actions result rather than retaining an ambiguous/stale CI presentation.

The separate Vercel deployment statuses are not part of this CI trigger and may remain rate-limited independently.


## 2026-09-25 — User-visible error translation and legal/auth UX remediation

### Trigger
Production document uploads were returning HTTP 500 when Gemini embedding requests failed. Runtime evidence showed explicit provider quota exhaustion and fetch failures, but the browser exposed only a generic failure, causing the operator to investigate infrastructure before discovering the user-configured AI quota/key issue.

### Required behavior
- Preserve the document-ingestion pipeline and required AI summarization/embedding behavior.
- Do not silently skip embeddings to make an upload appear successful.
- Convert known AI/provider failures into stable application error codes and safe, actionable user messages.
- Avoid exposing raw provider errors, stack traces, URLs, quotas, or credentials.
- Make password visibility controls functional and accessible.
- Replace the previous minimal legal pages with readable, product-specific privacy and terms content and responsive presentation.

### Remediation implemented
- Added explicit AI error classes/codes for quota exhaustion, rejected credentials, provider unavailability, and generic AI processing failure.
- AI service now classifies provider failures and does not retry quota or authentication failures, preventing needless repeated provider calls.
- Global error handling maps known AI codes to safe HTTP statuses/messages: quota -> 429 with quota/billing guidance; rejected key -> 422 with key/settings guidance; provider unavailable -> 503 with retry guidance; AI processing/summarization/embedding failures -> 502 with configuration guidance.
- Frontend API client now throws a structured error for non-2xx responses so callers consistently surface server-provided actionable messages.
- Login password field now has a real Eye/EyeOff visibility toggle.
- Registration password and confirmation fields now each have independent visibility toggles with accessible labels and keyboard/focus behavior.
- Terms/privacy agreement styling on registration was simplified into the shared auth design.
- Privacy and Terms pages were rewritten with current product behavior, BYOK/third-party AI processing, document ownership, retention/deletion, acceptable use, AI-result limitations, and responsive presentation.
- Public smoke tests now verify password visibility behavior in addition to rendering the legal/auth routes.

### Proof required
1. CI must pass frontend/backend type/build/test checks.
2. Browser smoke/E2E must verify both login and registration password toggles change password input type to text and back.
3. A controlled backend test must verify each AI error code returns the intended status/code/message.
4. Production upload with a quota-exhausted or invalid AI credential must return the explicit application error rather than a generic 500.
5. Successful uploads must still complete summarization, embedding, persistence, and retrieval exactly as before.
6. Production legal routes /terms and /privacy must render without console errors and remain responsive.
7. Production deployment must be independently verified; Vercel build-rate-limit failures are infrastructure/deployment evidence and must not be mistaken for application-test results.


### Final CI verification checkpoint
Hydration-safe password controls are included in this verification tree.
