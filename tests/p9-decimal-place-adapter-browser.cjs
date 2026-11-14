// The decimal scope shares the same real-control, offline, refresh, invalid
// history and source-isolation checks as the existing integer exchange suite.
process.env.MATH_PLACE_EVIDENCE_SCOPE='decimal';
require('./p9-place-adapter-browser.cjs');
