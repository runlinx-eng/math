// #239 stage 4: LIVE registry-driven browser matrix for independent new families.
// Old 13 groups / 86 invocations remain mandatory and unchanged. Unsupported
// cross-group dependencies reject CI rather than running in the wrong order.
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
   module.familyId+': cross-job dependencies are not implemented in live matrix v1; fail closed');
 }
 const definitions={...BROWSER_GROUPS};
 const added=[];
 for(const job of plan.plannedNewJobs){
  assert.equal(job.wave,1,'Cannot run dependency/resource wave '+job.wave+
   ' in a single parallel GitHub Actions matrix');
  assert.equal(job.runnerType,'standard','CPU-heavy runner type is not provisioned');
  assert.ok(job.scriptMinutes<=29&&job.peakMemoryMiB<=6000,
   'New runner exceeds actual standard-runner capacity');
  assert.ok(job.modules.length>0);
  const id=job.id.replace(/^shadow-/,'family-');
  assert.match(id,/^family-wave-1-job-[0-9]+$/);
  assert.ok(!Object.hasOwn(definitions,id),'Duplicate live job id '+id);
  const commands=job.modules.map(m=>({file:m.entry,env:{}}));
  const artifacts=job.modules.flatMap(m=>m.artifacts);
  assert.ok(commands.length>0&&artifacts.length>0);
  definitions[id]={commands,artifacts,newFamily:true,modules:job.modules.map(m=>({
   familyId:m.familyId,entry:m.entry,artifacts:[...m.artifacts],proofContracts:[...m.proofContracts]
  }))};
  added.push({id,commandCount:commands.length,artifacts,
   scriptMinutes:job.scriptMinutes,peakMemoryMiB:job.peakMemoryMiB});
 }
 const groups=Object.keys(definitions);
 same(groups.slice(0,GROUP_NAMES.length),GROUP_NAMES);
 assert.equal(new Set(groups).size,groups.length);
 assert.equal(groups.length,13+added.length);
 const fullCommands=Object.values(definitions).flatMap(group=>group.commands);
 assert.equal(fullCommands.length,86+registry.newFamilies.length);
 const matrix={group:groups};
 const proof={schema:'math-ci-live-browser-matrix-proof/1',activation:'enabled',
  checkoutPolicy:'same-SHA static plan and runner/gate',
  sourcePlanDigest:plan.digest,liveMatrix:matrix,
  legacyGroups:13,legacyCalls:86,legacyEvidenceDirs:83,
  registeredNewFamilies:registry.newFamilies.length,addedGroups:added,
  restrictions:['No cross-group dependencies in v1','No CPU-heavy unprovisioned runners',
   'Every new module must supply mathematical result, errors=[], original PNG and provenance',
   'Static legacy group source remains the complete rollback baseline']};
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
