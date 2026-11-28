import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {historicalBrowserScripts} from '../scripts/ci-targeted-checks.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('current required checks and original archives have explicit separate lifecycles',()=>{
 const required=read('.github/workflows/pull-request-baseline.yml');
 const historical=read('.github/workflows/historical-evidence-audit.yml');
 assert.match(historical,/^on:\n  workflow_dispatch:\n/m);assert.doesNotMatch(historical,/^  (pull_request|push|schedule):/m);
 assert.doesNotMatch(required,/python3 scripts\/issue34[123]-prepare-/);
 assert.match(required,/tests\/current-formal-evidence-regression\.test\.mjs/);
 assert.match(required,/MATH_EVIDENCE_AUDIT_MODE: current/);
 for(const script of ['audit-learning-evidence','audit-evidence-expansion','audit-interaction-semantics']){
  assert.match(required,new RegExp('node scripts/'+script+'\\.mjs --current'));
  assert.match(historical,new RegExp('node scripts/'+script+'\\.mjs\\n'));
 }
 for(const file of historicalBrowserScripts){
  assert.ok(historical.includes('node '+file));assert.ok(!required.includes(file),'old ZIP browser consumers are not routine gate dependencies');
 }
 for(const f of ['issue341-isolated-integration','issue341-audit-fixture-integration','issue341-learning-audit-injection','issue341-followup-126-original-inputs','issue341-followup-218-original-inputs']){
  assert.ok(historical.includes('tests/'+f+'.test.mjs'));assert.ok(!required.includes('tests/'+f+'.test.mjs'));
 }
 for(const s of ['issue341-prepare-archived-inputs','issue341-prepare-followup-126-inputs','issue342-prepare-p006-inputs','issue342-prepare-p001-p005-inputs','issue342-prepare-a258-first33-inputs','issue342-prepare-a258-next11-inputs','issue343-prepare-a214-b39-inputs','issue343-prepare-a214-next95-inputs','issue341-prepare-followup-218-inputs'])assert.ok(historical.includes('python3 scripts/'+s+'.py'));
 assert.doesNotMatch(historical,/continue-on-error:\s*true/);
 assert.match(required,/node scripts\/ci-node-scope\.mjs run/);
 assert.match(required,/node scripts\/audit-learning-task-rules\.mjs/);
 assert.match(required,/node scripts\/ci-targeted-checks\.mjs run/);
 assert.match(required,/Require exact selected receipts or the entire manually requested inventory/);
});
