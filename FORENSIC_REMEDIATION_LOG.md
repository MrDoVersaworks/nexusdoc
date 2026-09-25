

## CI trigger checkpoint — 2026-09-25

The merged production-migration commit was verified to have passed the full PR CI suite before merge. A subsequent push to `main` is intentionally being made to trigger the repository's `NexusDoc CI` workflow for the integrated `main` state, so the branch receives a fresh GitHub Actions result rather than retaining an ambiguous/stale CI presentation.

The separate Vercel deployment statuses are not part of this CI trigger and may remain rate-limited independently.
