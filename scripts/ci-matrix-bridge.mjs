// #239: read-only promotion bridge. NEVER used to launch CI or accept live Required.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {planShadow} from './ci-plan-math-families.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const freeze=value=>Object.freeze(value);
const eq=(a,b)=>assert.deepEqual(a,b);
const digest=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const id=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export function buildMatrixBridgePreview(plan,workflow){
 assert.equal(plan.schema,'math-ci-shadow-plan/1');
 assert.equal(plan.mode,'shadow-only');
 assert.equal(plan.legacyGroups.length,13);
 assert.equal(plan.legacyCommands,86);
 assert.equal(plan.legacyDistinctScripts,85);
 assert.equal(plan.legacyEvidenceDirs,83);
 assert.ok(plan.legacyGroups.every(g=>g.mandatory===true));
 assert.ok(typeof workflow==='string');
 // Scope each constraint to its REAL GitHub Actions job. A 35-minute
 // static job must not accidentally mask a 60-minute browser runner.
 const browserStart=workflow.indexOf('\n  browser:\n');
 const gateStart=workflow.indexOf('\n  required-checks:\n',browserStart+1);
 assert.ok(browserStart>=0&&gateStart>browserStart,
  'Missing live browser job or final Required gate');
 const browserBlock=workflow.slice(browserStart,gateStart);
 const gateBlock=workflow.slice(gateStart);
 // Dynamic matrix is now genuinely consumed by GitHub Actions. The old
 // reviewed group roster remains immutable inside required-browser-checks.
 const matches=[...browserBlock.matchAll(/^[ \t]*group:[ \t]*\[([^\]\n]+)\]/gm)];
 assert.equal(matches.length,0,'Static group list must not override registry-driven GitHub matrix');
 assert.match(browserBlock,/matrix:\s*\$\{\{\s*fromJSON\(needs\.static-checks\.outputs\.browser_matrix\)\s*\}\}/);
 assert.match(workflow,/browser_matrix:\s*\$\{\{\s*steps\.live_browser_matrix\.outputs\.browser_matrix\s*\}\}/);
 assert.match(workflow,/node scripts\/ci-live-browser-matrix\.mjs output/);
 const live=plan.legacyGroups.map(g=>g.id);
 assert.match(browserBlock,/needs:\s*static-checks\b/);
 assert.match(browserBlock,/fail-fast:\s*false\b/);
 assert.match(browserBlock,/max-parallel:\s*10\b/);
 assert.match(browserBlock,/timeout-minutes:\s*35\b/);
 assert.match(gateBlock,/needs:\s*\[static-checks,\s*browser,\s*smoke-checks,\s*targeted\]/);
 assert.match(gateBlock,/if:\s*\$\{\{\s*always\(\)\s*\}\}/);
 assert.match(gateBlock,/pattern:\s*required-browser-result-\*/);
 assert.match(gateBlock,/node scripts\/required-browser-checks\.mjs gate/);
 const jobs=plan.legacyGroups.map(g=>({
  id:g.id,kind:'mandatory-legacy',wave:0,required:true,
  commands:g.commands.map(c=>({file:c.file,env:{...c.env}})),
  artifacts:[...g.artifacts]
 }));
 const future=plan.plannedNewJobs.map(job=>({
  id:job.id,kind:'unactivated-shadow',wave:job.wave,required:true,
  runnerType:job.runnerType,resources:{scriptMinutes:job.scriptMinutes,
   peakMemoryMiB:job.peakMemoryMiB,locks:[...job.locks]},
  commands:job.modules.map(m=>({file:m.entry,env:{}})),
  artifacts:job.modules.flatMap(m=>m.artifacts),
  dependencyModules:job.modules.map(m=>({familyId:m.familyId,dependsOn:m.dependsOn}))
 }));
 const ids=[...jobs,...future].map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length,'Duplicate proposed group ID');
 assert.ok(ids.every(x=>id.test(x)),'Invalid proposed group ID');
 const roots=[...jobs,...future].flatMap(x=>x.artifacts);
 assert.equal(new Set(roots).size,roots.length,'Overlapping evidence ownership in bridge proposal');
 assert.ok(jobs.some(x=>x.id==='p10-learning'&&x.commands.length===6));
 assert.ok(jobs.some(x=>x.id==='p10-learning-tail'&&x.commands.length===2));
 const proposal={
  schema:'math-ci-matrix-bridge-preview/1',mode:'shadow-only',
  activationAllowed:false,liveWorkflowUnchanged:false,
  sourcePlanDigest:plan.digest,sourceMainSha:plan.sourceMainSha,
  comparison:{liveMatrix:live,legacyGroups:13,legacyCalls:86,
   legacyEvidenceDirs:83,addedLiveJobs:plan.plannedNewJobs.length},
  requiredLegacyJobs:jobs,unactivatedFutureJobs:future,
  expectedFullRequiredReceipts:[...jobs,...future].map(x=>x.id),
  guarantees:[
   'This is not a GitHub Actions matrix output',
   'Actual Required gate validates the old 13 groups plus registry-owned new groups',
   'Bridge is read-only; the separate live-matrix producer may schedule supported independent new families',
   'Any production promotion must implement receipt+artifact+identity gate and rollback separately'
  ]
 };
 proposal.digest=digest(proposal);
 return freeze(proposal);
}

