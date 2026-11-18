import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateFrozenInventory,scanViewports,audit} from '../scripts/ci-audit-viewports.mjs';

test('#239 immutable pre-migration inventory preserves all current commands, env and artifact paths',()=>{
 const counts=validateFrozenInventory();
 assert.deepEqual(counts,{groups:13,commands:86,distinctScripts:85,evidenceDirs:83});
});

test('#239 all 85 distinct Chromium entrypoints receive an honest static viewport report',()=>{
 const scanned=scanViewports();
 assert.equal(scanned.length,85);
 assert.equal(new Set(scanned.map(s=>s.entry)).size,85);
 for(const row of scanned){
  assert.ok(Array.isArray(row.viewportEvidence));
  assert.equal(typeof row.needsManualSceneReview,'boolean');
  assert.match(row.note,/no claim/);
 }
 const paths=['tests/p9-area-adapter-browser.cjs',
  'tests/p9-unitcover-adapter-browser.cjs','tests/p9-multable-adapter-browser.cjs'];
 for(const path of paths){
  const entry=scanned.find(x=>x.entry===path);
  assert.ok(entry);
  assert.equal(entry.candidate1440,true);
  assert.equal(entry.secondary1280,true);
  assert.ok(entry.viewportEvidence.length>0);
 }
});

test('#239 audit is read-only: never upgrades unreviewed scenarios or claims a completed migration',()=>{
 const report=audit();
 assert.equal(report.statuses.semanticScenarioMap,'pending');
 assert.equal(report.statuses.layoutObstructionAudit,'pending');
 assert.equal(report.statuses.browserPilot,'not-run');
 assert.equal(report.statuses.requiredGate,'unchanged');
 assert.equal(report.standardContentBox.state,'pending semantic/layout/coordinate review');
 const baseline=JSON.parse(readFileSync(new URL('../ci/issue239-legacy-browser-inventory.json',import.meta.url)));
 assert.equal(baseline.groups.length,12);
 assert.ok(baseline.pilots.every(x=>x.sceneMapping==='pending'));
 assert.equal(report.scripts.length,85);
 assert.equal(report.locked.groups,13);
 const split=JSON.parse(readFileSync(new URL('../ci/issue239-p10-capacity-split.json',import.meta.url)));
 assert.deepEqual(split.groupCuts,[{id:'p10-learning',start:0,end:6},{id:'p10-learning-tail',start:6,end:8}]);
});
