

## CI trigger checkpoint — 2026-09-25

The merged production-migration commit was verified to have passed the full PR CI suite before merge. A subsequent push to `main` is intentionally being made to trigger the repository's `NexusDoc CI` workflow for the integrated `main` state, so the branch receives a fresh GitHub Actions result rather than retaining an ambiguous/stale CI presentation.

The separate Vercel deployment statuses are not part of this CI trigger and may remain rate-limited independently.


## Explicit error and legal-page remediation — 2026-09-25

Observed production incident: document uploads returned HTTP 500 when Gemini embedding generation failed. Runtime evidence showed both provider fetch failures and explicit Gemini free-tier quota exhaustion. The browser exposed only a generic failure, which made a provider/configuration problem look like an application outage.

### Original behavior
- AI provider failures were collapsed into generic `Error` instances carrying internal error-code text.
- The global error handler therefore returned a generic 500 for those failures.
- The upload UI displayed the server message, so the generic backend response became the user-facing "try again later" experience.
- Embedding calls retried quota/authentication failures, adding unnecessary provider requests.

### Remediation target
- Classify known AI failures into stable application error codes.
- Return safe, actionable messages for quota exhaustion, rejected API keys, missing AI configuration, transient provider outages, and unsupported embedding-model dimensions.
- Do not expose raw provider responses, secrets, stack traces, or internal infrastructure details.
- Do not bypass or remove embeddings; successful document processing retains its existing AI/search behavior.
- Do not retry provider quota or authentication failures.

### Legal pages
The public Terms and Privacy pages were rewritten from the earlier short, portfolio-oriented copy into clearer service terms covering account responsibilities, uploaded content, AI limitations, connected providers, acceptable use, availability, security, retention, changes, and contact. Their presentation was moved into a dedicated responsive legal-page design with clearer hierarchy, readable content cards, restrained visual treatment, and mobile support.

### Proof required
- Backend TypeScript build and existing backend contract tests must pass.
- Frontend lint/build and Playwright smoke tests must pass.
- Production verification must confirm a quota failure is rendered as an actionable UI message rather than a generic 500.
- Production verification must confirm the Terms and Privacy routes render correctly on desktop and mobile and contain the revised copy.
