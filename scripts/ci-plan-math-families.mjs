// Issue #239 phase two: deterministic SHADOW ONLY browser-family scheduling.
// The live Required matrix, receipt gate, and all legacy browser scripts remain untouched.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BROWSER_GROUPS,GROUP_NAMES} from './required-browser-checks.mjs';
import {validateFrozenInventory} from './ci-audit-viewports.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const main='b23bff217fa0baf5967b42e8553e01951d70d7c3';
const idPattern=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const safeEntry=/^tests\/[a-zA-Z0-9][a-zA-Z0-9/_-]*-browser\.cjs$/;
const safeArtifact=/^verification\/[a-zA-Z0-9][a-zA-Z0-9/_-]*\/$/;
const numeric=(x)=>typeof x==='number'&&Number.isFinite(x);
const sha256=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const overlap=(a,b)=>a.startsWith(b)||b.startsWith(a);
const equal=(a,b)=>assert.deepEqual(a,b);

export function planShadow(registry,{groups=BROWSER_GROUPS,fileExists=p=>existsSync(resolve(root,p)),verifyFrozen=false}={}){
 assert.equal(registry.schema,'math-ci-family-registry/1');
 assert.equal(registry.mode,'shadow-only','The registry cannot activate the Required matrix');
 assert.equal(registry.baseline.acceptedMainSha,main);
 if(verifyFrozen)validateFrozenInventory();
 const limits=registry.limits;
 equal([limits.jobTimeoutMinutes,limits.maxParallel,limits.planningStartupReserveMinutes,
  limits.maxNewScriptsMinutesPerJob,limits.maxNewMemoryMiB],[35,10,6,29,8192]);
 equal(limits.runnerTypes,['standard','cpu-heavy']);
 equal(registry.futureBrowserViewport,{width:1920,height:1080,
  unit:'Chromium content pixels',legacyExempt:true});
 const groupNames=Object.keys(groups);
 equal(groupNames,GROUP_NAMES);
 equal(registry.baseline.observedGroupScriptMinutes.map(x=>x.id),groupNames);
 const legacyFiles=[],legacyEvidence=[],legacyJobs=[];
 for(let i=0;i<groupNames.length;i++){
  const group=groupNames[i],definition=groups[group],profile=registry.baseline.observedGroupScriptMinutes[i];
  assert.ok(numeric(profile.minutes)&&profile.minutes>0&&profile.minutes<35,
   group+' measured script minutes invalid');
  assert.ok(definition.commands.length&&definition.artifacts.length,group+' has no evidence or commands');
  for(const command of definition.commands){
   assert.ok(fileExists(command.file),group+': missing legacy source '+command.file);
   legacyFiles.push(command.file);
  }
  for(const dir of definition.artifacts){
   assert.match(dir,safeArtifact);
   legacyEvidence.push(dir);
  }
  legacyJobs.push({id:group,mandatory:true,commands:definition.commands.map(c=>({file:c.file,env:c.env})),
   artifacts:[...definition.artifacts],observedSingleRunScriptMinutes:profile.minutes,
   profileSource:'main Required 44287490501; not a P90/P95 or end-to-end duration'});
 }
 assert.equal(groupNames.length,registry.baseline.expectedGroups);
 assert.equal(legacyFiles.length,registry.baseline.expectedCommands);
 assert.equal(new Set(legacyFiles).size,registry.baseline.expectedScripts);
 assert.equal(legacyEvidence.length,registry.baseline.expectedEvidenceDirs);
 assert.equal(new Set(legacyEvidence).size,legacyEvidence.length);
 assert.equal(registry.baseline.acceptedRequiredRunId,'44287490501');
 assert.equal(registry.legacyPilots.length,3);
 equal(registry.legacyPilots.map(x=>x.familyId),['area','unitcover','multable']);
 for(const pilot of registry.legacyPilots){
  assert.match(pilot.familyId,idPattern);
  assert.ok(groups[pilot.existingGroup],pilot.familyId+': missing legacy pilot group');
  assert.ok(groups[pilot.existingGroup].commands.some(c=>c.file===pilot.entry),
   pilot.familyId+': pilot would double-register or lose the legacy browser command');
 }
 const extra=registry.newFamilies;
 assert.ok(Array.isArray(extra),'newFamilies must be an explicit list');
 const modules=new Map(),newArtifacts=[];
 for(const item of extra){
  assert.ok(item&&typeof item==='object'&&!Array.isArray(item));
  assert.match(item.familyId,idPattern);
  assert.ok(!modules.has(item.familyId)&&!registry.legacyPilots.some(p=>p.familyId===item.familyId),
   'Duplicate new/legacy family ID: '+item.familyId);
  assert.equal(item.version,1);
  assert.equal(item.required,true,'New modules must not be optional under the Required gate');
  assert.match(item.entry,safeEntry);
  assert.ok(!legacyFiles.includes(item.entry),'Existing browser script must not be re-registered');
  assert.ok(![...modules.values()].some(m=>m.entry===item.entry),'Browser entrypoint registered twice');
  assert.ok(fileExists(item.entry),'Missing new browser test: '+item.entry);
  equal(item.viewport,[1920,1080]);
  assert.ok(Array.isArray(item.artifacts)&&item.artifacts.length>0,'New module has no original evidence');
  for(const dir of item.artifacts){
   assert.match(dir,safeArtifact);
   assert.ok(![...legacyEvidence,...newArtifacts].some(existing=>overlap(existing,dir)),
    'Evidence directory overlaps another owner: '+dir);
   newArtifacts.push(dir);
  }
  assert.ok(Array.isArray(item.proofContracts)&&item.proofContracts.includes('math')&&
   item.proofContracts.includes('correction')&&item.proofContracts.includes('persistence'),
   item.familyId+': mathematical, correction and persistence proof required');
  assert.ok(new Set(item.proofContracts).size===item.proofContracts.length);
  const r=item.resources;
  assert.ok(r&&numeric(r.estimatedScriptMinutes)&&r.estimatedScriptMinutes>0&&
   r.estimatedScriptMinutes<=limits.maxNewScriptsMinutesPerJob,
   item.familyId+': script estimate exceeds the protected job budget');
  assert.ok(Number.isInteger(r.memoryMiB)&&r.memoryMiB>0&&r.memoryMiB<=limits.maxNewMemoryMiB);
  assert.ok(limits.runnerTypes.includes(r.runnerType));
  assert.ok(Array.isArray(r.exclusiveLocks)&&r.exclusiveLocks.every(x=>idPattern.test(x)));
  assert.ok(new Set(r.exclusiveLocks).size===r.exclusiveLocks.length);
  assert.ok(Array.isArray(item.dependsOn)&&new Set(item.dependsOn).size===item.dependsOn.length);
  modules.set(item.familyId,{...item});
 }
 for(const module of modules.values()){
  for(const dep of module.dependsOn){
   if(dep.startsWith('legacy:'))assert.ok(groups[dep.slice(7)],module.familyId+': unknown legacy dependency');
   else assert.ok(modules.has(dep)&&dep!==module.familyId,module.familyId+': unknown or self dependency '+dep);
  }
 }
 // Topological dependencies first. A wave never contains its own prerequisites.
 const pending=new Map(modules),assigned=new Map(),jobs=[];
 while(pending.size){
  const ready=[...pending.values()].filter(m=>m.dependsOn.every(x=>x.startsWith('legacy:')||assigned.has(x)))
   .sort((a,b)=>b.resources.estimatedScriptMinutes-a.resources.estimatedScriptMinutes||
    a.familyId.localeCompare(b.familyId,'en'));
  assert.ok(ready.length,'New module dependencies contain a cycle');
  for(const mod of ready){
   const r=mod.resources;
   const earliest=Math.max(1,...mod.dependsOn.filter(x=>!x.startsWith('legacy:'))
    .map(x=>assigned.get(x)+1));
   let chosen;
   for(let wave=earliest;wave<=extra.length+1&&!chosen;wave++){
    const active=jobs.filter(j=>j.wave===wave);
    // Shared locks can be serialized in one compatible job, but never used by
    // two concurrently planned jobs in the same wave.
    const pack=active.find(j=>j.runnerType===r.runnerType&&
      j.scriptMinutes+r.estimatedScriptMinutes<=limits.maxNewScriptsMinutesPerJob&&
      !active.some(other=>other!==j&&other.locks.some(lock=>r.exclusiveLocks.includes(lock))));
    if(pack){chosen=pack;break}
    if(active.length>=limits.maxParallel||active.some(j=>j.locks.some(lock=>r.exclusiveLocks.includes(lock))))
      continue;
    chosen={id:'shadow-wave-'+wave+'-job-'+String(active.length+1).padStart(2,'0'),wave,
      runnerType:r.runnerType,scriptMinutes:0,peakMemoryMiB:0,locks:[],modules:[]};
    jobs.push(chosen);
   }
   assert.ok(chosen,mod.familyId+': unable to place within runner limits');
   chosen.scriptMinutes=Number((chosen.scriptMinutes+r.estimatedScriptMinutes).toFixed(3));
   chosen.peakMemoryMiB=Math.max(chosen.peakMemoryMiB,r.memoryMiB);
   chosen.locks=[...new Set([...chosen.locks,...r.exclusiveLocks])].sort();
   chosen.modules.push({familyId:mod.familyId,entry:mod.entry,dependsOn:mod.dependsOn,
     artifacts:mod.artifacts,proofContracts:mod.proofContracts});
   assigned.set(mod.familyId,chosen.wave);
   pending.delete(mod.familyId);
  }
 }
 jobs.sort((a,b)=>a.wave-b.wave||a.id.localeCompare(b.id,'en'));
 const plan={schema:'math-ci-shadow-plan/1',mode:'shadow-only',sourceMainSha:main,
  activeWorkflow:'unchanged: .github/workflows/pull-request-baseline.yml',
  liveRequiredGate:'unchanged: scripts/required-browser-checks.mjs',
  limits,legacyGroups:legacyJobs,legacyCommands:legacyFiles.length,
  legacyDistinctScripts:new Set(legacyFiles).size,legacyEvidenceDirs:legacyEvidence.length,
  legacyPilots:registry.legacyPilots,registeredNewFamilies:extra.length,
  plannedNewJobs:jobs,
  limitations:['No job is started or skipped by this plan','No new module enters the live Required matrix',
   'Observed durations are one-run script times, not measured wall-clock or P90/P95',
   'The current 13 legacy groups and all 86 commands remain mandatory under the real gate']};
 plan.digest=sha256(plan);
 return plan;
}

export function mainShadow(argv=process.argv.slice(2)){
 assert.ok(argv.length===0||(argv.length===2&&argv[0]==='--output'),
  'Only --output <verification/ci-shadow-plan/filename.json> is accepted');
 const registry=JSON.parse(readFileSync(resolve(root,'ci/math-families.json'),'utf8'));
 const plan=planShadow(registry,{verifyFrozen:true});
 if(argv.length){
  const dest=argv[1];
  assert.ok(/^verification\/ci-shadow-plan\/[a-zA-Z0-9-]+\.json$/.test(dest),
   'Shadow output must stay in verification/ci-shadow-plan/');
  const full=resolve(root,dest);
  assert.equal(relative(root,full),dest);
  mkdirSync(dirname(full),{recursive:true});
  writeFileSync(full,JSON.stringify(plan,null,2)+'\n');
 }
 process.stdout.write(JSON.stringify({status:'shadow-only',legacyGroups:plan.legacyGroups.length,
  legacyCommands:plan.legacyCommands,newModules:plan.registeredNewFamilies,
  proposedJobs:plan.plannedNewJobs.length,digest:plan.digest})+'\n');
 return plan;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))mainShadow();
