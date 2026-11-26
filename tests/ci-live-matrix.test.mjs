import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildLiveBrowserMatrix} from '../scripts/ci-live-browser-matrix.mjs';
import {BROWSER_GROUPS,GROUP_NAMES,runBrowserGroup,validateRequiredGate} from '../scripts/required-browser-checks.mjs';

const registry=()=>JSON.parse(readFileSync(new URL('../ci/math-families.json',import.meta.url),'utf8'));
const config=()=>JSON.parse(readFileSync(new URL('../ci/live-browser-matrix.json',import.meta.url),'utf8'));
const mock=id=>({familyId:id,version:1,required:true,
 entry:'tests/p9-'+id+'-browser.cjs',viewport:[1920,1080],
 artifacts:['verification/p9-'+id+'/'],proofContracts:['math','correction','persistence','negative','backup'],
 resources:{estimatedScriptMinutes:8,memoryMiB:2048,runnerType:'standard',exclusiveLocks:[]},dependsOn:[]});
const plan=(r=registry(),options={})=>buildLiveBrowserMatrix(r,{fileExists:()=>true,...options});
const tail='evidence-expansion-2-tail';
const legacyRunners=[...GROUP_NAMES,tail];

test('#239 live matrix preserves the 13 legacy groups and schedules every reviewed new family once',()=>{
 const before=JSON.stringify(BROWSER_GROUPS),reviewed=registry().newFamilies;
 const x=buildLiveBrowserMatrix(),extra=x.matrix.group.slice(legacyRunners.length);
 assert.equal(x.proof.activation,'enabled');
 assert.deepEqual(x.matrix.group.slice(0,13),GROUP_NAMES);
 assert.ok(extra.length>0,'at least one independent family group is scheduled');
 assert.ok(extra.every(id=>/^family-wave-[1-9][0-9]*-job-[0-9]+$/.test(id)));
 assert.deepEqual(x.matrix.group,Object.keys(x.definitions));
 assert.deepEqual(extra,x.proof.addedGroups.map(g=>g.id));
 assert.deepEqual(x.matrix.group.slice(0,14),legacyRunners);
 assert.equal(x.proof.legacyGroups,13);
 assert.equal(x.proof.legacyRunnerGroups,14);
 assert.equal(x.proof.legacyCalls,86);
 assert.equal(x.proof.legacyEvidenceDirs,83);
 assert.equal(x.proof.registeredNewFamilies,reviewed.length);
 const commands=extra.flatMap(id=>x.definitions[id].commands);
 assert.deepEqual(commands.map(c=>c.file).sort(),
  reviewed.map(m=>m.entry).sort(),'every registered browser entry must run exactly once');
 assert.ok(commands.every(c=>Object.keys(c.env).length===0));
 assert.equal(Object.values(x.definitions).flatMap(g=>g.commands).length,86+reviewed.length);
 assert.deepEqual(extra.flatMap(id=>x.definitions[id].artifacts).sort(),
  reviewed.flatMap(m=>m.artifacts).sort(),'each new family retains its original evidence path');
 assert.deepEqual(x.proof.addedGroups.map(g=>g.commandCount),
  extra.map(id=>x.definitions[id].commands.length));
 assert.ok(x.proof.addedGroups.every(g=>g.scriptMinutes<=29&&g.peakMemoryMiB<=6000));
 assert.deepEqual(x.definitions[extra[0]].commands,
  [{file:'tests/p9-compare-adapter-browser.cjs',env:{}}],
  'the reviewed 29-minute compare family remains isolated');
 assert.ok(reviewed.some(m=>m.familyId==='cupfill'&&
  m.entry==='tests/p9-cupfill-adapter-browser.cjs'),
  'the exact native cupfill browser contract is registered');
 assert.equal(JSON.stringify(BROWSER_GROUPS),before,'Original browser list must not change');
 assert.equal(x.proof.digest,buildLiveBrowserMatrix().proof.digest,'Deterministic matrix');
 const p={...x.proof};delete p.digest;
 assert.equal(x.proof.digest,createHash('sha256').update(JSON.stringify(p)).digest('hex'));
});

