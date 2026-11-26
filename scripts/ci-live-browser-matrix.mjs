// #315: full-only registry-driven browser matrix for independent new families.
// GitHub Actions queues matrix jobs beyond ten concurrent runners; the per-job
// 29-minute script budget and 35-minute timeout remain unchanged. Dependencies
// and exclusive resource locks are not supported by parallel matrix execution.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {appendFileSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BROWSER_GROUPS,GROUP_NAMES} from './required-browser-checks.mjs';
import {planShadow} from './ci-plan-math-families.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const same=(a,b)=>assert.deepEqual(a,b);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const defaultConfig=()=>JSON.parse(readFileSync(resolve(root,'ci/live-browser-matrix.json'),'utf8'));
const defaultRegistry=()=>JSON.parse(readFileSync(resolve(root,'ci/math-families.json'),'utf8'));

// Explicit capacity-only partition of the immutable logical legacy inventory.
// The completed first five commands in run 45625745253 left insufficient time
// for Unit Cover (job 139248173616 cancelled near its 35-minute ceiling).
// Keep the first three commands together, and move the last three, with
// their exact artifact ownership, to one additional mandatory runner.
const expansionGroup='evidence-expansion-2';
const expansionTail='evidence-expansion-2-tail';
const expansionEntries=['groups','transform','angle','scalechain','fracshare','unitcover'];
function partitionExpansionCapacity(definitions){
 const original=BROWSER_GROUPS[expansionGroup];
 same(original.commands,expansionEntries.map(name=>({file:'tests/p9-'+name+'-adapter-browser.cjs',env:{}})));
 same(original.artifacts,expansionEntries.map(name=>'verification/p9-'+name+'-adapter/'));
 assert.ok(!Object.hasOwn(definitions,expansionTail),'Capacity runner identity collision');
 const part=(start,end)=>Object.freeze({
  commands:Object.freeze(original.commands.slice(start,end)),
  artifacts:Object.freeze(original.artifacts.slice(start,end))
 });
 definitions[expansionGroup]=part(0,3);
 definitions[expansionTail]=part(3,6);
 const runners=[expansionGroup,expansionTail];
 same(runners.flatMap(id=>definitions[id].commands),original.commands);
 same(runners.flatMap(id=>definitions[id].artifacts),original.artifacts);
 const legacy=Object.values(definitions);
 const old=Object.values(BROWSER_GROUPS);
 same(legacy.flatMap(g=>g.commands.map(c=>JSON.stringify(c))).sort(),
  old.flatMap(g=>g.commands.map(c=>JSON.stringify(c))).sort());
 same(legacy.flatMap(g=>g.artifacts).sort(),old.flatMap(g=>g.artifacts).sort());
 return {sourceGroup:expansionGroup,runners,commandCounts:[3,3],
  observedRunId:'45625745253',cancelledJobId:'139248173616',
  timeoutMinutes:35,maxParallel:10};
}

// Third full run 45759922537: FDP board and fraction case completed in
// ~6m47s and ~22m44s; cube fraction was cancelled near the 35-minute cap.
// The separate successful cube run took ~9m21s. Do not rely on a faster
// runner or change a test: preserve each original call and evidence root
// on its own mandatory runner. The source artifact ordering is historical.
const fractionGroup='evidence-fractioncase';
const fractionCaseTail='evidence-fractioncase-case';
const fractionCubeTail='evidence-fractioncase-cube';
const fractionEntries=['fdpboard','fractioncase','cubefraction'];
function partitionFractionCapacity(definitions){
 const original=BROWSER_GROUPS[fractionGroup];
 const commands=fractionEntries.map(name=>({file:'tests/p9-'+name+'-adapter-browser.cjs',env:{}}));
 const artifacts=fractionEntries.map(name=>'verification/p9-'+name+'-adapter/');
 same(original.commands,commands);
 same(original.artifacts,[artifacts[1],artifacts[0],artifacts[2]]);
 const runners=[fractionGroup,fractionCaseTail,fractionCubeTail];
 for(const id of runners.slice(1))assert.ok(!Object.hasOwn(definitions,id),'Capacity runner identity collision');
 for(const [index,id] of runners.entries()){
  const artifact=original.artifacts.find(dir=>dir===artifacts[index]);
  assert.ok(artifact,'Original artifact owner must exist');
  definitions[id]=Object.freeze({commands:Object.freeze([original.commands[index]]),
   artifacts:Object.freeze([artifact])});
 }
 same(runners.flatMap(id=>definitions[id].commands),original.commands);
 same(runners.flatMap(id=>definitions[id].artifacts).sort(),[...original.artifacts].sort());
 const legacy=Object.values(definitions),old=Object.values(BROWSER_GROUPS);
 same(legacy.flatMap(g=>g.commands.map(c=>JSON.stringify(c))).sort(),
  old.flatMap(g=>g.commands.map(c=>JSON.stringify(c))).sort());
 same(legacy.flatMap(g=>g.artifacts).sort(),old.flatMap(g=>g.artifacts).sort());
 return {sourceGroup:fractionGroup,runners,commandCounts:[1,1,1],
  observedRunId:'45759922537',cancelledJobId:'139708961494',
  timeoutMinutes:35,maxParallel:10};
}

