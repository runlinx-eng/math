# Math Explorer

Working root: `/Users/zj1-6/dev/math`. The former `agents/experiments/math-explorer` directory is a retained pre-migration copy. Continue project work in this root; Codex project and older chat directory settings must also point here.

Scope: local, offline Chinese mathematics exploration for a child. Grade, age,
textbook and school curriculum must not determine the route. Desktop only; no
parent portal, mobile work, cloud publishing, model APIs or external analytics.
Keep upstream data under vendor/os-taxonomy intact. Grouping, translation,
layout and activities are local adaptations.

Current content: 587 unique source nodes, 1996 node tasks, 231 short routes with
2–4 nodes each; 776 real source connections with 1552 joint tasks. A pack with
multiple routes first offers 2–3 choices. B06 through B09 have 28 routes in number-sense:
first show three directions, then at most three routes per group, then 2–3 nodes.
B10 through B12 have seventeen add-subtract routes under three separate directions; never show
all six directions across both packs at once.
Previous/next group navigation preserves the selected group on return and refresh. Keep the five-theme, 23-pack, 587-node
world and all 1,223 source edges accessible with deterministic coordinates.
Route numbers and spatial distance must not become invented prerequisite edges.
The v49 global map uses ONE fixed 3D coordinate system for all 587 nodes.
Horizontal homes group five themes and 23 packs; height is the longest hard-only
prerequisite chain across the entire graph, including cross-theme edges. All 851
hard edges rise; 372 soft edges stay dashed and do not determine height. This is
source structure, not grade, difficulty, mastery or a mandatory learning order.
Top, side and oblique views change the orthographic camera only. Selection never
rearranges coordinates or hides the rest of the graph by default. Inspect local
examples in the same world. Labels may move in screen space with tethers; nodes
may not. Base node size is uniform; glyphs come from existing activity types.
`spatial-global.js` owns current coordinates; `spatial-network.js` retains older
layouts. Restore v47 questions without networkView and v48 questions without
networkVersion to their original coordinates and perspective camera. New worlds
record networkVersion 49 and cameraZoom as well as networkView.

The v50 interface keeps coordinate version 49. Fit the overview from source-node
positions, not annotation bounds. Names appear progressively by projected scale:
themes, packs, then nodes; selected real neighbors take label priority. Hovered
and selected nodes retain their activity glyph. Incoming edges are orange and
outgoing edges blue, with hard/soft styles preserved. Do not overwrite saved
cameras with the new overview framing. The compact continuation entry belongs
at the bottom and must not cover source points in a fitted overview.

The v51 interface also retains coordinate version 49. `spatial-names.js`
provides source-goal-based names consistently across map, search and focus;
the original source titles and IDs remain unchanged. `spatial-trace.js` follows
hard edges only, deduplicates nodes, retains all hard edges among the reachable
set, and reports shortest hop counts without moving world coordinates. New node
selection defaults to direct links; back restores trace mode, camera and list
scroll. Hover and keyboard focus are temporary previews, not selections or
history entries. The current view and question world preserve trace mode.
`spatial-reasons.js` contains 1,223 locally authored Chinese explanations bound
to the exact source edges and original reasons. Changed or unmatched source
reasons must be visibly marked unreviewed. Never infer a mathematical explanation
from names alone or turn source ages into learning prerequisites. These local
adaptations have not received independent mathematical review. The generator
`scripts/build_spatial_exploration_inventory.mjs --check` verifies the complete
source-and-explanation inventory in `docs/spatial-exploration/`.

Learner progress has only complete/incomplete, an overall bar and compact task
steps. Browsing is not completion. Both endpoints completed is not a completed
connection: the joint work must be performed. Count unique available source
nodes, without previews or duplicate alternate activities. A completed question
does not award a node. Never equate activity completion with understanding.
Retain first attempts, errors, hints and corrections; keep unassessed explanations
separate from structured construction evidence. Simulations do not establish
real-world tool use, actual investigations or real child learning effects.

Daily learning preserves original question words, unfinished work, actual random
draws, lesson and world camera positions, and subsequent displaced drafts.
The child has not tried this version and has explicitly asked us to continue
making content first. Stage 4 content and technical checks are complete; its
two actual child sessions, including one real next-day continuation, remain
unverified. Do not claim the whole stage is accepted or invent trial feedback.
B37 adds 21 nodes / 71 tasks / 38 source connections, adapting 20 existing
research records and one local brief. B39 subsequently completed the last 8 planned nodes and one local research brief.
B06 through B08 number-words is a Chinese adaptation; English reading/spelling, oral
counting fluency, real finger coordination and handwriting legibility are not
automatically assessed. Flash repeats and text help remain support evidence.

Authority and sources:

- README.md owns launch instructions; serve only on 127.0.0.1.
- docs/EXECUTION-PLAN.md owns staged work and pending validation.
- docs/LEARNING-DESIGN.md owns the learning model and source/adaptation boundary.
- docs/VALIDATION.md records current technical verification separately from trials.
- docs/phase5/coverage.json and COVERAGE.md map current 587 nodes / 1772 source
  goals with limited-case and unassessed-goal boundaries. B39/RESEARCH.md,
  source-review.json, DESIGN.md and PRODUCTION.md record sources and adaptations.
