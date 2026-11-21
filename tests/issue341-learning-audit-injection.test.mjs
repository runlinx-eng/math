// New classification wiring only: use the successful original Artifact input.
// No original family suite, example generator or raw fixture publication.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditLearningEvidence} from '../scripts/audit-learning-evidence.mjs';
import {ISSUE341_ISOLATED_ADAPTERS,issue341IsolatedRegistry,
 issue341IsolatedGuide} from '../dist/learning/issue341-isolated-integration.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const fixtures=JSON.parse(read('../verification/issue341-inputs/archived-checks-365.json'));
const archived=new Map(fixtures.rows.map(row=>[row.source.position,row]));
const position=context=>context.sessionId+':'+context.index;
const candidateIds=new Set(ISSUE341_ISOLATED_ADAPTERS.map(adapter=>adapter.id));
const guideFor=(task,context)=>candidateIds.has(issue341IsolatedRegistry.resolve(task,context).match?.adapter.id)
 ?issue341IsolatedGuide(task,context):null;
const exampleFor=(task,context,adapter)=>{
 const original=archived.get(position(context));
 assert.ok(original,'missing original archived source: '+position(context));
 assert.equal(original.familyId,adapter.id);
 assert.equal(original.source.type,task.type);
 return original.model;
};

test('explicit learning-audit injection consumes all365 archived full records in memory without formal admission',async()=>{
 const officialBefore=read('../docs/spatial-learning/evidence-review-manifest.json');
 const originalsBefore=JSON.stringify(fixtures.rows);
 const delivered=new Map();
 const report=await auditLearningEvidence({adapters:ISSUE341_ISOLATED_ADAPTERS,
  guideFor,exampleFor,recordFor:(task,example,context,adapter)=>{
   const original=archived.get(position(context));
   assert.equal(original.familyId,adapter.id);
   assert.ok(example===original.model,'original model object preserved');
   delivered.set(position(context),original.record);
   return original.record;
  }
 });
 const selected=report.rows.filter(row=>row.replayVerified);
 assert.equal(report.summary.classificationScope,'PROPOSED_SIMULATION_NOT_FORMAL_APPROVAL');
 assert.equal(report.summary.formalStrictAGranted,0);
 assert.equal(report.summary.nativeCoreTasks,1996);
 assert.equal(report.summary.bridgeTasks,1552);
 assert.equal(report.summary.guideBindingsNative,365);
 assert.equal(selected.length,365);
 assert.equal(new Set(selected.map(row=>row.evidenceAdapter)).size,113);
 assert.deepEqual(new Set(selected.map(row=>row.sessionId+':'+row.index)),new Set(archived.keys()));
 assert.equal(report.rows.filter(row=>row.kind==='bridge'&&row.replayVerified).length,0);
 assert.equal(delivered.size,365);
 for(const original of fixtures.rows){
  assert.ok(delivered.get(original.source.position)===original.record,'original full record preserved');
  if(original.group==='P007')assert.equal(original.record.attempts.length,2);
 }
 assert.ok(JSON.stringify(fixtures.rows)===originalsBefore,'original archived inputs unchanged');
 assert.equal(read('../docs/spatial-learning/evidence-review-manifest.json'),officialBefore);
 assert.equal(JSON.parse(officialBefore).tasks.length,813);
 assert.match(report.report[0],/未授 A/);
 console.log('ISSUE341_LEARNING_AUDIT_INJECTION '+JSON.stringify({
  status:'PASS_PROPOSED_CLASSIFICATION_INJECTION_NOT_FORMAL_APPROVAL',
  families:113,positions:365,originalRecords:delivered.size,bridgeBindings:0,
  formalStrictAGranted:0,officialManifestTasks:813,
  originalArtifactRun:fixtures.sourceRun,originalArtifactHead:fixtures.sourceHead
 }));
});

test('a full-record contract cannot silently fall back to replay when its record provider is omitted',async()=>{
 const original=ISSUE341_ISOLATED_ADAPTERS.find(adapter=>adapter.id==='issue341-P007A');
 let replayCalls=0;
 const adapter={...original,replay:()=>{replayCalls++;throw new Error('Forbidden replay fallback');}};
 const report=await auditLearningEvidence({adapters:[adapter],guideFor:()=>null,exampleFor});
 assert.equal(replayCalls,0);
 assert.equal(report.summary.replayVerifiedTasksNative,0);
 assert.equal(report.summary.formalStrictAGranted,0);
 for(const source of original.sources){
  const row=report.rows.find(row=>row.id==='native:'+source.position);
  assert.equal(row.replayVerified,false);
  assert.notEqual(row.evidenceLevel,'A');
 }
});

test('classification rejects incorrect type declarations and ambiguous source bindings before reading evidence',async()=>{
 const original=ISSUE341_ISOLATED_ADAPTERS.find(adapter=>adapter.id==='issue341-P007A');
 const noEvidence=()=>{throw new Error('A rejected source must not read a fixture');};
 for(const adapters of [
  [{...original,types:['__not_the_original_widget__']}],
  [original,{...original,id:original.id+'-overlap'}]
 ]){
  const report=await auditLearningEvidence({adapters,guideFor:()=>null,
   exampleFor:noEvidence,recordFor:noEvidence});
  assert.equal(report.summary.replayVerifiedTasksNative,0);
  assert.equal(report.summary.formalStrictAGranted,0);
 }
});
