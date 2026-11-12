# P11 R1: interaction states and protected boundaries

Current integration baseline: `main@68281c0e80e201a27bbecc6057d73dbb060a65e8` includes workflow PR #74 and P10 #67 → #68 → #69. P11 R1 #71 absorbs that baseline with no overlapping changed files; P9 #66 and roadmap #73 remain separate Drafts. **The user accepted P11 R1's node-selection experience. Under the merged standing workflow, routine engineering merge is allowed after checks pass on the latest integrated HEAD; VPS deployment or rollback still requires separate explicit authorization.**

## Evidence-based diagnosis

- Hovering a source node previously expanded linked neighbors as clickable map labels, competing with the actual target. Direct source-edge preview is still useful; the crowd of button-like labels is not.
- Hover/selected styling used comparable borders, without a stable cross-workspace operation target.
- A 350px relationship card previously overlapped the left map during a docked lesson. P8 had a same-commit nondeterministic real-node hit failure, so success on rerun is not a fix.

## One state table

| Interaction state | Visual marker | Actions | Protected behavior |
|---|---|---|---|
| Hover | Light, temporary label preview plus source links | Preview only | No selection, task switch, camera movement, storage write |
| Selected | Secondary outline | Detail in stable panel | No automatic extra panel cascade |
| Operating | One strongest non-color-only border, `aria-current` | Learn/Trail/Explore context | The chosen node follows the actual task context |
| Pointer leaves | Preview clears | Prior selection remains | No change to saved state |
| Workspace switch | Same source node, one operating marker | Context moves to selected surface | No task replacement or camera motion without explicit action |

## Scope

- Add `activeTargetKey` as presentation state in the existing spatial scene. No stored schema changes.
- Limit temporary node-hover labels; retain actual 1,223 source edges and preview lines.
- Dock the existing `#learning-map-context` inside the lesson surface rather than overlaying source nodes; on compact viewports the lesson is a bottom sheet to leave a usable map above.
- Improve keyboard focus visibility and preserve real click targets.
- Extend P8's candidate failure diagnostics with real geometry and hit blockers without weakening its check.
- Add a first-round Chromium test and 5 viewport screenshot matrix, retaining every existing P8/P10 check.

## Outstanding acceptance

CI automation is not manual UX acceptance. Inspect screenshots, verify compact and tall desktop canvases, active workpiece readability, touch-device operation, keyboard-only operation, and long-term flakiness separately. A second Required success alone cannot close the P8 nondeterministic hit issue.

Protected: 537 domain nodes, 50 thinking nodes, 1,223 relationships, all fixed 3D coordinates, math correctness, P7/P9/P10 storage and learning mechanisms. No production changes.

## Compact Explore final screenshot finding and follow-up

The `6ab288d` Required CI evidence showed the 620×800 Explore map toolbar intersecting the selected-node detail surface; the lesson-sheet toolbar had already moved into the exposed map band. R1 updated this last compact Explore rule and added a direct bounding-box overlap assertion to `tests/p11-focus-hover-browser.cjs`. Recheck these against the new head's Required/Overview/P8 workflow runs and their screenshots. This is a scoped R1 overlap correction, not an R2 button removal.

For next-round entry inventory and protected follow-up checks, see [P11-ROUND2-ENTRY-PLAN.md](P11-ROUND2-ENTRY-PLAN.md). Manual keyboard/touch usability and independent repeatability of historical P8 node-hit flakiness remain explicitly open.

## Integrated main workflow (2026-11-12)

The PR #74 rules in `AGENTS.md` and `docs/DEVELOPMENT-WORKFLOW.md` are preserved in P11 R1's merge commit. Both branches changed disjoint files. The pre-integration success at `4ea3a34` is historical only; the final integrated HEAD must pass its own Required, Overview and P8 checks before marking #71 Ready and merging. The user's local first-round selection acceptance covers routine engineering closure, **not** future visual polish, artificial proof of manual browser/touch testing, or deployment.
