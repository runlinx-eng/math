import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildMatrixBridgePreview,validateMockPromotion}
 from '../scripts/ci-matrix-bridge.mjs';
import {planShadow} from '../scripts/ci-plan-math-families.mjs';

const reg=()=>JSON.parse(readFileSync(new URL('../ci/math-families.json',import.meta.url),'utf8'));
const wf=()=>readFileSync(new URL('../.github/workflows/pull-request-baseline.yml',import.meta.url),'utf8');
const make=()=>buildMatrixBridgePreview(planShadow(reg()),wf());
const context=()=>({sha:'aedf658d1663e2e4db1951a3e4c41cc1a7c55a60',
 event:'push',runId:'44303255167',attempt:1});
const allGroups=preview=>[...preview.requiredLegacyJobs,...preview.unactivatedFutureJobs];
function fixture(preview=make()){
 const ctx=context();
 const receipts=allGroups(preview).map(g=>({
  schema:'math-required-browser-group/1',group:g.id,...ctx,required:true,status:'success',
  commands:g.commands.map(c=>({...c,outcome:'success',exitCode:0,signal:null,error:null,elapsedMs:100}))
 }));
 const evidence=allGroups(preview).map(g=>({
  group:g.id,sha:ctx.sha,runId:ctx.runId,attempt:ctx.attempt,
  status:'verified-original-zip',paths:[...g.artifacts]
 }));
 const needs={'static-checks':{result:'success'},browser:{result:'success'}};
 return {proposal:preview,context:ctx,needs,receipts,evidence};
}
const future=id=>({
 familyId:id,version:1,required:true,entry:'tests/p9-'+id+'-browser.cjs',
 viewport:[1920,1080],artifacts:['verification/p9-'+id+'/'],
 proofContracts:['math','correction','persistence','negative','backup'],
 resources:{estimatedScriptMinutes:8,memoryMiB:2048,runnerType:'standard',exclusiveLocks:[]},
 dependsOn:[]
});

test('#239 bridge preview ensures the live matrix is generated from the preserved 13-group baseline',()=>{
 const p=make();
 assert.equal(p.schema,'math-ci-matrix-bridge-preview/1');
 assert.equal(p.mode,'shadow-only');
 assert.equal(p.activationAllowed,false);
 assert.equal(p.liveWorkflowUnchanged,false);
 assert.equal(p.requiredLegacyJobs.length,13);
 assert.equal(p.requiredLegacyJobs.reduce((n,g)=>n+g.commands.length,0),86);
 assert.equal(p.requiredLegacyJobs.flatMap(g=>g.artifacts).length,83);
 assert.deepEqual(p.comparison.liveMatrix,p.requiredLegacyJobs.map(g=>g.id));
 assert.equal(p.unactivatedFutureJobs.length,1);
 assert.equal(p.unactivatedFutureJobs[0].commands[0].file,
  'tests/p9-sequence-invariance-browser.cjs');
 assert.equal(p.expectedFullRequiredReceipts.length,14);
 assert.equal(p.digest,make().digest,'Stable input yields stable digest');
});

test('#239 simulated promotion needs all original receipts and actual evidence ownership',()=>{
 const x=fixture();
 assert.deepEqual(validateMockPromotion(x),{
  status:'simulated-only',complete:true,groups:14,commands:87});
 const missing=fixture();missing.receipts.pop();
 assert.throws(()=>validateMockPromotion(missing),/Missing or extra/);
 const missingZIP=fixture();missingZIP.evidence.pop();
 assert.throws(()=>validateMockPromotion(missingZIP),/Missing or extra/);
 const skipped=fixture();skipped.needs.browser.result='skipped';
 assert.throws(()=>validateMockPromotion(skipped),/must have success/);
 const cancelled=fixture();cancelled.needs.browser.result='cancelled';
 assert.throws(()=>validateMockPromotion(cancelled),/must have success/);
 const staticFailed=fixture();staticFailed.needs['static-checks'].result='failure';
 assert.throws(()=>validateMockPromotion(staticFailed),/must have success/);
});