test('#239 a genuinely new registered family automatically appears in LIVE GitHub matrix',()=>{
 const r=registry();r.newFamilies=[mock('matrixexample')];
 const x=plan(r);
 assert.deepEqual(x.matrix.group.slice(0,13),GROUP_NAMES);
 assert.deepEqual(x.matrix.group.slice(0,14),legacyRunners);
 assert.deepEqual(x.matrix.group.slice(14),['family-wave-1-job-01']);
 assert.equal(x.proof.registeredNewFamilies,1);
 assert.equal(x.proof.addedGroups[0].commandCount,1);
 assert.equal(x.definitions['family-wave-1-job-01'].commands[0].file,
  'tests/p9-matrixexample-browser.cjs');
 assert.deepEqual(x.definitions['family-wave-1-job-01'].artifacts,['verification/p9-matrixexample/']);
 assert.deepEqual(x.definitions['family-wave-1-job-01'].modules[0].proofContracts,
  ['math','correction','persistence','negative','backup']);
 assert.equal(Object.values(x.definitions).flatMap(g=>g.commands).length,87);
});

test('#239 compatible new modules are packed by measured estimates without editing workflow',()=>{
 const r=registry();r.newFamilies=[mock('aaa'),mock('bbb'),mock('ccc')];
 r.newFamilies[0].resources.estimatedScriptMinutes=11;
 r.newFamilies[1].resources.estimatedScriptMinutes=10;
 r.newFamilies[2].resources.estimatedScriptMinutes=8;
 const x=plan(r);
 assert.equal(x.proof.registeredNewFamilies,3);
 assert.equal(x.proof.addedGroups.length,1);
 assert.equal(x.proof.addedGroups[0].scriptMinutes,29);
 assert.deepEqual(x.definitions['family-wave-1-job-01'].commands.map(c=>c.file),
  ['tests/p9-aaa-browser.cjs','tests/p9-bbb-browser.cjs','tests/p9-ccc-browser.cjs']);
});

test('#239 cross-group legacy and new-family dependencies must fail CLOSED in initial live matrix',()=>{
 for(const dependsOn of [['legacy:evidence-area'],['another-family']]){
  const r=registry();r.newFamilies=[mock('dependent')];
  r.newFamilies[0].dependsOn=dependsOn;
  assert.throws(()=>plan(r),/cross-job dependencies|unknown or self dependency/);
 }
});

test('#315 resource locks reject unproven matrix concurrency, even when multiple batches fit',()=>{
 const r=registry();r.newFamilies=[mock('aaa'),mock('bbb')];
 for(const module of r.newFamilies){
  module.resources.estimatedScriptMinutes=20;
  module.resources.exclusiveLocks=['learning-store'];
 }
 assert.throws(()=>plan(r),/exclusive locks/);
});

test('#239 unprovisioned runner class and uncertain memory demand fail closed',()=>{
 const r=registry();r.newFamilies=[mock('heavy')];
 r.newFamilies[0].resources.runnerType='cpu-heavy';
 assert.throws(()=>plan(r),/CPU-heavy runner type/);
 r.newFamilies[0].resources.runnerType='standard';
 r.newFamilies[0].resources.memoryMiB=7000;
 assert.throws(()=>plan(r),/standard-runner capacity/);
});

test('#239 forbids losing the rollback baseline or silently disabling registered work',()=>{
 const r=registry();r.newFamilies=[mock('newmodule')];
 const disabled=config();disabled.activation='disabled';
 assert.throws(()=>plan(r,{config:disabled}),/Unreviewed dynamic matrix state/);
 const wrong=config();wrong.rollbackMainSha='f'.repeat(40);
 assert.throws(()=>plan(r,{config:wrong}));
 const duplicate=registry();duplicate.newFamilies=[mock('newmodule'),mock('newmodule')];
 assert.throws(()=>plan(duplicate),/Duplicate/);
 const changed=registry();changed.baseline.expectedCommands=85;
 assert.throws(()=>plan(changed));
});

test('#239 new registry proves real source files exist; synthetic success does not hide missing files',()=>{
 const r=registry();r.newFamilies=[mock('newmodule')];
 assert.throws(()=>buildLiveBrowserMatrix(r),/Missing new browser test/);
});

// More than 290 cumulative planned script minutes is legal in an explicitly
// dispatched FULL run; queued GitHub matrix jobs still retain the 29/35 limits.
test('#315 full matrix queues over-capacity independent families without omitting any',()=>{
 const r=registry();r.newFamilies=Array.from({length:11},(_,i)=>{
  const f=mock('batch'+String(i+1));f.resources.estimatedScriptMinutes=29;return f;
 });
 const x=plan(r),extra=x.matrix.group.slice(legacyRunners.length);
 assert.equal(extra.length,11);
 assert.ok(extra.some(id=>id.startsWith('family-wave-2-')));
 assert.deepEqual(extra.flatMap(id=>x.definitions[id].commands.map(c=>c.file)).sort(),
  r.newFamilies.map(f=>f.entry).sort());
 assert.ok(x.proof.addedGroups.every(g=>g.scriptMinutes<=29&&g.peakMemoryMiB<=6000));
 assert.equal(x.proof.addedGroups.reduce((n,g)=>n+g.scriptMinutes,0),319);
});

