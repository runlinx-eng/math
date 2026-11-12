# P11 R1: interaction states and protected boundaries

Baseline: P10 R3 commit `7505e94763470dd64ffd432ec766732977bdfffa` (open Draft #69). P9 #66 remains separate. P10 #67 → #68 → #69 are stacked and unmerged. This P11 branch must not merge or deploy until upstream dependencies are handled.

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
