# CI #239 Step 5: first real independent math-family registration

This PR is a controlled **real Chromium** pilot of the live registry→GitHub
Actions matrix. It registers `sequence-invariance`, a new *independent
verification family* for the existing mathematical pattern-thinking lesson
`general34`, task index 2. It does **not** add a new curriculum unit or
increase the officially accepted A/B/C/D/E mathematics coverage numbers.

## Original mathematical work and evidence

New entrypoint: `tests/p9-sequence-invariance-browser.cjs`. New registration
only: `ci/math-families.json:newFamilies`. No manual change to the GitHub
workflow's browser matrix, runner name, receipt naming or artifact path list.

The script creates a genuine Chromium **1920x1080 content viewport** using
`tests/helpers/standard-desktop-viewport.cjs`, starts a fresh local origin
and performs **real lesson controls**, not a mocked model or synthetic
completed lesson. It only positions an otherwise empty lesson into a
previously existing task; it never injects work, correctness or scores.

The independently reviewed arithmetic oracle is 0, 5, 10, 15, 20, with four
increments of exactly +5. Through the visible `p34-next` inputs and
Check action, the trial verifies an invalid first entry 999 remains on
record; correct successive steps build the independent oracle; an invalid
generalization is rejected; correction unlocks actual feedback bounded
against claims of child mastery; reload restores the original corrected
model; editing invalidates feedback even after a second reload; the wrong
recheck is rejected; and another correct answer restores evidence without
erasing the original failure.

Original output under `verification/p9-sequence-invariance/` includes
`results.json`, math checks, explicit math/correction/persistence/negative
proof contracts, current checkout SHA/run ID/attempt, six actual Chromium
screenshots, raw original v2 storage and decoded model snapshots. The
production runner's already-reviewed new-family validation independently
requires results JSON, non-empty checks, errors=[], proof contracts, matching
run provenance and original PNG **before** accepting the group.

## Required CI acceptance

The live planner must produce the same 13 mandatory historical groups
(86 unchanged browser calls/83 old evidence roots) **plus a 14th genuine
GitHub browser group `family-wave-1-job-01`**. The final fail-closed gate
requires 14 distinct group receipts and at least 87 real command results.
This new browser group adds two original ZIP Artifacts (receipt + evidence),
so expected Required archives increase from 28 to 30 (the two existing
static ZIPs remain). Main Fallback remains a separate required push run.

The new browser script's actual result must not be counted as extra
curricular coverage merely because it is a distinct CI registration.
Historical Chromium viewport cases, P10 upgrades, offline, State-v2, backup
restore, current mathematics results, 35min/job and max-parallel=10 remain
unchanged. Cross-group dependency waves and unprovisioned runners continue
to fail closed; this new pilot is independent (`dependsOn: []`).

**No performance improvement is promised.** Record actual GitHub workflow
wall-clock and per-runner duration/estimated resource use, recognizing that
parallelism and runner setup can dominate total elapsed time. First accept
the PR exact HEAD's original results/ZIP and real fail-closed gate, then
squash merge to main and independently reverify new-main Required/Fallback
and all new original Artifacts before closing Step 5.
