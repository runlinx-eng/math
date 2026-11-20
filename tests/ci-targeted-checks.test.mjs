import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planTargetedChecks,validateDailyGate} from '../scripts/ci-targeted-checks.mjs';
import {buildLiveBrowserMatrix} from '../scripts/ci-live-browser-matrix.mjs';
import {dailyDefinitions} from '../scripts/ci-targeted-checks.mjs';

const registry=JSON.parse(readFileSync(new URL('../ci/math-families.json',import.meta.url),'utf8'));
const definitions=buildLiveBrowserMatrix().definitions;
const plan=(event,changedFiles,previousRegistry=null)=>
 planTargetedChecks({event,changedFiles,definitions,registry,previousRegistry});
const context={event:'pull_request',sha:'f'.repeat(40),runId:'456789',attempt:1};
const needs=(p,overrides={})=>({
 'static-checks':{result:'success'},
 'plan-checks':{result:'success',outputs:{
  run_smoke:p.runSmoke?'true':'false',run_targeted:p.scripts.length?'true':'false',
  targeted_matrix:JSON.stringify(p.matrix),targeted_digest:p.digest}},
 browser:{result:'skipped'},
 'smoke-checks':{result:p.runSmoke?'success':'skipped'},
 targeted:{result:p.scripts.length?'success':'skipped'},
 ...overrides
});
const receipts=(p)=>p.matrix.include.map(x=>({
 schema:'math-ci-targeted-result/1',...x,...context,
 elapsedMs:13,exitCode:0,error:null,status:'success'
}));
const gate=(p,n=needs(p),r=receipts(p),ctx=context)=>
 validateDailyGate({needs:n,reports:r,context:ctx,plan:p});