test('#239 rejects wrong run SHA, attempted reuse, duplicate receipts and unexpected jobs',()=>{
 const head=fixture();head.receipts[0].sha='b23bff217fa0baf5967b42e8553e01951d70d7c3';
 assert.throws(()=>validateMockPromotion(head),/wrong sha/);
 const retry=fixture();retry.receipts[0].attempt=2;
 assert.throws(()=>validateMockPromotion(retry),/wrong attempt/);
 const duplicate=fixture();duplicate.receipts[1].group=duplicate.receipts[0].group;
 assert.throws(()=>validateMockPromotion(duplicate),/Duplicate group receipt/);
 const extra=fixture();extra.receipts.push({...extra.receipts[0],group:'unknown'});
 assert.throws(()=>validateMockPromotion(extra),/Missing or extra/);
 const oldEvent=fixture();oldEvent.context.event='pull_request';
 assert.throws(()=>validateMockPromotion(oldEvent),/full main push/);
});

test('#239 rejects any malformed or incomplete individual command',()=>{
 for(const mutate of [
  c=>{c.outcome='failure';},c=>{c.exitCode=1;},
  c=>{c.signal='SIGTERM';},c=>{c.error='timeout';},
  c=>{c.file='tests/unknown-browser.cjs';},c=>{c.env={MATH_P8_BASELINE:'evil'};},
 ]){
  const x=fixture();mutate(x.receipts[0].commands[0]);
  assert.throws(()=>validateMockPromotion(x));
 }
 const missingCommand=fixture();missingCommand.receipts[0].commands.pop();
 assert.throws(()=>validateMockPromotion(missingCommand),/missing command results/);
 const failedGroup=fixture();failedGroup.receipts[0].status='failure';
 assert.throws(()=>validateMockPromotion(failedGroup),/incomplete or skipped/);
});

test('#239 evidence checks must be original ZIP paths with bound run identity',()=>{
 const missing=fixture();missing.evidence[0].paths=[];
 assert.throws(()=>validateMockPromotion(missing));
 const wrong=fixture();wrong.evidence[0].status='only-metadata-known';
 assert.throws(()=>validateMockPromotion(wrong),/No acceptance based only/);
 const wrongSha=fixture();wrongSha.evidence[0].sha='b23bff217fa0baf5967b42e8553e01951d70d7c3';
 assert.throws(()=>validateMockPromotion(wrongSha));
 const duplicate=fixture();duplicate.evidence[1].group=duplicate.evidence[0].group;
 assert.throws(()=>validateMockPromotion(duplicate),/Duplicate artifact owner/);
});

test('#239 any mismatched live workflow matrix, budget or missing gate fails preview',()=>{
 const plan=planShadow(reg());
 assert.throws(()=>buildMatrixBridgePreview(plan,wf().replace('fromJSON(needs.static-checks.outputs.browser_matrix)','fromJSON("{}")'))
  ,/match/);
 assert.throws(()=>buildMatrixBridgePreview(plan,wf().replace('max-parallel: 10','max-parallel: 15'))
  ,/match/);
 assert.throws(()=>buildMatrixBridgePreview(plan,wf().replace('    timeout-minutes: 35\n    strategy:', '    timeout-minutes: 60\n    strategy:'))
  ,/match/);
 assert.throws(()=>buildMatrixBridgePreview(plan,wf().replace('node scripts/required-browser-checks.mjs gate','echo bypassed'))
  ,/match/);
});

test('#239 synthetic new family remains unactivated, all old work mandatory',()=>{
 const src=reg();src.newFamilies=[future('example-new')];
 const plan=planShadow(src,{fileExists:()=>true});
 const preview=buildMatrixBridgePreview(plan,wf());
 assert.equal(preview.activationAllowed,false);
 assert.equal(preview.comparison.addedLiveJobs,1);
 assert.equal(preview.requiredLegacyJobs.length,13);
 assert.equal(preview.requiredLegacyJobs.reduce((n,g)=>n+g.commands.length,0),86);
 assert.equal(preview.unactivatedFutureJobs.length,1);
 assert.equal(preview.expectedFullRequiredReceipts.length,14);
 assert.equal(preview.unactivatedFutureJobs[0].commands[0].file,'tests/p9-example-new-browser.cjs');
 const x=fixture(preview);assert.equal(validateMockPromotion(x).commands,87);
 x.receipts=x.receipts.filter(r=>r.group!=='shadow-wave-1-job-01');
 assert.throws(()=>validateMockPromotion(x),/Missing or extra/);
});
