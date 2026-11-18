# CI #239 — family registry and shadow planning pilot

This stage is intentionally **shadow-only**. The accepted main baseline is
`b23bff217fa0baf5967b42e8553e01951d70d7c3`. No new family script is
scheduled by the live GitHub Actions matrix in this pilot; no Required gate,
original test, mathematics, original screenshot, backup, P10, or offline
contract is replaced.

## One reviewed registration for a future family

`ci/math-families.json` is versioned input. `legacyPilots` reference Area,
Unit Cover and Multable **without running them a second time**. The current
13 live browser groups, 86 calls and 83 original evidence directories come
directly from the existing Required source and must all remain mandatory.
The independent frozen inventory and approved P10 6+2 split validate the
same old commands, environments and evidence ownership.

When creating a truly new family browser script, use
`tests/helpers/standard-desktop-viewport.cjs` and register one new
`newFamilies` entry after implementing its mathematical and evidence
contract. For example (illustrative: this sample is NOT registered or run):

```json
{
  "familyId": "example-new-family",
  "version": 1,
  "required": true,
  "entry": "tests/p9-example-new-family-browser.cjs",
  "viewport": [1920, 1080],
  "artifacts": ["verification/p9-example-new-family/"],
  "proofContracts": ["math", "correction", "persistence", "negative", "backup"],
  "dependsOn": ["legacy:evidence-area"],
  "resources": {
    "estimatedScriptMinutes": 12,
    "memoryMiB": 2048,
    "runnerType": "standard",
    "exclusiveLocks": ["example-state"]
  }
}
```

The script and its evidence must actually exist in the PR. The entrypoint
must be a new script; the old 85 distinct browser scripts are never silently
re-registered, re-run or removed. New browser test content area is **1920×1080**;
previous browser scripts retain 1440×900, 1280×720 and any special sizes.
The existing independent new-test viewport guard still checks each new
entrypoint. The registry requires genuine mathematics, error correction and
persistence evidence rather than accepting a newly declared count.

## Deterministic, resource-aware *proposal*, not live scheduling

`scripts/ci-plan-math-families.mjs` validates the registration, actual
entrypoint existence, unique evidence roots, math proof contracts, the
dependency DAG, protected P10 groups, and exact original legacy call count.
It emits an inspectable
`verification/ci-shadow-plan/execution-plan.json` during static-checks,
stored in the existing Node evidence Artifact ZIP.

Future modules would be planned into ordered dependency waves and
deterministically packed with a first-fit resource policy. A proposed
runner receives at most 29 minutes of estimated *script* work, reserving
6 minutes inside the unchanged 35-minute total job limit; at most ten
parallel jobs per wave. Distinct runner classes, estimated memory and
exclusive resource locks are modeled. Missing entries, unsupported
viewports, overlaps, dependency cycles or excessive estimates fail closed.

These are **capacity proposals**, not verified runner-time guarantees:
the 13 baseline durations are from **one** successful main Required run
#44287490501. They exclude runner queueing, installation, initialization
and artifact uploads, and are not P50, P90, P95 or measured total wall time.
No future family may be promoted into the real Required matrix merely
because its shadow plan is valid.

## Explicit non-goals and safe promotion

The Required browser matrix, existing 13 browser groups, artifact names,
`scripts/required-browser-checks.mjs` gate, 35-minute timeout,
max-parallel=10, fallback and mandatory historical math evidence are
unchanged. A green shadow planner does **not** accept a new test family,
and the fast/local checks never substitute for original Chromium or
independent Artifact acceptance.

A future, separately reviewed promotion PR would need to consume the
registration as an executable dynamic matrix, retain legacy calls as a
mandatory subset, emit complete per-task receipts and artifacts,
fail closed on missing/skipped/cancelled jobs, run old/new plans against
real Chromium evidence, independently validate the exact PR HEAD and
new-main Required/Fallback ZIPs, and preserve a rollback to the static
legacy workflow. Actual wall-time, runner utilization, cost and retry
isolation must be measured rather than assumed. No such production
switch is authorized in this shadow pilot.