- docs/phase4/coverage.json and COVERAGE.md retain the historical 50-node /
  153-goal baseline; its original validation remains in verification/phase4/.
- docs/CONTENT-INVENTORY.md and docs/content-plan/ are stage-1 planning outputs,
  not live delivery coverage. Their 3-activity baseline is deliberately frozen.
- vendor/upstream.json pins the source; build_data.py then build_atlas.py create
  the math projection and local classification without discarding source edges.

Implementation: dist/learning/phase5/b06*.js owns counting/representations,
flash timers, local audio and optional bounded ink; b06.css owns its styling.
Cancel transient callbacks when leaving a task. Countboard typing must not
recreate its focused input on every character. Native Chinese WAV clips are
local assets, not a runtime service. The sandbox speech command once emitted
zero-frame files despite success: require non-empty PCM samples/duration/energy,
not only a playback-ended event. Runtime also rejects empty audio.
dist/learning/phase5/b07*.js owns exchange, place-value, comparison,
number-line placement, estimation and parity models; b07.css is scoped styling.
Fixed swaps conserve total; nonstandard forms remain valid. First predictions
and corrected moves persist. Do not conflate the tens digit with total tens.
dist/learning/phase5/b08*.js owns large/decimal place-value counters, digit
movement, rounding, error intervals and Roman numerals. Arithmetic uses integer
millionths. Preserve original predictions, midpoint decisions and requested
trailing zeros. Nonnegative rounding intervals include the lower endpoint and
exclude the upper. Chinese myriad grouping is an adaptation; fictional context
data must stay labeled. Only source edges have joint activities.
dist/learning/phase5/b09*.js owns signed number lines, tool use, distance,
inequality ranges, powers and exact-fraction zooms. b09-power-view.js adapts
CubeView for actual cubic construction and saved cameras. Self-chosen jumps and
equivalent inequality notation must allow valid alternatives. Finite zooms are
not an infinity proof; fractions and root brackets use exact integer comparison.
Keep the initial question button disabled until the activity has loaded.
dist/learning/phase5/b10*.js owns conserved counters, split pairs, ten-frame
bridging, fact families, three-part grouping, unit exchange and untimed recall.
Keep original guesses, mistakes and support. Feedback inside an activity marks
support too. Equal-sign reversal is valid; subtraction order is not freely
exchangeable. Screen fingers and finite retrieval do not assess real dexterity
or automaticity. B10 has two local research briefs; never modify source data.
dist/learning/phase4/{b02,b03,b04,b05}*.js owns the earlier activities;
geometry.js and solid-view.js own the geometric models and actual 3D solids.
catalog.js, tasks.js, state.js, learn.js, learn.css and cubes.js under learning/
provide shared routes, records, UI and older cube tasks. bridges.js and daily.js
own joint work and continuation. space.js and spatial-*.js own the world.
dist/learning/phase5/b11*.js owns exact integer-scaled place-value arithmetic,
actual exchanges, aligned written result digits, self-chosen hops, four-part
grouping, sequential story decisions and rounding/inverse checks. A correct
single hop is valid unless the task explicitly requires splitting. Decimal raw
labels align by their actual last digit. Preserve first guesses after wrong
alignment; either original addend may be used for an addition inverse check.
Written task completion does not establish handwriting or an independent paper
algorithm. Method selection does not establish actual mental or calculator use.
Keep sw.js, space.js and exploration.js cache versions synchronized (current v51).

The global network is the default for a new world. Before a view preference is
chosen, existing unfinished classic sessions return to their saved view; unfinished
old network sessions also restore their saved coordinates. Keep old view storage
intact. The classic and current network have separate saved cameras. Switching
worlds preserves work; returning to questions restores layout, coordinates, camera
and zoom. All source nodes and edges remain available. Selecting a node highlights
its actual incident edges and does not start or complete an activity. Only a
completed joint task lights its connection. The square marks a saved activity
scene and the diamond a pending question, neither an additional source node.
Short-route navigation remains optional. Current unit and browser checks are
`tests/spatial-global.test.mjs`, `tests/spatial-global-browser.js` and
`tests/spatial-global-camera-browser.js`, plus `tests/spatial-exploration.test.mjs`
and `tests/spatial-exploration-browser.js`. Run the isolated current-browser suites
through `scripts/verify_spatial_exploration.cjs` with exploration, global, camera
and regressions arguments. It adapts historical cache checks without altering
coordinate-version assertions. Current evidence is in
`verification/spatial-exploration-20261029/`; earlier v49/v50 evidence remains in
`verification/spatial-global-20261029/` and `verification/spatial-readability-20261029/`. No child
trial or user acceptance is implied.

dist/learning/phase5/b13*.js owns conserved equal groups/sharing, actual array
rotation/cuts, finite untimed multiplication facts, complete factor pairs,
self-chosen three-factor products and division reversal. Drag and click both
preserve individual object identities. Numeric correctness cannot excuse unequal
shares or wrong story roles. Pending array dimensions preview immediately;
stable controls disable cutting until the original dimensions return or a new
shape is committed. Both split parts include the common factor. Keep first
predictions, all move history, support and corrections. Screens do not establish
physical handling, free drawing, oral reading, full-table fluency or 3-second recall.
B13 has eight routes in groups under exactly three directions, at most three
routes per page, and three nodes per route.

