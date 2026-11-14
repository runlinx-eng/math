import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditEvidenceExpansion,taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';

const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
const clone=()=>structuredClone(manifest);
const has=(report,kind)=>report.defects.some(defect=>defect.kind===kind);
const first=manifest.tasks[0],key=first.sessionId+':'+first.index;
const changed=replace=>EVIDENCE_ADAPTERS.map(adapter=>adapter.id===first.adapter?replace(adapter):adapter);
const targeted=(context)=>context.sessionId===first.sessionId&&context.index===first.index;

test('every reviewed binding retains its exact native source, task fingerprint, original grader and method',()=>{
 const report=auditEvidenceExpansion();
 assert.deepEqual(report.defects,[]);
 assert.equal(report.summary.nativeTasks,1996);assert.equal(report.summary.nativeNodes,587);
 assert.equal(report.summary.bridgeTasks,1552);assert.equal(report.summary.bridgeSessions,776);
 assert.equal(report.summary.reviewedTasks,manifest.tasks.length);
 assert.equal(report.summary.boundTasks,manifest.tasks.length);assert.equal(report.summary.bridgeBindings,0);
 assert.equal(report.reviewed.length,manifest.tasks.length);
 assert.ok(report.families.every(f=>f.boundTasks+f.unboundTasks===f.nativeTasks&&
  f.exampleReplayableUnbound+f.unverifiedUnbound===f.unboundTasks));
 assert.ok(report.families.every(f=>f.candidates.filter(row=>!row.bound).every(row=>row.manualReviewRequired)),
  'a successful example must remain a candidate instead of granting admission');
 assert.deepEqual(auditEvidenceExpansion(),report,'identical source produces deterministic review evidence');
});

test('reviewed task disappearance, content drift and missing binding fail without rewriting the manifest',()=>{
 const missing=clone();missing.tasks.push({...first,sessionId:'__missing_native__',index:0});
 assert.ok(has(auditEvidenceExpansion({manifest:missing}),'reviewed-position-missing'));
 const drift=clone();drift.tasks[0].taskHash='0'.repeat(64);
 assert.ok(has(auditEvidenceExpansion({manifest:drift}),'reviewed-task-changed'));
 const source=clone();source.tasks[0].nodeId='__different_source__';
 assert.ok(has(auditEvidenceExpansion({manifest:source}),'reviewed-source-changed'));
 const result=auditEvidenceExpansion({adapters:changed(adapter=>({...adapter,
  binding:(task,context)=>targeted(context)?null:adapter.binding(task,context)}))});
 assert.ok(result.defects.some(defect=>defect.id===key&&defect.kind==='reviewed-binding-missing-or-changed'));
 assert.deepEqual(JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url))),manifest);
});

test('new or overlapping bindings cannot authorize themselves through the registry',()=>{
 const removed=clone();removed.tasks=removed.tasks.filter(row=>row!==removed.tasks[0]);
 const unreviewed=auditEvidenceExpansion({manifest:removed});
 assert.ok(has(unreviewed,'unreviewed-runtime-binding'));
 const candidate=unreviewed.families.flatMap(f=>f.candidates).find(row=>row.id===key&&row.adapter===first.adapter);
 assert.equal(candidate.status,'unreviewed-runtime-binding');assert.equal(candidate.manifestMatched,false);
 assert.equal(candidate.manualReviewRequired,true,'a runtime binding cannot label itself reviewed');
 const duplicate=clone();duplicate.tasks.push({...first});
 assert.ok(has(auditEvidenceExpansion({manifest:duplicate}),'duplicate-reviewed-position'));
 const adapter=EVIDENCE_ADAPTERS.find(a=>a.id===first.adapter);
 const overlap=auditEvidenceExpansion({adapters:[...EVIDENCE_ADAPTERS,{...adapter,id:'__overlap__'}]});
 assert.ok(has(overlap,'overlapping-native-bindings'));
 assert.ok(has(auditEvidenceExpansion({adapters:[...EVIDENCE_ADAPTERS,adapter]}),'duplicate-adapter-id'));
});

