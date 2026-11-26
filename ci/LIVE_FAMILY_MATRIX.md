# Issue #239 | Live registry-driven browser matrix v1

This is the **first actual GitHub Actions dynamic matrix**, not a shadow preview.
The reviewed `ci/math-families.json` is the single registration for future
independent math-family browser entrypoints. The 13 historical groups/86
browser commands/83 evidence directories remain frozen and required.

## Execution path

1. The existing `static-checks` validates all old and new source and
   family contracts. `scripts/ci-live-browser-matrix.mjs output` computes
   the deterministic new groups and writes the GitHub job output
   `browser_matrix={"group":[...all mandatory groups...]}`.
2. GitHub's real `browser` job uses
   `matrix: ${{ fromJSON(needs.static-checks.outputs.browser_matrix) }}`,
   not a separately maintained list. The first 13 groups always equal the
   frozen legacy runner inventory, in the same order and with the same
   logical files and evidence ownership. The explicit capacity partition below
   keeps those original thirteen IDs as the ordered prefix and adds one
   mandatory physical runner before the new-family jobs. Registered new modules are packed into
   additional actual runner groups using the reviewed 29-minute script budget.
3. Each actual runner and the final fail-closed `required-checks` gate
   independently recompute the same plan from the checked-out source. The
   gate matches the exact GitHub matrix output to this independently
   recomputed full group list, then verifies every required receipt,
   command, environment, exit code, original checkout SHA/run ID and
   attempt. A missing, skipped, cancelled, extra or failed group rejects
   the workflow. All 86 existing calls remain mandatory, even when no new
   family is currently registered.
4. For each new module, the executing runner also insists on its original
   `verification/.../results.json`, nonempty mathematical assertions,
   `errors=[]`, explicit math/correction/persistence proof declarations,
   current run/checkout provenance and at least one original Chromium PNG
   **before** original Artifact upload can succeed. Legacy families keep
   all historical evidence formats and their established separate checks.

## Register a new independent family

Implement a real `tests/p9-<family>-browser.cjs` script using the common
1920x1080 content viewport helper, then add one reviewed entry in
`ci/math-families.json:newFamilies`. Follow the schema and example in
`ci/MATH_FAMILY_SHADOW.md` for file path, evidence ownership, mathematical
proof contracts and runner resource estimates. No workflow YAML group or
manual artifact list changes are required for such independent modules.
Registration/source changes always make browser scope relevant.

**v1 refuses to lie about dependencies.** A GitHub Actions matrix has
parallel Job entries with no per-entry `needs` edges. Therefore v1 fails
closed on **any new-family `dependsOn`**, any planned wave greater than 1,
unprovisioned cpu-heavy runner types, resource estimates that exceed the
available standard runner, duplicate source files or evidence roots, and
missing files. Multi-wave dependency scheduling needs a separate
`needs`-chained rollout before such families are allowed; do not just
discard their dependencies or pretend the `wave` field enforces order.

## Rollback and acceptance

The last fully accepted static 13-group baseline is
`6718586b02b59228ff53acab1567e02da7b32268`. Roll back by reverting
the live-matrix PR's changes to `.github/workflows/pull-request-baseline.yml`,
`scripts/required-browser-checks.mjs`, and associated live matrix
configuration together, restoring the original literal 13-group matrix,
original gate and frozen inventory. Reversion must go through the same
required checks; do not disable the original 86 browser invocations.

Keep 35min/job, max-parallel 10, real Chromium, CJK fonts, historical
viewports, original mathematics/P10/State-v2/backup/offline contracts, and
all raw Artifact/receipt validation. On PR HEAD and again on new main,
independently verify every official original ZIP, actual SHA256/CRC, all
required group receipts, math JSON and P10 proof before marking this live
production switch accepted. Do not claim runtime improvements until GitHub
workflow wall-time and runner cost have been compared on actual runs.

## Capacity-only migration candidate: expansion-2 (2026-11-25)

Full run [45625745253](https://github.com/runlinx-eng/math/actions/runs/45625745253),
job 139248173616, started at 13:43:53Z and cancelled its browser command at
14:19:05Z. The first five commands emitted success; the sixth (Unit Cover)
did not complete or produce a complete group receipt. This is strong timing
evidence of capacity pressure, not an independently confirmed cancellation
reason. The previous three-command head reached Angle success at 14:09:41Z.

The immutable 13 logical legacy groups, 86 invocations, 85 distinct scripts
and 83 evidence directories are unchanged. At live execution only,
`evidence-expansion-2` retains groups/transform/angle, and the appended
mandatory `evidence-expansion-2-tail` owns scalechain/fracshare/unitcover
and their three original evidence directories. Both run in the same full
matrix and must supply independent exact-SHA/run receipts. The frozen group
definition and shadow planner remain the historical baseline. The actual
runner plan now has 14 legacy runners, with every registered new-family
runner unchanged. The 35-minute timeout, max-parallel 10, browser command
environment, screenshots, math and storage assertions are not changed.
There is no optional path or successful fallback for a missing tail.

This is a reviewed-candidate scheduling migration, not a claimed speedup or
passed full regression. New tests compare the exact old/new command
multisets and artifact ownership, and reject missing, partial, stale,
failed and cancelled tail receipts. Actual full workflow dispatch and
original artifact verification are required before acceptance.