test('documentation-only changes launch no Chromium or empty family runner',()=>{
 const p=plan('pull_request',['README.md','docs/LEARNING-DESIGN.md']);
 assert.equal(p.runSmoke,false);
 assert.deepEqual(p.matrix,{include:[]});
 assert.deepEqual(gate(p).targetedScripts,[]);
 const failed=structuredClone(needs(p));failed['smoke-checks'].result='success';
 assert.throws(()=>gate(p,failed,[]),/Smoke job result/);
});
test('CI-only edits run smoke without launching the 17 legacy empty jobs',()=>{
 const p=plan('pull_request',['.github/workflows/pull-request-baseline.yml','scripts/required-browser-checks.mjs']);
 assert.equal(p.runSmoke,true);
 assert.deepEqual(p.matrix,{include:[]});
 assert.deepEqual(gate(p).targetedScripts,[]);
 const fake=structuredClone(needs(p));fake.browser.result='success';
 assert.throws(()=>gate(p,fake,[]),/Full browser job/);
});
test('legacy source evidence edits select only its owned math family',()=>{
 const p=plan('pull_request',['dist/learning/area-evidence.js']);
 assert.deepEqual(p.scripts,['tests/p9-area-adapter-browser.cjs']);
 assert.equal(p.runSmoke,true);
 assert.deepEqual(gate(p).targetedScripts,p.scripts);
});
test('test entrypoint changes select the changed registered script, not its entire group',()=>{
 const p=plan('pull_request',['tests/p9-unitcover-adapter-browser.cjs']);
 assert.deepEqual(p.scripts,['tests/p9-unitcover-adapter-browser.cjs']);
 assert.equal(gate(p).targetedScripts.length,1);
});
test('new family evidence automatically maps to registered standalone browser proof',()=>{
 const p=plan('pull_request',['dist/learning/sequence-invariance-evidence.js']);
 assert.deepEqual(p.scripts,['tests/p9-sequence-invariance-browser.cjs']);
});
test('registering one new family selects that family rather than all current families',()=>{
 const previous=structuredClone(registry);
 previous.newFamilies=previous.newFamilies.filter(x=>x.familyId!=='compare');
 const p=plan('pull_request',['ci/math-families.json'],previous);
 assert.deepEqual(p.scripts,['tests/p9-compare-adapter-browser.cjs']);
 assert.throws(()=>plan('pull_request',['ci/math-families.json']),/previous registry/);
});
test('service-worker changes select actual offline regressions; shared lesson code is not silent',()=>{
 const p=plan('pull_request',['dist/sw.js']);
 assert.deepEqual(p.scripts,[
  'tests/p10-longterm-offline-browser.cjs','tests/p10-release-upgrade-repeat.cjs',
  'tests/p10-sw-nav-isolation-browser.cjs'
 ]);
 const shared=plan('pull_request',['dist/learning/phase5/b999-unknown-model.js']);
 assert.deepEqual(shared.scripts,[
  'tests/p10-learning-continuity-browser.cjs','tests/p9-thinking-feedback-browser.cjs'
 ]);
});
test('integrated main only rechecks smoke; manual milestone runs keep full browser gate',()=>{
 const push=plan('push',['dist/learning/area-evidence.js']);
 assert.equal(push.runSmoke,true);assert.deepEqual(push.scripts,[]);
 assert.equal(gate(push,needs(push),[],{...context,event:'push'}).smoke,true);
 const full=plan('workflow_dispatch',[]);
 assert.equal(full.runSmoke,true);assert.deepEqual(full.scripts,[]);
 assert.throws(()=>gate(full),/Daily gate requires/);
});
test('targeted receipt gate rejects omission, stale SHA, wrong scope and fabricated successes',()=>{
 const p=plan('pull_request',['dist/learning/area-evidence.js']);
 const missing=gate.bind(null,p,needs(p),[]);
 assert.throws(missing,/Missing required/);
 let mutated=receipts(p);mutated[0].sha='a'.repeat(40);
 assert.throws(()=>gate(p,needs(p),mutated),/another run or checkout/);
 mutated=receipts(p);mutated[0].exitCode=1;mutated[0].status='failure';
 assert.throws(()=>gate(p,needs(p),mutated),/did not pass/);
 mutated=receipts(p);mutated[0].script='tests/p9-money-adapter-browser.cjs';
 assert.throws(()=>gate(p,needs(p),mutated),/Unselected/);
 mutated=receipts(p);mutated.push({...mutated[0]});
 assert.throws(()=>gate(p,needs(p),mutated),/Duplicate/);
 const fake=needs(p);fake['plan-checks'].outputs.targeted_matrix=JSON.stringify({include:[]});
 assert.throws(()=>gate(p,fake,receipts(p)));
 const fakeDigest=needs(p);fakeDigest['plan-checks'].outputs.targeted_digest='a'.repeat(64);
 assert.throws(()=>gate(p,fakeDigest,receipts(p)),/checksum/);
 const cancelled=needs(p);cancelled.targeted.result='cancelled';
 assert.throws(()=>gate(p,cancelled,receipts(p)),/Targeted job/);
 const failedPlanner=needs(p);failedPlanner['plan-checks'].result='failure';
 assert.throws(()=>gate(p,failedPlanner,receipts(p)),/planning job/);
});
test('matrix decisions are deterministic and deduplicate related files',()=>{
 const p=plan('pull_request',['dist/learning/area-evidence.js','tests/p9-area-adapter-browser.cjs']);
 const q=plan('pull_request',['tests/p9-area-adapter-browser.cjs','dist/learning/area-evidence.js']);
 assert.deepEqual(p,q);
 assert.equal(p.matrix.include.length,1);
 assert.match(p.matrix.include[0].id,/^[a-f0-9]{12}$/);
});
test('workflow only starts full matrix on explicit dispatch and only saves daily screenshots on failure',()=>{
 const y=readFileSync(new URL('../.github/workflows/pull-request-baseline.yml',import.meta.url),'utf8');
 assert.match(y,/workflow_dispatch:/);
 assert.doesNotMatch(y,/^  schedule:/m);
 assert.match(y,/^  plan-checks:/m);
 assert.match(y,/^  targeted:/m);
 assert.match(y,/^  browser:/m);
 assert.match(y,/run_targeted: \$\{\{ steps\.target_plan\.outputs\.run_targeted \}\}/);
 assert.match(y,/targeted_matrix: \$\{\{ steps\.target_plan\.outputs\.targeted_matrix \}\}/);
 assert.match(y,/run_smoke: \$\{\{ steps\.target_plan\.outputs\.run_smoke \}\}/);
 assert.match(y,/if: github\.event_name == 'workflow_dispatch'/);
 assert.match(y,/matrix: \$\{\{ fromJSON\(needs\.plan-checks\.outputs\.targeted_matrix\) \}\}/);
 assert.match(y,/node scripts\/ci-targeted-checks\.mjs gate/);
 assert.match(y,/node scripts\/required-browser-checks\.mjs gate/);
 assert.match(y,/if: failure\(\)/);
});

test('#315 daily impacted-family selection stays independent of total full capacity',()=>{
 const expanded=structuredClone(registry);
 expanded.newFamilies.push(...Array.from({length:15},(_,i)=>({
  ...structuredClone(registry.newFamilies[0]),familyId:'overflow'+i,
  entry:'tests/p9-overflow'+i+'-browser.cjs',
  artifacts:['verification/p9-overflow'+i+'/'],
  resources:{...registry.newFamilies[0].resources,estimatedScriptMinutes:29}
 })));
 const independent=dailyDefinitions(expanded,{fileExists:()=>true});
 assert.equal(Object.values(independent).filter(d=>d.newFamily).length,expanded.newFamilies.length);
 assert.throws(()=>buildLiveBrowserMatrix(expanded,{fileExists:()=>true}),
  /single parallel|Cannot run dependency|wave|capacity/);
 const p=planTargetedChecks({event:'pull_request',changedFiles:['docs/LEARNING-DESIGN.md'],
  registry:expanded,definitions:independent});
 assert.deepEqual(p.scripts,[]);
 const q=planTargetedChecks({event:'pull_request',changedFiles:['dist/learning/area-evidence.js'],
  registry:expanded,definitions:definitions});
 assert.ok(q.scripts.includes('tests/p9-area-adapter-browser.cjs'));
});
