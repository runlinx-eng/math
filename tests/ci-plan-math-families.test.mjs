import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planShadow} from '../scripts/ci-plan-math-families.mjs';
import {BROWSER_GROUPS} from '../scripts/required-browser-checks.mjs';

const source=()=>JSON.parse(readFileSync(new URL('../ci/math-families.json',import.meta.url),'utf8'));
const accepted=()=>planShadow(source());
const fakeModule=(familyId,{minutes=8,dependsOn=[],locks=[],runnerType='standard'}={})=>({
 familyId,version:1,required:true,
 entry:'tests/p9-shadow-'+familyId+'-browser.cjs',
 viewport:[1920,1080],artifacts:['verification/ci-shadow-'+familyId+'/'],
 proofContracts:['math','correction','persistence','negative','backup'],
 dependsOn,resources:{estimatedScriptMinutes:minutes,memoryMiB:2048,runnerType,exclusiveLocks:locks}
});
const synth=(items)=>{const src=source();src.newFamilies=items;return src};
const withSynthetic=(items)=>planShadow(synth(items),{fileExists:()=>true});

test('#239 shadow only: exact 13 legacy groups, 86 commands, 85 scripts and 83 evidence directories',()=>{
 const before=JSON.stringify(BROWSER_GROUPS);
 const plan=accepted();
 assert.equal(plan.mode,'shadow-only');
 assert.equal(plan.sourceMainSha,'b23bff217fa0baf5967b42e8553e01951d70d7c3');
 assert.equal(plan.legacyGroups.length,13);
 assert.equal(plan.legacyCommands,86);
 assert.equal(plan.legacyDistinctScripts,85);
 assert.equal(plan.legacyEvidenceDirs,83);
 assert.equal(plan.registeredNewFamilies,source().newFamilies.length,
  'every reviewed new family is present in the mandatory registry');
 assert.ok(source().newFamilies.some(m=>m.familyId==='cupfill'&&
  m.entry==='tests/p9-cupfill-adapter-browser.cjs'),
  'the four-source cupfill family joins the reviewed mandatory registry');
 assert.ok(plan.plannedNewJobs.length>=4&&plan.plannedNewJobs.length<=5,
  'existing four independent work groups stay within their individual budgets');
 const actual=plan.plannedNewJobs.flatMap(job=>job.modules.map(m=>m.entry)).sort();
 const expected=source().newFamilies.map(m=>m.entry).sort();
 assert.deepEqual(actual,expected,'all reviewed family browser scripts remain scheduled exactly once');
 assert.ok(source().newFamilies.every(m=>m.required===true));
 assert.ok(plan.plannedNewJobs.every(job=>job.wave===1));
 assert.ok(plan.plannedNewJobs.every(job=>job.scriptMinutes<=29&&job.peakMemoryMiB<=6000));
 assert.deepEqual(plan.legacyGroups.map(g=>g.id),Object.keys(BROWSER_GROUPS));
 assert.ok(plan.legacyGroups.every(g=>g.mandatory));
 assert.deepEqual(plan.legacyPilots.map(p=>p.familyId),['area','unitcover','multable']);
 assert.equal(JSON.stringify(BROWSER_GROUPS),before,'shadow planner must not mutate live Required inventory');
 assert.equal(accepted().digest,plan.digest,'plan must be deterministic');
});

test('#239 registry packs compatible independently registered work into one safe wave',()=>{
 const reg=[fakeModule('alpha',{minutes:10,locks:['learning-store'],dependsOn:['legacy:evidence-area']}),
  fakeModule('beta',{minutes:11,locks:['learning-store']}),
  fakeModule('gamma',{minutes:8,dependsOn:['alpha'],runnerType:'cpu-heavy'})];
 const p=withSynthetic(reg);
 assert.equal(p.legacyCommands,86);
 assert.equal(p.registeredNewFamilies,3);
 assert.equal(p.plannedNewJobs.length,2);
 const first=p.plannedNewJobs.find(job=>job.wave===1);
 const second=p.plannedNewJobs.find(job=>job.wave===2);
 assert.deepEqual(first.modules.map(m=>m.familyId),['beta','alpha']);
 assert.equal(first.scriptMinutes,21);
 assert.deepEqual(first.locks,['learning-store']);
 assert.deepEqual(second.modules.map(m=>m.familyId),['gamma']);
 assert.equal(second.runnerType,'cpu-heavy');
 assert.equal(p.digest,withSynthetic(reg).digest);
});