test('capacity partition keeps the frozen logical inventory, all commands and every exact artifact owner',()=>{
 const x=buildLiveBrowserMatrix(),origin='evidence-expansion-2';
 const names=['groups','transform','angle','scalechain','fracshare','unitcover'];
 const commands=names.map(name=>({file:'tests/p9-'+name+'-adapter-browser.cjs',env:{}}));
 const artifacts=names.map(name=>'verification/p9-'+name+'-adapter/');
 assert.deepEqual(BROWSER_GROUPS[origin],{commands,artifacts});
 assert.deepEqual(x.definitions[origin],{commands:commands.slice(0,3),artifacts:artifacts.slice(0,3)});
 assert.deepEqual(x.definitions[tail],{commands:commands.slice(3),artifacts:artifacts.slice(3)});
 for(const id of GROUP_NAMES.filter(id=>id!==origin))assert.deepEqual(x.definitions[id],BROWSER_GROUPS[id]);
 assert.deepEqual(x.proof.legacyCapacitySplit,{sourceGroup:origin,runners:[origin,tail],commandCounts:[3,3],
  observedRunId:'45625745253',cancelledJobId:'139248173616',timeoutMinutes:35,maxParallel:10});
 const actual=legacyRunners.flatMap(id=>x.definitions[id].commands.map(c=>JSON.stringify(c))).sort();
 const expected=Object.values(BROWSER_GROUPS).flatMap(g=>g.commands.map(c=>JSON.stringify(c))).sort();
 assert.equal(actual.length,86);assert.deepEqual(actual,expected);
 const paths=legacyRunners.flatMap(id=>x.definitions[id].artifacts).sort();
 assert.equal(paths.length,83);assert.equal(new Set(paths).size,83);
 assert.deepEqual(paths,Object.values(BROWSER_GROUPS).flatMap(g=>g.artifacts).sort());
});

test('full live receipt gate rejects a missing, truncated, stale, failed or cancelled capacity tail',()=>{
 const {definitions,matrix}=buildLiveBrowserMatrix();
 const context={event:'workflow_dispatch',sha:'a'.repeat(40),runId:'45625745253',attempt:1};
 const needs={'static-checks':{result:'success',outputs:{run_browser:'true',run_offline:'true',browser_matrix:JSON.stringify(matrix)}},
  browser:{result:'success',outputs:{}},'smoke-checks':{result:'success',outputs:{}}};
 const reports=matrix.group.map(group=>runBrowserGroup({group,scope:'true',context,definitions,execute:()=>({status:0,signal:null})}));
 const gate=(r=reports,n=needs)=>validateRequiredGate({needs:n,reports:r,context,definitions});
 assert.equal(gate().invocations,86+registry().newFamilies.length);
 assert.throws(()=>gate(reports.filter(r=>r.group!==tail)),/Every declared browser group/);
 const missing=structuredClone(reports);missing.find(r=>r.group===tail).commands.pop();
 assert.throws(()=>gate(missing),/Missing or extra browser command result/);
 const wrong=structuredClone(reports);wrong.find(r=>r.group===tail).commands[0].env={MATH_SKIP:'1'};
 assert.throws(()=>gate(wrong),/inventory or environment changed/);
 const stale=structuredClone(reports);stale.find(r=>r.group===tail).sha='b'.repeat(40);
 assert.throws(()=>gate(stale),/different checkout/);
 const failed=structuredClone(reports),failure=failed.find(r=>r.group===tail);
 failure.commands[0].exitCode=1;failure.commands[0].outcome='failure';failure.status='failure';
 assert.throws(()=>gate(failed),/did not complete/);
 const cancelled=structuredClone(needs);cancelled.browser.result='cancelled';
 assert.throws(()=>gate(reports,cancelled),/must finish with success/);
 const matrixMissing=structuredClone(needs);
 matrixMissing['static-checks'].outputs.browser_matrix=JSON.stringify({group:matrix.group.filter(id=>id!==tail)});
 assert.throws(()=>gate(reports,matrixMissing),/exact registered and legacy/);
});