test('source, method and replay regressions surface as distinct actionable defects',()=>{
 const source=auditEvidenceExpansion({adapters:changed(adapter=>({...adapter,binding:(task,context)=>{
  const binding=adapter.binding(task,context);return binding&&targeted(context)?{...binding,nodeId:'__wrong__'}:binding;
 }}))});
 assert.ok(has(source,'binding-source-mismatch'));
 const replay=auditEvidenceExpansion({adapters:changed(adapter=>({...adapter,replay:()=>null}))});
 assert.ok(has(replay,'reviewed-replay-failed'));
 const method=clone();method.tasks[0].method={nodeId:first.nodeId,code:'ccss-math:MP.99'};
 assert.ok(has(auditEvidenceExpansion({manifest:method}),'reviewed-method-changed'));
 const wrongMethod=auditEvidenceExpansion({feedbackFor:(task,model,record,context)=>{
  const feedback=thinkingFeedback(task,model,record,context);
  return feedback&&targeted(context)?{...feedback,method:{nodeId:first.nodeId,code:'ccss-math:MP.99',label:'invented'}}:feedback;
 }});
 assert.ok(has(wrongMethod,'unjustified-method-label'));
 const t=sessionTasks(first.sessionId)[first.index];
 assert.notEqual(taskFingerprint({...t,prompt:t.prompt+' changed'}),first.taskHash);
 assert.equal(taskFingerprint(Object.fromEntries(Object.entries(t).reverse())),first.taskHash,
  'object key order alone is not a mathematical definition change');
});

test('associated tasks remain isolated even if a future registry binding accidentally broadens',()=>{
 const adapter=EVIDENCE_ADAPTERS.find(a=>a.id==='array');
 const bridge=Object.keys(BRIDGES).flatMap(sessionId=>sessionTasks(sessionId).map((task,index)=>({sessionId,index,task})))
  .find(row=>row.task.type===adapter.type);
 assert.ok(bridge,'a real associated task exercises the same widget');
 const broadened=EVIDENCE_ADAPTERS.map(original=>original.id!==adapter.id?original:({...original,binding:(task,context)=>
  context.sessionId===bridge.sessionId&&context.index===bridge.index?{nodeId:BRIDGES[bridge.sessionId].topicId}:
   original.binding(task,context)}));
 const report=auditEvidenceExpansion({adapters:broadened});
 assert.equal(report.summary.bridgeBindings,1);
 assert.ok(has(report,'bridge-inherits-native-binding'));
});

test('a review manifest must retain typed positions and cannot hide malformed approval entries',()=>{
 for(const replacement of [null,[],{...first,index:String(first.index)},{...first,index:-1},
  {...first,index:0.5},{...first,sessionId:''},{...first,adapter:''},{...first,method:undefined},
  {...first,taskHash:first.taskHash.toUpperCase()},{...first,method:{nodeId:first.nodeId,code:null}}]){
  const changed=clone();changed.tasks[0]=replacement;
  assert.ok(has(auditEvidenceExpansion({manifest:changed}),'malformed-reviewed-entry'));
 }
 for(const malformed of [null,[],{}, {schema:manifest.schema,tasks:null}])
  assert.throws(()=>auditEvidenceExpansion({manifest:malformed}),/Unsupported reviewed source manifest/);
 const reordered=clone(),entry=reordered.tasks.find(row=>row.method);
 entry.method={code:entry.method.code,nodeId:entry.method.nodeId};
 assert.deepEqual(auditEvidenceExpansion({manifest:reordered}).defects,[],
  'method object key order does not change the reviewed source identity');
});

