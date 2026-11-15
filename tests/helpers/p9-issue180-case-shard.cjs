'use strict';
// An opt-in diagnostic partition only. With no shard the original case order is unchanged.
function selectDiagnosticCases(allCases, shard = '') {
  if (!Array.isArray(allCases) || allCases.length === 0) {
    throw new Error('Issue #180 diagnostic requires a nonempty original case sequence');
  }
  if (shard === '' || shard == null) return allCases;
  if (shard !== '0' && shard !== '1') {
    throw new Error('MATH_ISSUE180_PLACE_SHARD must be unset, 0, or 1');
  }
  const selected = allCases.filter((_, index) => index % 2 === Number(shard));
  if (!selected.length) throw new Error('Issue #180 shard has no native cases');
  return selected;
}
module.exports = { selectDiagnosticCases };
