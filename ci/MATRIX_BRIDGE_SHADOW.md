# CI #239 — shadow matrix bridge and failure contract

This is a **reviewable adapter preview**, not an activation of the dynamic
GitHub Actions matrix. Use the accepted baseline main commit
`aedf658d1663e2e4db1951a3e4c41cc1a7c55a60`.

`scripts/ci-matrix-bridge.mjs` consumes the existing validated registry
and the real `scripts/ci-plan-math-families.mjs` shadow plan. It reads the
actual Required workflow to compare the live matrix, exact mandatory
13 groups, 86 original commands, 83 original evidence directories,
35-minute job cap, max-parallel 10, and unchanged final gate. Any drift
fails the static CI check; the bridge cannot silently omit or reorder legacy
groups.

The bridge emits `verification/ci-shadow-plan/matrix-bridge-preview.json`
in the existing Node evidence ZIP. It declares a non-activatable preview
containing all legacy jobs, and any *hypothetical* registered future jobs
that are still scheduled by the shadow planner, but are never executed.
Its digest is calculated over the source fields and can be independently
recomputed from the original ZIP. There is **no new separate artifact**.

A deliberately isolated `validateMockPromotion` API checks a synthetic
future full-main run's receipts and evidence inventory. It rejects missing,
duplicate, skipped, cancelled or failed groups, wrong run/sha/attempt, any
missing/failed browser command, changed environment, missing original
evidence directories, and unsafely accepted metadata-only artifacts. The
test suite covers positive and malicious/partial fixtures. This is **not**
connected to the live Required gate. Even a successful synthetic test does
not certify that real GitHub Actions jobs or raw evidence exist.

Actual Required remains `scripts/required-browser-checks.mjs` with
the same 13 static groups, all historical viewport cases and 86 real
Chromium calls, existing per-group original Artifact ZIPs, P10 split 6+2,
35 min/job, Fallback and fail-closed gate. New browser entrypoints remain
1920x1080 content pixels, with no retroactive change to old scripts.

## Promotion is a separate gate

Before any dynamic matrix is actually enabled, a later approved PR must
include a real dynamic matrix producer, per-job command and evidence
ownership, actual raw ZIP verification, receipt SHA/run/attempt binding,
explicit failure on missing/extra/skipped/cancelled jobs, protection of
all 86 mandatory legacy calls, full PR and new-main double acceptance,
and an immediate rollback path to the static workflow. Measure real CI
wall-clock, runner concurrency, artifacts and retry cost before claiming
speedups. No activation flag is implemented in this bridge.