// Strict simulated future-gate contract for review: this function is NOT
// installed in the current production gate and never reads live Actions ZIPs.
export function validateMockPromotion({proposal,context,needs,receipts,evidence}){
 assert.equal(proposal.schema,'math-ci-matrix-bridge-preview/1');
 assert.equal(proposal.mode,'shadow-only');
 assert.equal(proposal.activationAllowed,false);
 assert.ok(context&&/^[a-f0-9]{40}$/.test(context.sha));
 assert.ok(/^[1-9][0-9]*$/.test(context.runId));
 assert.ok(Number.isSafeInteger(context.attempt)&&context.attempt>=1);
 assert.equal(context.event,'workflow_dispatch','Simulated promotion contract requires manual full regression');
 eq(Object.keys(needs||{}).sort(),['browser','smoke-checks','static-checks']);
 for(const key of ['browser','smoke-checks','static-checks'])
  assert.equal(needs[key]?.result,'success',key+' must have success (not skipped/cancelled)');
 assert.ok(Array.isArray(receipts)&&Array.isArray(evidence));
 const required=[...proposal.requiredLegacyJobs,...proposal.unactivatedFutureJobs];
 assert.equal(receipts.length,required.length,'Missing or extra required group receipts');
 assert.equal(evidence.length,required.length,'Missing or extra original evidence owner');
 const recMap=new Map(),evMap=new Map();
 for(const r of receipts){
  assert.ok(r&&typeof r.group==='string');
  assert.ok(!recMap.has(r.group),'Duplicate group receipt: '+r.group);
  recMap.set(r.group,r);
 }
 for(const e of evidence){
  assert.ok(e&&typeof e.group==='string');
  assert.ok(!evMap.has(e.group),'Duplicate artifact owner: '+e.group);
  evMap.set(e.group,e);
 }
 eq([...recMap.keys()].sort(),required.map(g=>g.id).sort());
 eq([...evMap.keys()].sort(),required.map(g=>g.id).sort());
 let commands=0;
 for(const group of required){
  const r=recMap.get(group.id),e=evMap.get(group.id);
  assert.equal(r.schema,'math-required-browser-group/1');
  assert.equal(r.group,group.id);
  for(const key of ['sha','runId','event','attempt'])assert.equal(r[key],context[key],group.id+' wrong '+key);
  assert.equal(r.required,true);
  assert.equal(r.status,'success',group.id+' incomplete or skipped');
  assert.ok(Array.isArray(r.commands));
  assert.equal(r.commands.length,group.commands.length,group.id+' missing command results');
  for(let i=0;i<group.commands.length;i++){
   const actual=r.commands[i],expected=group.commands[i];
   assert.equal(actual.file,expected.file);
   eq(actual.env,expected.env);
   assert.equal(actual.outcome,'success');
   assert.equal(actual.exitCode,0);
   assert.equal(actual.signal,null);
   assert.equal(actual.error,null);
   assert.ok(Number.isFinite(actual.elapsedMs)&&actual.elapsedMs>=0);
   commands++;
  }
  assert.equal(e.group,group.id);
  assert.equal(e.sha,context.sha);
  assert.equal(e.runId,context.runId);
  assert.equal(e.attempt,context.attempt);
  assert.equal(e.status,'verified-original-zip','No acceptance based only on a green job');
  eq(e.paths,group.artifacts);
 }
 assert.ok(commands>=86,'The old 86 calls cannot be dropped');
 return {status:'simulated-only',complete:true,groups:required.length,commands};
}

export function generateBridge(argv=process.argv.slice(2)){
 assert.ok(argv.length===0||(argv.length===2&&argv[0]==='--output'),
  'Only --output verification/ci-shadow-plan/matrix-bridge-preview.json is allowed');
 const registry=JSON.parse(readFileSync(resolve(root,'ci/math-families.json'),'utf8'));
 const plan=planShadow(registry,{verifyFrozen:true});
 const workflow=readFileSync(resolve(root,'.github/workflows/pull-request-baseline.yml'),'utf8');
 const preview=buildMatrixBridgePreview(plan,workflow);
 if(argv.length){
  assert.equal(argv[1],'verification/ci-shadow-plan/matrix-bridge-preview.json');
  const dest=resolve(root,argv[1]);
  assert.equal(relative(root,dest),argv[1]);
  mkdirSync(dirname(dest),{recursive:true});
  writeFileSync(dest,JSON.stringify(preview,null,2)+'\n');
 }
 process.stdout.write(JSON.stringify({status:'shadow-only',legacyGroups:13,
  legacyCalls:86,unactivatedJobs:preview.unactivatedFutureJobs.length,
  activationAllowed:false,digest:preview.digest})+'\n');
 return preview;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))generateBridge();