test('unbound native candidates cannot receive a strict guide or feedback through a separate UI fallback',()=>{
 const baseline=auditEvidenceExpansion();
 const allCandidates=baseline.families.flatMap(f=>f.candidates);
 const boundIds=new Set(allCandidates.filter(row=>row.bound).map(row=>row.id));
 const candidate=allCandidates.find(row=>!row.bound&&!row.error&&!boundIds.has(row.id));
 assert.ok(candidate,'the full source retains at least one unreviewed same-widget task');
 const targets=context=>context.sessionId+':'+context.index===candidate.id;
 const feedback=auditEvidenceExpansion({feedbackFor:(task,model,record,context)=>targets(context)?
  {method:null,observation:'unreviewed candidate evidence'}:thinkingFeedback(task,model,record,context)});
 const guide=auditEvidenceExpansion({guideFor:(task,context)=>targets(context)?
  {summary:'unreviewed guide',question:'This source is not admitted.'}:thinkingGuide(task,context)});
 for(const report of [feedback,guide]){
  assert.ok(report.defects.some(defect=>defect.kind==='unreviewed-native-ui-binding'&&defect.id===candidate.id));
  assert.equal(report.summary.boundTasks,baseline.summary.boundTasks);
  assert.equal(report.summary.reviewedTasks,baseline.summary.reviewedTasks);
  const row=report.families.flatMap(f=>f.candidates).find(row=>row.id===candidate.id&&row.adapter===candidate.adapter);
  assert.equal(row.bound,false);assert.equal(row.manualReviewRequired,true);
  assert.notEqual(row.status,'reviewed-binding','an example or stray UI output must not promote a candidate');
 }
});

test('associated UI leakage is detected even when all adapter bindings correctly return null',()=>{
 const bridge=Object.keys(BRIDGES).flatMap(sessionId=>sessionTasks(sessionId).map((task,index)=>({sessionId,index,task})))
  .find(row=>EVIDENCE_ADAPTERS.some(adapter=>adapter.type===row.task.type));
 assert.ok(bridge);
 const targets=context=>context.sessionId===bridge.sessionId&&context.index===bridge.index;
 const report=auditEvidenceExpansion({
  guideFor:(task,context)=>targets(context)?{summary:'borrowed native guide'}:thinkingGuide(task,context),
  feedbackFor:(task,model,record,context)=>targets(context)?{method:null,observation:'borrowed native proof'}:
   thinkingFeedback(task,model,record,context)
 });
 assert.equal(report.summary.bridgeBindings,0,'the scope bug is in the actual UI, not adapter admission');
 assert.ok(has(report,'bridge-inherits-native-guide'));
 assert.ok(has(report,'bridge-inherits-native-feedback'));
});

test('declared widget types cannot conceal broad native or associated bindings',()=>{
 const adapter=EVIDENCE_ADAPTERS.find(a=>a.id===first.adapter);
 const native=Object.keys(LESSONS).flatMap(sessionId=>sessionTasks(sessionId).map((task,index)=>({sessionId,index,task})))
  .find(row=>row.task.type!==adapter.type);
 const bridge=Object.keys(BRIDGES).flatMap(sessionId=>sessionTasks(sessionId).map((task,index)=>({sessionId,index,task})))
  .find(row=>row.task.type!==adapter.type);
 assert.ok(native&&bridge);
 const report=auditEvidenceExpansion({adapters:changed(original=>({...original,binding:(task,context)=>{
  if(context.sessionId===native.sessionId&&context.index===native.index)return {nodeId:LESSONS[native.sessionId].topicId};
  if(context.sessionId===bridge.sessionId&&context.index===bridge.index)return {nodeId:'__associated_source__'};
  return original.binding(task,context);
 }}))});
 assert.ok(report.defects.some(defect=>defect.kind==='native-binding-wrong-widget'&&defect.id===native.sessionId+':'+native.index));
 assert.ok(report.defects.some(defect=>defect.kind==='bridge-inherits-native-binding'&&defect.id===bridge.sessionId+':'+bridge.index));
});

test('a correct MP identifier cannot disguise a label taken from a different mathematical practice',()=>{
 const row=manifest.tasks.find(entry=>entry.method);
 const report=auditEvidenceExpansion({feedbackFor:(task,model,record,context)=>{
  const feedback=thinkingFeedback(task,model,record,context);
  return feedback&&context.sessionId===row.sessionId&&context.index===row.index?
   {...feedback,method:{...feedback.method,label:'a different mathematical practice'}}:feedback;
 }});
 assert.ok(report.defects.some(defect=>defect.kind==='unjustified-method-label'&&defect.id===row.sessionId+':'+row.index));
});