export function buildLiveBrowserMatrix(registry=defaultRegistry(),{
 config=defaultConfig(),fileExists,verifyFrozen=false
}={}){
 assert.equal(config.schema,'math-ci-live-browser-matrix/1');
 assert.equal(config.activation,'enabled','Unreviewed dynamic matrix state');
 assert.equal(config.dependencyMode,'reject-cross-group');
 assert.equal(config.rollbackMainSha,'6718586b02b59228ff53acab1567e02da7b32268');
 const plan=planShadow(registry,{...(fileExists?{fileExists}:{}),verifyFrozen});
 assert.equal(plan.mode,'shadow-only','Only the reviewed planner output may be promoted');
 assert.equal(plan.legacyGroups.length,13);
 assert.equal(plan.legacyCommands,86);
 assert.equal(plan.legacyDistinctScripts,85);
 assert.equal(plan.legacyEvidenceDirs,83);
 same(plan.legacyGroups.map(group=>group.id),GROUP_NAMES);
 for(const module of registry.newFamilies){
  assert.equal(module.dependsOn.length,0,
   module.familyId+': cross-job dependencies are not implemented in live matrix; fail closed');
  assert.equal(module.resources.exclusiveLocks.length,0,
   module.familyId+': exclusive locks require an ordered executor; fail closed');
 }
 const definitions={...BROWSER_GROUPS};
 const capacitySplit=partitionExpansionCapacity(definitions);
 const fractionCapacitySplit=partitionFractionCapacity(definitions);
 const legacyRunnerNames=[...GROUP_NAMES,expansionTail,fractionCaseTail,fractionCubeTail];
 same(Object.keys(definitions),legacyRunnerNames);
 const added=[];
 for(const job of plan.plannedNewJobs){
  assert.ok(Number.isSafeInteger(job.wave)&&job.wave>=1,
   'Full matrix requires a deterministic positive scheduling batch');
  assert.equal(job.runnerType,'standard','CPU-heavy runner type is not provisioned');
  assert.ok(job.scriptMinutes<=29&&job.peakMemoryMiB<=6000,
   'New runner exceeds actual standard-runner capacity');
  assert.ok(job.modules.length>0);
  const id=job.id.replace(/^shadow-/,'family-');
  assert.match(id,/^family-wave-[1-9][0-9]*-job-[0-9]+$/);
  assert.ok(!Object.hasOwn(definitions,id),'Duplicate live job id '+id);
  const commands=job.modules.map(m=>({file:m.entry,env:{}}));
  const artifacts=job.modules.flatMap(m=>m.artifacts);
  assert.ok(commands.length>0&&artifacts.length>0);
  definitions[id]={commands,artifacts,newFamily:true,modules:job.modules.map(m=>({
   familyId:m.familyId,entry:m.entry,artifacts:[...m.artifacts],proofContracts:[...m.proofContracts]
  }))};
  added.push({id,wave:job.wave,commandCount:commands.length,artifacts,
   scriptMinutes:job.scriptMinutes,peakMemoryMiB:job.peakMemoryMiB});
 }
 const groups=Object.keys(definitions);
 same(groups.slice(0,GROUP_NAMES.length),GROUP_NAMES);
 assert.equal(new Set(groups).size,groups.length);
 same(groups.slice(0,legacyRunnerNames.length),legacyRunnerNames);
 assert.equal(groups.length,legacyRunnerNames.length+added.length);
 const fullCommands=Object.values(definitions).flatMap(group=>group.commands);
 assert.equal(fullCommands.length,86+registry.newFamilies.length);
 const matrix={group:groups};
 const proof={schema:'math-ci-live-browser-matrix-proof/1',activation:'enabled',
  checkoutPolicy:'same-SHA static plan and runner/gate',
  sourcePlanDigest:plan.digest,liveMatrix:matrix,
  legacyGroups:13,legacyRunnerGroups:legacyRunnerNames.length,legacyCalls:86,legacyEvidenceDirs:83,
  legacyCapacitySplit:capacitySplit,legacyFractionCapacitySplit:fractionCapacitySplit,
  registeredNewFamilies:registry.newFamilies.length,addedGroups:added,
  restrictions:['GitHub max-parallel 10 queues overflow jobs without a workflow time cap',
  'No cross-group dependencies or resource locks','No CPU-heavy unprovisioned runners',
   'Every new module must supply mathematical result, errors=[], original PNG and provenance',
   'Static legacy group source remains the complete rollback baseline',
  'The exact expansion-2 tail requires its own successful full-run receipt',
  'All three exact fraction capacity runners require independent successful full-run receipts']};
 proof.digest=digest(proof);
 return {definitions,matrix,proof};
}

export function cli(operation=process.argv[2]){
 assert.ok(['output','inspect'].includes(operation),'Expected output or inspect');
 const {matrix,proof}=buildLiveBrowserMatrix(defaultRegistry(),{verifyFrozen:true});
 if(operation==='output'){
  assert.ok(process.env.GITHUB_OUTPUT,'Missing GitHub Actions output file');
  appendFileSync(process.env.GITHUB_OUTPUT,'browser_matrix='+JSON.stringify(matrix)+'\n');
  const dst=resolve(root,'verification/ci-shadow-plan/live-browser-matrix.json');
  mkdirSync(dirname(dst),{recursive:true});
  writeFileSync(dst,JSON.stringify(proof,null,2)+'\n');
 }
 console.log('LIVE_BROWSER_MATRIX '+JSON.stringify({groups:matrix.group.length,
  oldCalls:86,newFamilies:proof.registeredNewFamilies,digest:proof.digest,
  enabled:true,dependencyMode:'reject-cross-group'}));
 return proof;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{cli();}catch(e){console.error(e.stack);process.exitCode=1;}
}
