# Issue #180: controlled runner-pressure A/B (diagnostic only)

This experiment tests a **resource-pressure hypothesis** for the observed native
B11 offline-ESM startup failure. It is *not* a production fix and does not close
Issue #180 or waive Required.

## Verified external semantics

- GitHub public standard `ubuntu-24.04` jobs run on separate fresh VMs with
  4 vCPUs, 16 GB RAM, and 14 GB SSD. Source:
  https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job
- Chromium defines `ERR_ABORTED (-3)` separately from
  `ERR_INSUFFICIENT_RESOURCES (-12)` and `ERR_OUT_OF_MEMORY (-13)`.
  Therefore 22 nearly simultaneous canceled scripts do not prove CPU/RAM
  exhaustion. Source:
  https://chromium.googlesource.com/chromium/chromium/+/refs/heads/main/net/base/net_error_list.h
- CDP `Network.loadingFailed` separately reports `errorText` and
  `canceled`, which must be retained in the original native probe.
  Source: https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-loadingFailed
- Playwright distinguishes `requestfailed` from HTTP error responses; SW
  routing behavior needs independent interpretation. Source:
  https://playwright.dev/docs/network

## Exact experimental modes

The new *supplemental* `p9-issue180-runner-pressure.yml` executes two trials
of each mode on isolated `ubuntu-24.04` runners:

| Mode | Native B11 case coverage | Unchanged common coverage |
| --- | --- | --- |
| full | all 26 native cases, in original order | two viewports, errors, correction, course switch, isolation, same 20s wait and SW test |
| shard-0 | even indices of original 26, 13 cases | same common coverage |
| shard-1 | odd indices of original 26, 13 cases **including the previously failing twodigitpair[1]** | same common coverage |

The shard selector is **off by default** and cannot change normal Required,
the mathematical code, original assertions, offline origin-stop procedure,
learning storage, browser version, retry behavior, or timeout. The original
natural B11 failure was in `1440x900-twodigitpair-1`, which remains in both
the full and shard-1 runs. The normal complete Required gate remains unchanged.

Each diagnostic job stores 5-second load/CPU/memory/process-RSS/cgroup samples
and the original browser result, stdout, and failure snapshots as artifacts.
This captures any obvious resource pressure around failure without interpreting
all canceled requests as memory or processor errors.

## Interpreting outcomes

- If the complete mode repeatedly fails at the authentic startup point, and
  shard-1 repeatedly succeeds with materially lower peak CPU/RSS, resource
  accumulation becomes **more plausible** (not proven). Investigate why the
  browser/module loader is vulnerable even when resources are constrained.
- If shard-1 fails at low resource use, that weakens simple overload as an
  explanation and strengthens loader/navigation/SW investigation.
- If every job passes, this is **inconclusive** for an intermittent failure,
  not a fix. Increase independent trials or add deterministic resource
  perturbations with strict bounds before making causal claims.
- This is **not** a standard-vs-larger-runner hardware A/B: both modes use the
  same free public-runner class. A larger-runner comparison requires confirmed
  availability/authorization; do not silently incur charges.

Relevant original failure: Required
https://github.com/runlinx-eng/math/actions/runs/43705224073
and Issue https://github.com/runlinx-eng/math/issues/180 .
