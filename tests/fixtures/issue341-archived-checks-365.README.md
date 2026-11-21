# #341 archived Check inputs for new shared integration

Only `issue341-archived-input-references.json` is committed: exact source,
Artifact/member identifiers and hashes, with no model or Check payloads.
The runtime inputs are 365 actual model/record captures from the successful central Chromium run
https://github.com/runlinx-eng/math/actions/runs/44909628782 at source HEAD
`0cafdaed5aad3d32bf09ab1d9abf6e77130a069d`.

The inputs cover 113 families: P007 30 positions, P009 27, B 308. Every restored row preserves
the complete original model and Check record, source identity, official ZIP
artifact ID, exact member path and member SHA-256. The original records contain
two Checks for 360 positions and three for five positions. No model or Check
was synthesized; the original family suites and native navigation are not
rerun to produce this input.

The new composition and audit tests use these inputs to verify the new shared
router, submitted-contract delegation, source exclusivity, bounded feedback,
record preservation and browser rendering. This is an isolated integration
consumer, not production registration or mathematical approval. The approved
manifest remains 813 and the default application imports no candidate entry.

The full original ZIP bytes are separately preserved with their official
size/SHA-256 and complete ZIP CRC results in the #341 audit handoff. A compact
fixture is not a replacement for those originals or their existing evidence.

Run `python3 scripts/issue341-prepare-archived-inputs.py --archive-dir <original-zip-directory>`
to restore the ignored local input `verification/issue341-inputs/archived-checks-365.json`.
In CI, omit `--archive-dir` and provide a read-only `GITHUB_TOKEN`; the script
downloads the original existing official ZIPs, verifies size/SHA-256/CRC and
each captured member and model/record digest. Redirects never carry credentials
to another host. No models or Check records are uploaded by this transport.

Only the changed shared-integration scope runs the new Node/Chromium checks.
An expired or missing original fails closed; recover the exact preserved ZIPs
from the #341 durable archive rather than rerunning old family suites. A future
permanent CI source for raw records requires its own permitted storage choice.
Failure uploads explicitly exclude this new input directory. Do not regenerate
the inputs with a solver or trim P007's original wrong-to-correct records.
