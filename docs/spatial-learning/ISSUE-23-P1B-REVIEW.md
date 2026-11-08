# Issue #23 · P1-B implementation and acceptance record

**Date:** 2026-11-08
**PR:** #24, branch `feat/issue-23-p0-p1-navigation-shell`
**Status:** engineering candidate; not an approved human visual/interaction review.

## P1-A baseline evidence

The previous head `e83b9a6` passed GitHub required checks with 14 Chromium scripts and 193 uploaded evidence files. Those results establish automated regression status for the earlier revision, not the newly edited P1-B head. Manual visual approval and children's comprehension remain unverified.

## Issues identified and changes made

1. Task tabs originally had no stable addressable history. Add `?surface=learn` / `?surface=trail` state and Back/Forward/refresh restoration while preserving the existing node hash, scene and camera state.
2. Close and Escape actions could leave task navigation inconsistent. Use one surface navigation handler for explicit close, keyboard dismissal and iframe navigation; distinguish return to learning hub after launching a lesson there.
3. Original grade, relation and guide tools occupied a broad header strip. Group observation controls in a scrollable left column and keep camera actions in their right rail. Avoid overlapping task workspaces by hiding map floats while those workspaces are open.
4. Refresh the service-worker cache identity to prevent using stale UI files, leaving learning and backup schemas unchanged.
5. Extend `tests/p1-navigation-browser.cjs` with history/refresh/Esc/surface/grade/layout assertions and screenshots at 1440×900, 980×760, 1280×720.

## Acceptance table

| Case | Engineering evidence | Human review |
| --- | --- | --- |
| P1-A original map, lesson, grade, relation and guide | Prior CI succeeded at `e83b9a6` | Not completed |
| P1-B Back/Forward, refresh, Escape, closed workspaces | New Chromium assertions committed; fresh Actions required | Not completed |
| P1-B three desktop sizes | New screenshot/assertion paths committed; fresh Actions required | Not completed |
| Long Chinese explanations, scroll and keyboard ergonomics | Some existing browser coverage; not exhaustive | Not completed |
| Old backups, bad imports, offline upgrade and migrated questions | Full P4 suite not yet executed on P1-B | Not completed |

## Engineering invariants

No change to node identifiers, coordinates, source relations, grade mapping, task evaluators, evidence definitions, learning data keys or backup format. Navigation and grade changes must not refit the camera. Completion is not mastery.

## Merge decision

Keep PR #24 in Draft until latest CI completes and all detected behavior regressions are resolved. Do not merge or close Issue #23 without explicit approval.

## P2 next

Add node-level grade distribution summaries for five themes and 23 packs within the existing detail workspace. Use the existing stage membership index, preserve overlap, and keep the 69 pack-level research judgments separate. Selecting from summaries must not change 3D positions or move the camera.
