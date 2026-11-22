// Regression for NEW shared composition, using existing archived Check records.
// No original family suite or mathematical fixture generator is executed here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {EVIDENCE_ADAPTERS,createEvidenceAdapterRegistry} from '../dist/learning/evidence-adapters.js';
import {createIsolatedThinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {ISSUE341_ISOLATED_ADAPTERS,ISSUE341_INTEGRATION_STATUS,
 issue341IsolatedRegistry,issue341IsolatedGuide,issue341IsolatedFeedback}
 from '../dist/learning/issue341-isolated-integration.js';

await ensureB39Ready();
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const fixtures=JSON.parse(read('../verification/issue341-inputs/archived-checks-365.json'));
const ctx=row=>({sessionId:row.source.sessionId,index:row.source.index});

test('new shared registry rejects ambiguity, malformed descriptors and exceptions instead of choosing the first type',()=>{
 const binding=()=>({nodeId:'source'}),replay=()=>({}),submitted=()=>({});
 const a={id:'first',types:['widget','second-widget'],binding,replay,submitted};
 const b={...a,id:'second'};
 assert.throws(()=>createEvidenceAdapterRegistry([a,a]),/duplicate/);
 assert.throws(()=>createEvidenceAdapterRegistry([{...a,types:[]}]),/Invalid/);
 assert.equal(createEvidenceAdapterRegistry([a]).resolve({type:'second-widget'},{}).match.adapter.id,'first');
 assert.equal(createEvidenceAdapterRegistry([a,b]).resolve({type:'widget'},{}).status,'ambiguous');
 const throwing={...b,binding:()=>{throw Error('bad binding');}};
 assert.equal(createEvidenceAdapterRegistry([a,throwing]).resolve({type:'widget'},{}).status,'invalid');
 const composed=createIsolatedThinkingFeedback({adapters:[a,b],
  guideForBinding:()=>({}),feedbackForProof:()=>({})});
 assert.equal(composed.guide({type:'widget'},{}),null);
 assert.equal(composed.feedback({type:'widget'},{},{attempts:[{value:{}}]},{sessionId:'test',index:0}),null);
 assert.throws(()=>createIsolatedThinkingFeedback({adapters:[{...a,submitted:undefined}],
  guideForBinding:()=>({}),feedbackForProof:()=>({})}),/submitted/);
});

test('all365 archived records pass the new composition, with source-exclusive routing and original Check gates',()=>{
 assert.equal(fixtures.rows.length,365);
 assert.equal(ISSUE341_ISOLATED_ADAPTERS.length,113);
 assert.equal(new Set(fixtures.rows.map(row=>row.source.position)).size,365);
 for(const row of fixtures.rows){
  const context=ctx(row),task=sessionTaskFor(context.sessionId,context.index);
  const original=JSON.stringify({model:row.model,record:row.record});
  const selected=issue341IsolatedRegistry.resolve(task,context);
  assert.equal(selected.status,'matched',row.source.position);
  assert.equal(selected.match.adapter.id,row.familyId,row.source.position);
  assert.equal(selected.match.binding.nodeId,row.source.nodeId);
  const guide=issue341IsolatedGuide(task,context);
  assert.equal(guide.question,'哪些记录能帮助你核对这次结果？','pre-Check guide reveals no contract answer');
  const note=issue341IsolatedFeedback(task,row.model,row.record,context);
  assert.equal(note?.candidateFamily,row.familyId,row.source.position);
  assert.equal(note.proposalStatus,ISSUE341_INTEGRATION_STATUS);
  assert.equal(note.method,null);
  assert.equal(typeof note.connection,'string');
  assert.ok(note.connection.length>0);
  assert.ok(note.detail.some(line=>line.includes('不评定')));
  assert.equal(issue341IsolatedFeedback(task,row.model,{attempts:[]},context),null,'no Check');
  assert.equal(issue341IsolatedFeedback(task,row.model,
   {...row.record,attempts:row.record.attempts.slice(0,-1)},context),null,'latest submitted record differs');
  const modified=structuredClone(row.model);modified.__unsavedIntegrationEdit=true;
  assert.equal(issue341IsolatedFeedback(task,modified,row.record,context),null,'unsubmitted model edit');
  assert.equal(issue341IsolatedRegistry.resolve(task,{...context,index:String(context.index)}).match,null,'index type cannot coerce');
  assert.equal(issue341IsolatedRegistry.resolve({...task,prompt:task.prompt+' altered'},context).match,null,'altered task cannot route');
  if(row.group==='P007'){
   assert.equal(row.record.attempts.length,2);
   assert.equal(issue341IsolatedFeedback(task,row.model,
    {...row.record,attempts:[row.record.attempts.at(-1)]},context),null,'P007 original two-Check requirement');
  }
  assert.ok(JSON.stringify({model:row.model,record:row.record})===original,'new composition cannot alter original saved evidence');
 }
});

test('isolated factory stays separate from the newly connected formal route',()=>{
 const manifest=JSON.parse(read('../docs/spatial-learning/evidence-review-manifest.json'));
 assert.equal(manifest.tasks.length,1652);
 assert.equal(manifest.tasks.filter(row=>row.adapter?.startsWith('issue341-')).length,839);
 assert.ok(EVIDENCE_ADAPTERS.every(row=>!row.id.startsWith('issue341-')));
 assert.equal(read('../dist/learning/learn.js').includes('issue341-formal-admissions.js'),true);
 assert.equal(read('../dist/learning/thinking-feedback.js').includes("from './issue341-"),false);
 assert.equal(read('../dist/learning/evidence-adapters.js').includes("from './issue341-"),false);
 assert.equal(read('../dist/sw.js').includes('issue341-formal-source-routing.js'),true);
});