test('#239 new modules never bypass standard desktop viewport and complete proof fields',()=>{
 const good=fakeModule('delta');
 assert.equal(withSynthetic([good]).registeredNewFamilies,1);
 const badSizes=structuredClone(good);badSizes.viewport=[1280,720];
 assert.throws(()=>withSynthetic([badSizes]),/deep-equal/);
 const missingProof=structuredClone(good);missingProof.proofContracts=['math'];
 assert.throws(()=>withSynthetic([missingProof]),/proof required/);
 const missingFile=structuredClone(good);
 assert.throws(()=>planShadow(synth([missingFile]),{fileExists:path=>!path.includes('shadow-delta')}),/Missing new browser test/);
 const duplicateScript=structuredClone(good);duplicateScript.entry='tests/p9-area-adapter-browser.cjs';
 assert.throws(()=>withSynthetic([duplicateScript]),/Existing browser script/);
});

test('#239 missing, duplicate, overlapping and unregistered evidence must fail closed',()=>{
 const a=fakeModule('alpha'),b=fakeModule('beta');
 const duplicate=structuredClone(b);duplicate.artifacts=[a.artifacts[0]];
 assert.throws(()=>withSynthetic([a,duplicate]),/overlaps/);
 const colliding=structuredClone(a);colliding.artifacts=['verification/p9-area-adapter/'];
 assert.throws(()=>withSynthetic([colliding]),/overlaps/);
 assert.throws(()=>withSynthetic([a,a]),/Duplicate/);
 const wrong=structuredClone(a);wrong.dependsOn=['does-not-exist'];
 assert.throws(()=>withSynthetic([wrong]),/unknown or self dependency/);
 const cycleA=fakeModule('alpha',{dependsOn:['beta']});
 const cycleB=fakeModule('beta',{dependsOn:['alpha']});
 assert.throws(()=>withSynthetic([cycleA,cycleB]),/cycle/);
});

test('#239 capacity and exclusivity produce stable extra waves rather than unsafe parallelism',()=>{
 const a=fakeModule('alpha',{minutes:27,locks:['exclusive-store']});
 const b=fakeModule('beta',{minutes:26,locks:['exclusive-store']});
 const c=fakeModule('gamma',{minutes:28,runnerType:'cpu-heavy'});
 const plan=withSynthetic([a,b,c]);
 assert.equal(plan.registeredNewFamilies,3);
 const alphaWave=plan.plannedNewJobs.find(j=>j.modules.some(m=>m.familyId==='alpha')).wave;
 const betaWave=plan.plannedNewJobs.find(j=>j.modules.some(m=>m.familyId==='beta')).wave;
 assert.notEqual(alphaWave,betaWave,'Exclusive work cannot run at the same time on separate jobs');
 assert.ok(plan.plannedNewJobs.every(j=>j.scriptMinutes<=29&&j.peakMemoryMiB<=8192));
 const over=fakeModule('over',{minutes:29.5});
 assert.throws(()=>withSynthetic([over]),/exceeds the protected job budget/);
 const invalidMemory=fakeModule('mem');invalidMemory.resources.memoryMiB=16384;
 assert.throws(()=>withSynthetic([invalidMemory]));
});

test('#239 each former P10 half is still part of the immutable mandatory Required baseline',()=>{
 const p=accepted();
 const first=p.legacyGroups.find(x=>x.id==='p10-learning');
 const tail=p.legacyGroups.find(x=>x.id==='p10-learning-tail');
 assert.equal(first.commands.length,6);
 assert.equal(tail.commands.length,2);
 assert.deepEqual(tail.commands.map(c=>c.file),[
  'tests/p9-wideshift-adapter-browser.cjs','tests/p9-pvbench-adapter-browser.cjs']);
 assert.ok(first.artifacts.includes('verification/p10-release-upgrade/backup-safety/'));
 assert.ok(tail.artifacts.includes('verification/p9-pvbench-adapter/'));
 assert.deepEqual([p.limits.jobTimeoutMinutes,p.limits.maxParallel],[35,10]);
 const missing={...BROWSER_GROUPS};delete missing['p10-learning-tail'];
 assert.throws(()=>planShadow(source(),{groups:missing}),/deep-equal/);
});

test('#239 pilot family mappings cannot silently create duplicate browser invocations',()=>{
 const reg=source();
 reg.legacyPilots[0].entry='tests/p9-other-browser.cjs';
 assert.throws(()=>planShadow(reg),/pilot would double-register/);
 const changed=source();
 changed.mode='active';
 assert.throws(()=>planShadow(changed),/cannot activate/);
});