dist/learning/phase5/b12*.js owns three-part bar construction and self-chosen
two-step story plans. Bars use fixed equal-size units, not hidden-answer scaling.
Child-chosen groups retain fact identities and signed meaning. Allow equivalent
plans and unknowns on either side or inside the original relation. Numeric
coincidence cannot override a wrong relation. Undo/reset preserve first wrong
construction and attempts. Labels are given scaffolds; independent drawing,
intermediate naming, method efficiency and open explanations are not assessed.

Preserve old activities under exploration*.js, embedded.css and v2.html, and the
early journey-model.js / journeys.portions record. live-state.js merges parallel
drafts. Former A03 source ID now has the quarters lesson at A04; never renumber
stored source IDs or upgrade old completion to new independent evidence.
Imports must merge without dropping current work, help or exposure history.

Run node --test tests/*.test.mjs for learning/data changes (current 1036 checks).
Run build_content_plan.py --check and the phase2, phase3 and phase4 coverage
generators plus build_phase5_coverage.mjs with --check. Phase2/3/4 generators
are frozen historical baselines; phase5 is the current cumulative inventory. Regenerate planning fingerprints when relevant
inputs change without rewriting that baseline.

Browser verification uses isolated Playwright contexts, never user storage.
tests/phase4-b02-browser.js and generated b03/b04/b05 scripts exercise all new
tasks. build_phase4_browser.mjs and build_phase4_checks.mjs regenerate embedded
fixtures. phase4-integration-browser.js covers all routes, returning/refreshing,
new questions, exact random outcomes, actual export/import and offline modules.
Geometry-links and links browser scripts cover all twelve new connections.
phase2-browser.js, phase3-browser.js, phase3-continuation-browser.js,
spatial-browser.js and exploration-browser.js preserve earlier behavior.
B06 uses tests/phase5-b06-browser.js and phase5-b06-integration-browser.js for
all 76 tasks / 20 joint tasks, three-direction navigation, audio, ink, flash
cleanup, next-day recovery, actual backup/import and offline operation.
phase5-b06-audio-browser.js checks decoded sound, interrupted/empty playback,
countboard typing and the ten-frame representation.
B07 uses phase5-b07-browser.js for all 71 tasks / 22 joint tasks and
phase5-b07-integration-browser.js for route-group persistence, partial swaps,
next-day recovery, real backup/import and offline operation.
B08 uses phase5-b08-browser.js for all 80 tasks / 28 joint tasks and
phase5-b08-integration-browser.js for nine routes, partial work, next-day
recovery, real backup/import and offline operation.
B09 uses phase5-b09-browser.js for all 44 tasks / 12 joint tasks and
phase5-b09-integration-browser.js for four routes, actual 3D clicks, partial
cubes and camera recovery, errors, backup merging and offline work.
phase5-b09-readiness-browser.js deliberately delays a module to test early clicks.
B10 uses phase5-b10-browser.js for all 65 tasks / 32 joint tasks, and
phase5-b10-integration-browser.js for its three-direction entry, eight routes,
partial counters, first errors, simulated next-day recovery, backup and offline
continuation. Bounded historical regression copies are in tests/phase5-b10-regression/.
B11 uses phase5-b11-browser.js for all 86 tasks / 46 joint tasks and
phase5-b11-integration-browser.js for paginated directions, partial exchanges,
first mistakes, simulated next-day recovery, actual backup/import and offline
continuation. phase5-b11-written-browser.js checks column alignment and typing
focus. Bounded historical copies are in tests/phase5-b11-regression/.
Current evidence is verification/phase5/B39/; earlier batches remain historical.
B12 uses phase5-b12-browser.js for all 14 node tasks and 12 joint tasks, plus
phase5-b12-integration-browser.js for route BH, partial plans, first mistakes,
simulated next-day recovery, actual backup/import and offline continuation.
Bounded B11, spatial, daily and readiness regressions are in tests/phase5-b12-regression/.
Do not substitute test counts for user acceptance. Do not infer active labor
time from interrupted wall-clock spans; the current log leaves activeHours unmeasured.

Use pinned upstream teaching guidance and runnable examples before authoring
each new batch. Preserve per-source-goal coverage even when models are reused.
Open explanations are saved, not automatically judged. Every remaining source
node already has a batch. B39 completed the last planned first-pass activities; next audit stage 6 against source and actual behavior.

B13 uses phase5-b13-browser.js for all 90 node tasks and 52 joint tasks, plus
phase5-b13-integration-browser.js for eight routes, real drag, partial sharing,
first errors, simulated next-day restoration, actual download/repeated import
and offline completion. Bounded B12, spatial, daily and readiness regressions
are in tests/phase5-b13-regression/.

B14 uses phase5-b14-browser.js for all 73 node tasks and 62 joint tasks;
phase5-b14-integration-browser.js checks eight routes, partial exchanges, first
errors, simulated next-day restoration, actual download/repeated import and
offline completion. Bounded B13, spatial, daily and readiness regressions are
in tests/phase5-b14-regression/. The targeted visual suite checks repaired tree
layout and stable work-panel widths. All branches must fit or have an explicit
usable scroll area; document-level overflow alone does not detect clipped trees.

dist/learning/phase5/b14*.js owns area partitions, actual carrying, aligned
partial products, digit-by-digit division, remainder contexts, factor searches,
parity pairing, prime-factor trees, self-chosen product plans, executable bounded
rules and relative-reference tables. The row multiplying tens must be shifted;
remaining quantities cannot exceed the divisor. 4752/13 is 365 remainder 7, and
bringing 5 down after remainder 8 gives 85. Factor copies cannot be reused.
Equivalent valid trees and story plans remain valid. Preserve first estimates,
predictions and all failed constructions. Simulations do not prove independent
handwriting, mental fluency, general proofs, free programming or external
spreadsheet use. B13 and B14 share the same three entry directions.

B15 adds seven routes under the same three directions, with 19 nodes / 73 tasks
and 32 real connections / 64 joint tasks. b15-model.js owns bounded expression
parsing and real reduction, distributive block construction, shape-angle links,
eighth/decimal/percent equivalence, signed patterns, reversed operations,
decimal division, estimates and calculator expressions, comparison bars, unique
pairings and self-chosen story plans. Decimal multiplication reuses B14 exchanges
with explicit original-unit restoration. Never eval learner expressions.
Multiplication/division and addition/subtraction each share rank and go left to
right; independent branches may be handled in either order. Principal square
roots are nonnegative. Estimates detect gross errors, never prove exactness.
A correct numeric coincidence cannot excuse the wrong story relation. Retain
source metadata mismatches explicitly: mt_hImiKNiaNh is taught by its actual
structural goals, not its order-of-operations title. Pending edits cannot submit
an earlier construction. Later fields appear after the relevant action, and
mathematical strips must retain a usable common scale.
B15 tests include all task controls, shorter desktop layout checks, partial
remainder exchange, first errors, simulated next-day recovery, actual download
and repeated import, offline continuation and bounded B14/spatial/daily/readiness
regressions. Open explanations, real mental methods, independent paper layout,
physical tools and general proofs remain unassessed. No child trial is claimed.

B16 puts all twelve same-amount routes, including original A/G/H, under exactly
three directions with at most three routes per page. New CF-CN routes have 2-3
nodes. b16-model/view/css owns equal-area partitioning, conserved object groups,
fraction bars, repeated unit walks, remaining-whole sharing, aligned fractions,
mixed-form positions, digit values, precise notation, coordinate construction,
misaligned-row repair, angle rearrangement, unknown bars and linked FDP views.
Preserve source whole boundaries after cutting; pieces have stable origins and
recipients. Count intervals, not marks; long axes do not change the 0-to-1 unit.
Accept equal values and either order for tied cards. Exact ninths must not be
replaced by rounded decimals. A fraction of a set uses the entire set. 3.5 and
3.50 are equal; two decimal places are a specified recording convention.
Two triangle examples do not establish a general proof or physical tearing.
Preserve first predictions, failed assignments, support and displaced later
work. Free explanations and physical, independent or general abilities remain
unassessed. Historical phase4 route counts use their original lesson batches,
not the absence of a navigation section; the 50-node baseline remains unchanged.
B16 browser scripts cover all 74+80 task controls, three directions and twelve
routes, partial pieces, the original question, simulated next-day recovery,
actual download/repeated import, offline work and 24 shorter-desktop task views.
Bounded B15/spatial/daily/readiness regressions are in tests/phase5-b16-regression/.

B17 adds CO-CW under the same three directions; all 21 fraction routes remain
reachable with at most three choices per page. b17-model/view/css owns exact
fraction ordering and common subdivision, renaming, decimal comparison and
zoom, hundredths composition, complement pairs, remainder long division,
percentage parts, bounded executable rules, fraction operations, straight-angle
gaps and finite recall. Operation history must replay to the saved board.
Original, comparison and result bars share the same unit width above and below
one. Common-denominator actions visibly repartition the original shaded amount.
Accept equivalent methods: common-denominator multiplication is valid if both
denominators are multiplied. Reduce before testing decimal termination. Label
long-division row units and retain the exact repeating block, not an approximate
decimal. 0.4 equals 0.400; format is not quantity. B11 now supports scale 1000
with exact parsing, correct raw-label offsets and a decimal boundary after ones.
B17 covers 66 source goals with explicitly limited cases; broad any-size,
independent strategy, open explanation and general proof claims remain unassessed.
Browser verification covers 98+88 tasks, all 21 routes, exact partial splits,
first errors, displaced drafts, simulated next-day restoration, real downloads,
repeated imports, offline continuation and 30 shorter-desktop task views.
Bounded B16, B11-written, spatial, daily and readiness checks are under
 tests/phase5-b17-regression/. No child trial or user acceptance is implied.


B18 adds CX-DD in fraction-operations under three directions, seven routes,
18 nodes / 61 tasks / 47 source links. b18-model/view/css owns decomposition,
whole-to-part exchange, actual sharing of a unit fraction, sequential percentage
operators and contextual wrappers for B17 operations. Keep both measurement and
partitive division. Two equal-area rectangular tile sides need not be equal;
never call 1/3-by-1/4 microtiles squares. Geometric units stay equally scaled.
Allow different common multiples, finer fair cuts, allocation orders and
all-improper mixed-number methods. First estimates remain even when wrong.
A discounted amount becomes the next tax base; money displays familiar exact
decimals while nonterminating values remain exact fractions. Story text is
collected, not semantically assessed. Nested work and outer histories both
survive restore; later replacement drafts and support never disappear.
B18 browser checks cover all 61+94 tasks, three directions and seven routes,
24 shorter-desktop task views, four money views, partial fair sharing, first
mistakes, original question, world camera, simulated next day, real backup,
repeated import and offline continuation. B17, spatial, daily and readiness
regressions are under tests/phase5-b18-regression/. No child trial is claimed.
The pinned vendor is an exported copy, not a separate Git checkout; verify
vendor/upstream.json and source fingerprints, not the parent repository HEAD.


B19 adds DE–DH, four two-node routes in collect. C/J are also accessible through
three entry directions, and both older C/K display routes remain reachable.
b19-model/view/css owns categorical count/difference, one-to-one matching,
local survey planning, 3-day/15-person simulated records, bounded COUNTIF,
linked tables and charts, data cleaning, nominal/ordinal distinctions,
measurement context and rounding reports. Preserve raw rows and correction
history. Unknown is not zero; equal valid responses are not duplicate people;
repeated visits are not unique people. Include all tied extremes. Ordered
ratings need not have equal intervals. A rounding pile-up only demonstrates a
possible explanation, not the actual cause of reported times. Keep units visible.
An edited investigation invalidates downstream evidence. state.js applies the
current B19 investigation revision when reporting completion, while retaining
old successful attempts. Other historical activities keep their prior semantics.
Free question wording, reports and explanations are stored unassessed. The local
form and simulated respondents do not establish external online survey creation,
real 15-person collection, physical observation or classroom presentation.
B19 checks cover all 24+24 task controls, all six collect routes and both display
routes, 20 shorter desktop views, raw corrections after completion, partial entry,
first error, original question, world camera, simulated next day, CSV and backup
downloads, repeated import and offline continuation. B18/spatial/daily/readiness
regressions remain bounded. B20 extends display, B21 extends summarize, B22 extends chance, B23 extends shapes, B24 extends positions, B25–B26 extend angles, B27 extends solids, and B28–B29 extend measurement, and B30 extends area and solids; B31 extends capacity, B32 extends time, B33 extends money, B34 extends patterns, B35 extends unknowns, B36 extends functions, B37 extends scaling, B38 extends mathematical reasoning; B39 subsequently completed the last planned batch.

B20 adds DI–DO, seven two-node display routes. C/K remain reachable, giving
nine routes under exactly three directions, three each. b20-model/view/css owns
replayable observations, time and category plots, timetable/minute jumps,
integer/fraction dot records, conserved cup transfers, proportional sectors,
equal-width histogram bins, five-number boxes and counterexamples, paired
scatter construction, acceptable by-eye fits and explicit common-factor models.
Time coordinates retain unequal gaps; monthly totals cannot give a daily value.
Dot positions preserve gaps and identities. Histograms use left-inclusive,
right-exclusive equal bins, with raw values hidden in grouped-only tasks.
Every pie angle must match its fraction, not merely total 360 degrees.
Box whiskers mean min/max here, not fenced outlier whiskers; five summaries
cannot recover mean, exact sample size or detailed shape. State the quartile
convention and ties. Accept equivalent fractions, valid jump plans, plausible
cluster bounds and multiple reasonable scatter fits. No trend need not force a
line; changing that choice is replayable. A positive axis stretch preserves r;
tightening residuals changes it. Common-cause rules are intentionally simulated,
not proof of real-world causality. Optional prose remains unassessed.
Completed point entry collapses to a correction disclosure; do not recreate
focused inputs on each keystroke. Partial coordinates, actual simulated draws,
first mistakes/help, original question, camera and displaced drafts persist.
B20 checks cover 45+52 task controls, all nine display routes, 36 shorter desktop
views, partial scatter continuation, backup/repeated import/offline, and bounded
B19/spatial/daily/readiness regressions. Unit count 474 and browser assertions 888
are technical evidence; the child has not used this version. B21 through B39 are implemented; the next work is the stage 6 whole-source audit.


B21 adds DP–DV, seven two-node summarize routes under exactly three directions.
b21-model/view/css owns conserved mean piles, actual card ordering, per-record
absolute distances, common-axis distribution and overlap comparisons, matched
statistical summaries, ordinal proportions, axis and headline repair, reproducible
sampling and bounded extrapolation. Zero values and zero distances still count.
Keep the odd/even quartile convention explicit. Equal mean or equal mean-gap/MAD
ratio does not determine shape or overlap. Allow justified mean/MAD and
median/IQR summaries where either is suitable; pending edits cannot submit stale
constructed summaries, bars or range marks. Do not copy the arithmetic error in
upstream /records/377. All 43 source goals have finite-task coverage boundaries.
Random sampling uses the complete frame without duplicate IDs within a draw,
then returns everyone before the next draw. Preserve actual outcomes and pending
estimates; do not curate samples to show a desired trend. A larger sample is
usually more stable, not guaranteed closer every time and not a cure for bias.
The observed range is not a guaranteed error bound or confidence interval.
Individual observations and sample estimates are different distributions.
Open explanations, actual surveys and general understanding remain unassessed.

storage.js reads old plain JSON and a checked lossless LZW16 envelope. Keep all
five app entry points and cross-tab storage events using the shared adapter.
Small records remain plain. Above 2 million characters compression is attempted;
no attempts, errors, questions or drafts are discarded. Failed writes do not
remove originals. Backup downloads remain ordinary JSON; 50 MB import limit
covers the current full formatted backup. The B37 559-node/750-link synthetic
records, pre-import snapshot, repeat imports and offline restoration were tested;
this does not prove unlimited future history fits. Cache the decoder too.
B21 has 514 unit checks, 1097 browser assertions and five generator checks.
The browser suites cover 43+80 actual-control tasks, seven routes, 43 shorter
views, sampling continuation, large-record storage and bounded B20/spatial/daily/
readiness regression. These are technical checks, not child trials or acceptance.


B22 adds DW–EC, seven short chance routes. Existing L keeps its ID and belongs
to chance-first; the pack has exactly three directions with at most three route
choices at once. b22-model/view/css owns selected outcome sets, sorted likelihood
cards and a true 0–1 number line, replayable die/coin/hidden-rule trials, digit
simulation until the first A, matched probability partitions, red/blue replacement
comparison, ordered outcome grids, conditional-probability trees and constructed
Venn regions/shading. Preserve each task's originally generated nonzero seed,
first prediction, error, actual outcomes and unfinished digit sequences. A rare
1000-digit guard leaves a pending trial to continue, never counts it as a failure.
Do not claim more trials must improve every single step, that past flips make
opposite outcomes due, or that an unusual frequency logically proves bias. An
observed range does not guarantee an error bound. Uniform favorable/total needs
actual equally likely outcomes; two colors are not necessarily equally likely.
0.5 means even chance, not every event described as possible. The 36 ordered
die pairs are equally likely, not the 11 total values. Sum-to-one requires a
complete nonoverlapping partition; ordinary events may overlap. In two circles,
the overlap is counted once and neither remains inside the universal set. A
path's second probability reflects remaining counts when drawing without
replacement. Accept equivalent fractions, tied orders and reordered set elements.
Pending Venn shading and probability partitions cannot pass as earlier saved work.
Free explanations, physical experiments and general understanding remain unassessed.
The 551 unit checks, 1054 browser assertions and five generator checks cover
45+68 actual-control tasks, all eight chance routes including L, 45 shorter desktop
views, exact seeded continuation, first errors, backup/import/offline, large-record
capacity and bounded B21/spatial/daily/readiness regressions. No child trial or
user acceptance is implied. B27 has since been implemented.


B23 adds ED–EL, nine short routes under three shapes directions. b23-model,
b23-view, b23-geometry, b23-solid-view and b23.css own straight-edge closure,
rotated solid frames, actual tile orientations, vertex-based reflection, inclusive
quadrilateral classification, nested sets, bounded object models and constructions
from true circle intersections. A square is a valid rectangle and also
a rhombus; regular polygons need equal sides and equal angles. Preserve
first errors, help, genuine drawing history, camera and original questions.
Do not accept 90-degree triangular pieces as a filled rectangle; the two pieces
must actually complement one another. Do not claim the construction uses only a
compass or assesses physical tools, unrestricted explanations or actual mastery.
588 unit checks, 1162 browser assertions and five generator checks are technical
evidence only; no child trial or user acceptance is implied.


B24 adds EM–ET, eight routes under three position directions. b24-model/view/
geometry/css owns relative positions, coordinate placement, real translation,
reflection, rotation and scaling, bounded regular-polygon fans, centrally
symmetric tiles, frieze and symmetry studio. Preserve first predictions, errors,
help, actual work, original questions and displaced drafts. Reflective distance
is perpendicular; transformations use the stated axis and rotation/scale center.
A regular pentagon test does not rule out irregular or mixed tessellations. The
mirror polygon is connected automatically after entered corresponding points;
do not call it free drawing. Inputs, fixed candidates and limited examples do
not establish open explanations, real tool use, general mastery or child effect.
54 source goals retain explicit limits. 625 unit checks, 1145 browser assertions
and five generator checks are technical only. No child trial or acceptance is
implied. The upstream shape-pack node in EN remains in its original source pack.


B25 adds EU–FB under three angle directions. b25-model/view/geometry/css owns
actual angle rotation and ray-length comparison, estimate-before-reveal,
movable dual-scale on-screen protractor, checked angle comparison, genuine
vertex marks, equal-side ticks, triangle-corner assembly, polygon diagonals,
translated parallel-line crossings, and circle/ray-based triangle construction.
A tangent point on the base is not a triangle. SSS mirror placements are one
shape up to congruence; the shown SSA case has two non-congruent results.
Preserve first wrong estimates, support, question wording, unfinished work and
displaced drafts. Screen parameter construction, fixed candidates, real tool
use, free proofs and general mastery have distinct boundaries; 72 goals list
those boundaries. The 665 unit checks, 1242 browser assertions and five generator
checks are technical only; no child trial or user acceptance is implied.


B26 adds FC to angle-build: two nodes, ten tasks and two source links. The
b26 geometry/model/view constructs real squares on the three sides, uses one
area-bar scale before and after enlargement, allows either right-angle path
between coordinates, and derives side roles from the selected reference angle.
Confirm roles before choosing a ratio; reference-angle swaps must keep the
hypotenuse and exchange opposite/adjacent. Calculators use degrees and inverse
functions, not reciprocals. Preserve first wrong hypotenuse/ratio, help, original
question and displaced draft. Square-root and ratio guidance is a bounded
scaffold and does not complete the still-unimplemented formula-rearrangement
source node. Area bars are not a dissection proof; general proof, physical tools,
free explanations and actual learning remain unassessed. 680 unit checks, 290
browser assertions and five generators are technical evidence only. The child
has not tried this version and user acceptance is not implied.


B27 adds FD–FH under solid-look, solid-fold and solid-cut; old F remains in
solid-fold. b27-model/view/geometry/solid-view/css owns real rotating solids,
preset component stacks, two-dimensional representations, an equilateral
triangular-prism net whose faces hinge without deformation, and bounded planar
sections. A vertical cone slice must pass through the apex and base center;
parallel-end prism slices are congruent, whereas the pictured pyramid and cone
shrink toward the apex. Do not generalize to arbitrary cut orientations. The
child can save intermediate folding/cut positions and actual camera; preserve
first wrong predictions, original question and displaced work. Everyday objects
are idealized models, and fixed-piece placement, physical tools and free
explanations remain unassessed. 709 unit checks, 403 browser assertions and
five generator checks are technical only; no child trial or acceptance is implied.


B28 adds FI–FS under units-compare, units-measure and units-change. E is
grouped only in the units pack through sectionByPack; its area and volume
entries remain visible. b28-model/view/css owns aligned comparison, actual
unit intervals, bounded refinement, ruler zero, simulated balance and vessels,
scale interpolation, same-scale conversion bars and measurement-derived line
plots. Gaps and overlaps cannot pass. Input edits invalidate saved plot entries
and conversion previews. Preserve first errors, estimates, partial records,
questions and displaced drafts. Unit size improves resolution only under stated
conditions; UK and US pints differ and approximate conversions stay approximate.
Fixed examples do not assess physical measurement or free explanations. 753
unit checks, 746 browser assertions and five generator checks are technical only;
no child trial or acceptance is implied.


B29 adds FT and FU under existing units sections. b29-model/view/css owns
replayable movable cuts, same-scale part joining and difference, conserved mass
sharing, directed zero-crossing intervals, ordering and base-60 clock movement.
Allow equivalent equations and valid self-chosen moves; a changed pending cut
cannot submit a previously confirmed result. First errors and support survive
correction, original questions and displaced drafts. 767 unit checks and 404
browser assertions plus five generator checks are technical evidence only;
real physical measuring, free explanations, child trial and acceptance remain
unverified. B30 through B39 are implemented; the next work is the stage 6 whole-source audit.


B30 adds FV–GA under three area directions, retaining D/E across their packs.
Its geometry/model/view/solid-view modules implement nonoverlapping unit cells,
correct polygon areas, actual edge selections and movable or copied fixed pieces;
use separate length, square and cubic units. Circle calculations explicitly use
π≈3.14. Box and prism faces map to fixed 2D nets; the 3D solid is really clickable
and rotatable. A split stack reveals the two contact faces; when joined, they are
not exposed. Preserve first errors, questions, partial constructions, camera and
displaced later work. Open explanations and general understanding remain unassessed.
B30 browser, integration, visual and capacity suites plus bounded B29/spatial/daily/
readiness regressions are in tests/phase5-b30*. Child trial and acceptance remain
unverified; B31 through B39 are implemented; the last planned research gap was supplemented locally.


B31 adds GB and GC under two volume directions, retaining old B/E and all other
pack entrances. Its local models preserve predicted and poured amounts, equal-unit
fills, indirect balance comparisons, first readings and answers. The two flat
comparison containers have equal depth, so visual area and represented quantity
agree. FractionCubeView uses real selectable 3D cubes, rotations and opened layers;
1/2-edge cubes each have 1/8 volume, and every axis must be counted. Equivalent
fraction forms are accepted; length, square and cubic units stay distinct. A new
spatial task frames its own dimensions, while reopening the same unfinished task
restores its camera. The 2¼×1½×2/3-foot example is a calculated solid, not a
fully packed 3D grid. Simulated comparison, estimation and open explanation do not
prove physical measuring, independent reasoning or mastery. B31 visual, all-task,
integration and capacity suites and bounded B30/spatial/daily/readiness regressions
are technical evidence only; child trial and acceptance remain unverified.


B32 adds GD–GJ under three time directions; GJ also remains reachable in units.
Its b32-model/view/css implements replayable event comparison, ordered intervals,
time strips, geared analog clocks, Roman positions, simulated stopwatch, Gregorian
calendar, elapsed-time steps and units. The specified first half requires the
earlier strip half; unspecified equal parts accept any equivalent section. A
short clock hand moves continuously with the minute hand. Intervals exclude the
starting date unless the prompt says otherwise; Gregorian century exceptions apply.
Save first errors and partial work. The stopwatch is a discrete simulation; it
does not prove physical timing or open explanation. B32 all-task, visual,
integration and capacity suites and bounded B31/spatial/daily/readiness regressions
are technical evidence only; child trial and acceptance remain unverified.


B33 adds GK–GP under three money directions. The b33 model/view/css offers
clickable denomination combinations, explicit GBP/AUD/USD contexts, multiple
budget choices, same-unit price comparison, bounded formula evaluation and
pre-filled cell examples. Use integer minor units and exact rational arithmetic;
round at a stated boundary. Saved coin sets remain visible and first errors
survive. Editing a formula requires recalculation. Cash rounding and GST are
limited to the stated Australian examples. A $36 estimate can be close to $35
without being the exact $34.95 change. The shopping basket and spreadsheet
example are separate. Screen coins, fixed examples, method choice and free
explanations do not prove physical payments, mental calculation or mastery.
B33 browser, visual, integration, capacity and bounded regressions are technical
evidence only; child trial and acceptance remain unverified.


B34 adds GQ–GV under three pattern directions. Its b34 model/view/space-view/css
implements repeat patterns, exact scaled sequences, coordinated pairs, explicit
ambiguous continuations, combination grids and bounded step/branch/loop programs.
The 3D growth scene allows real picking, rotation and saved camera; seven ghost
positions are visible scaffolding, not evidence of independent prediction.
A changed program cannot show or submit its stale output. Preserve first errors,
original questions, unfinished work, view and displaced drafts. The source claim
about division needs n≠0 and may simplify to a different denominator. General
proof, open explanation and child learning remain unassessed. B34 all-task, visual,
integration, capacity and B32/spatial/daily/readiness regression are technical
evidence only; child trial and acceptance remain unverified.


B35 adds GW–HC under three unknowns directions and retains original N in the
balance direction. b35 model/view/css implements replayable number-line jumps,
ordered actions, exact rational two-sided transformations, ordered-pair search,
term grouping, single/double-product grids, bounded factoring and two-line point
checks. Same nonzero multiplication or division preserves equation equivalence;
a one-sided change is shown only as a preview. Negative and fractional results
are valid, x and x² are different terms, and parallel or coincident lines do not
have one unique intersection. Rechecking edited inputs invalidates stale results.
Grid positions, cards, bounded parsers and sorted tables are scaffolds; general
proof, independent open explanation and actual child learning remain unassessed.
All B35 controls, spatial entry, backup, simulated next day, offline, capacity
and B34/spatial/daily/readiness regressions have technical evidence only; child
trial and user acceptance remain unverified.


B36 adds HD–HF as three direct routes in functions. Its b36 model/view/css
implements scaled shapes, exact rational substitution and equivalent formulas,
quadrant positions, live parameter changes, real point placement and bounded
quadratic roots. A system-drawn line or curve is explicitly disclosed as a
scaffold. Axis points belong to no quadrant; dividing by zero is invalid; a
negative slope means falling from left to right, and a higher position does not
necessarily mean faster movement. Preserve first errors, question context,
partial work, view and displaced drafts. Finite interactions do not establish
free explanation, independent graph drawing, general understanding or child
learning. Technical checks, simulated next-day recovery and offline use do not
substitute for child trial or user acceptance.

B37 adds HG–HM under three scaling directions; the original I route is retained.
Its b37 model/view/css implements ratio comparison, equal-piece allocation,
scaled rectangles and explicit sequential calculations. Ratios of 0:0 are
undefined; inverse examples exclude zero; quantities with unlike units use
separate visual scales. Scale factors multiply corresponding lengths, and area
uses the squared factor. The inverse curve and diagrams are system-drawn
scaffolds; map, interest and unit conversions still use guided numerical steps.
First errors and feedback remain in records; completed historical submissions
remain, while changed current B37 constructions are not marked independent.
Child trial, open explanations, independent drawing and learning effects remain
unverified; B39 subsequently completed the last 8 nodes and local research brief.

B38 adds HN–HT under three reasoning directions, retaining O. Its model/view
lets children exchange a ten, select and order bounded reasons and construct
their own multiplication counterexample. Positive original values and nonnegative
factors are bounded to the displayed domain; 1 breaks strictly greater but not
never smaller. Values are compared exactly, and products display exact fractions.
First predictions, help, optional prose and old completed submissions remain;
changed current constructions cannot count as current independent evidence.
Other B38 nodes reuse prior constructions; selected cards and guided steps do
not establish independent arguments, free drawing, actual peer talk or child
learning. B39 subsequently completed the final planned 8 nodes and local research brief; stage 4 child
trial and actual next-day continuation remain unverified.

B39 adds HU–HW under reasoning-plan, while preserving the other routes. Its local
graph, hundred-chart and calculator models accept approximate graph readings and
different methods; they preserve first errors and do not assess actual mental or
paper method, open prose, independent drawings or general mastery. The 587-node
first pass is finite task coverage, not all mathematics or complete source-goal
assessment. 13 new joint activities follow original edges. The embedded legacy
storage handler reads the latest stored state when a queued storage event arrives,
so older event payloads do not overwrite a newer draft. Evidence is in
verification/phase5/B39/; child trial and user acceptance remain outstanding.
