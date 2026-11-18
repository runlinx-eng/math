import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildLiveBrowserMatrix} from '../scripts/ci-live-browser-matrix.mjs';
import {BROWSER_GROUPS,GROUP_NAMES} from '../scripts/required-browser-checks.mjs';

const registry=()=>JSON.parse(readFileSync(new URL('../ci/math-families.json',import.meta.url),'utf8'));
const config=()=>JSON.parse(readFileSync(new URL('../ci/live-browser-matrix.json',import.meta.url),'utf8'));
const mock=id=>({familyId:id,version:1,required:true,
 entry:'tests/p9-'+id+'-browser.cjs',viewport:[1920,1080],
 artifacts:['verification/p9-'+id+'/'],proofContracts:['math','correction','persistence','negative','backup'],
 resources:{estimatedScriptMinutes:8,memoryMiB:2048,runnerType:'standard',exclusiveLocks:[]},dependsOn:[]});
const plan=(r=registry(),options={})=>buildLiveBrowserMatrix(r,{fileExists:()=>true,...options});

test('#239 live output really contains the exact old 13 required groups and 86 legacy invocations',()=>{
 const before=JSON.stringify(BROWSER_GROUPS);
 const x=buildLiveBrowserMatrix();
 assert.equal(x.proof.activation,'enabled');
 assert.deepEqual(x.matrix,{group:GROUP_NAMES});
 assert.equal(x.proof.legacyGroups,13);
 assert.equal(x.proof.legacyCalls,86);
 assert.equal(x.proof.legacyEvidenceDirs,83);
 assert.equal(x.proof.registeredNewFamilies,0);
 assert.deepEqual(x.proof.addedGroups,[]);
 assert.deepEqual(Object.keys(x.definitions),GROUP_NAMES);
 assert.equal(JSON.stringify(BROWSER_GROUPS),before,'Production generation must not mutate frozen old roster');
 assert.equal(x.proof.digest,buildLiveBrowserMatrix().proof.digest,'Rebuilding plan is deterministic');
 const p={...x.proof};delete p.digest;
 assert.equal(x.proof.digest,createHash('sha256').update(JSON.stringify(p)).digest('hex'));
});

test('#239 a genuinely new registered family automatically appears in LIVE GitHub matrix',()=>{
 const r=registry();r.newFamilies=[mock('matrixexample')];
 const x=plan(r);
 assert.deepEqual(x.matrix.group.slice(0,13),GROUP_NAMES);
 assert.deepEqual(x.matrix.group.slice(13),['family-wave-1-job-01']);
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

test('#239 resource-lock conflict requiring another wave must fail, not silently parallelize',()=>{
 const r=registry();r.newFamilies=[mock('aaa'),mock('bbb')];
 for(const module of r.newFamilies){
  module.resources.estimatedScriptMinutes=20;
  module.resources.exclusiveLocks=['learning-store'];
 }
 assert.throws(()=>plan(r),/Cannot run dependency\/resource wave 2/);
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
