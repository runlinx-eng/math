// New #341 follow-up composition only. Reuses local math and browser evidence;
// this test does not manufacture original Check records or confer formal A.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();
import {ISSUE341_FOLLOWUP_126_ADAPTERS} from '../dist/learning/issue341-followup-126-candidates.js';
import {createIssue341Followup126StagedRouting} from '../dist/learning/issue341-followup-126-staged-routing.js';
const official=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url),'utf8'));
const frozen=ISSUE341_FOLLOWUP_126_ADAPTERS.flatMap(f=>f.sources.map(s=>({f,s})));
const row=({f,s})=>({sessionId:s.sessionId,index:s.index,type:s.type,nodeId:s.nodeId,
 adapter:f.id,taskHash:s.taskHash,method:null});
const only=(...tasks)=>({schema:official.schema,tasks});
const context=s=>({sessionId:s.sessionId,index:s.index});
test('35 candidates bind exactly 126 unique new native positions without modifying existing official A',()=>{
 assert.equal(ISSUE341_FOLLOWUP_126_ADAPTERS.length,35);
 assert.equal(frozen.length,126);
 assert.equal(official.tasks.length,1652);
 const old=new Set(official.tasks.filter(s=>!s.adapter.startsWith('issue341-B126-'))
  .map(s=>JSON.stringify([s.sessionId,s.index])));
 assert.equal(old.size,1526);
 assert.equal(official.tasks.filter(s=>s.adapter.startsWith('issue341-B126-')).length,126);
 const next=new Set();
 for(const {f,s} of frozen){
  const k=JSON.stringify([s.sessionId,s.index]);
  assert.ok(!next.has(k),'duplicate '+k);next.add(k);
  assert.ok(!old.has(k),'collides with formal source '+k);
  assert.match(s.taskHash,/^[0-9a-f]{64}$/);
  assert.equal(f.id.startsWith('issue341-B126-'),true);
  const task=sessionTaskFor(s.sessionId,s.index);
  assert.ok(task,s.position);
  assert.equal(task.type,s.type,s.position);
  const binding=f.binding(task,context(s));
  assert.ok(binding,s.position);
  assert.equal(binding.strictAApproved,false,s.position);
  assert.equal(binding.candidateSource.taskHash,s.taskHash,s.position);
  assert.equal(f.binding({...task,type:'forged-type'},context(s)),null);
 }
});
test('staged all-126 exact source selection is isolated from default formal manifest',()=>{
 const route=createIssue341Followup126StagedRouting(only(...frozen.map(row)));
 assert.equal(route.selectedPositions,126);
 assert.equal(route.selectedFamilies,35);
 assert.equal(route.adapters.reduce((sum,a)=>sum+a.sources.length,0),126);
 for(const {s,f} of frozen){
  const resolved=route.registry.resolve(sessionTaskFor(s.sessionId,s.index),context(s));
  assert.equal(resolved.status,'matched',s.position);
  assert.equal(resolved.match.adapter.id,f.id,s.position);
  assert.equal(resolved.match.binding.strictAApproved,true,s.position);
 }
 const empty=createIssue341Followup126StagedRouting(only(...official.tasks.filter(s=>!s.adapter.startsWith('issue341-B126-'))));
 assert.equal(empty.selectedPositions,0);
 assert.equal(empty.selectedFamilies,0);
});
test('single-source opt-in keeps unlisted siblings out and invalid identities closed',()=>{
 const first=frozen[0],second=frozen[1];
 const selected=createIssue341Followup126StagedRouting(only(row(first)));
 assert.equal(selected.selectedPositions,1);
 assert.equal(selected.adapters[0].binding(sessionTaskFor(first.s.sessionId,first.s.index),context(first.s)).strictAApproved,true);
 assert.equal(selected.adapters[0].binding(sessionTaskFor(second.s.sessionId,second.s.index),context(second.s)),null);
 const exact=row(first);
 for(const bad of [
  {...exact,taskHash:'0'.repeat(64)}, {...exact,nodeId:'forged-node'},
  {...exact,type:'forged-type'}, {...exact,index:String(exact.index)},
  {...exact,method:{nodeId:'forged'}}, {...exact,adapter:'issue341-B126-unknown'}
 ])assert.throws(()=>createIssue341Followup126StagedRouting(only(bad)));
 assert.throws(()=>createIssue341Followup126StagedRouting(only(exact,exact)),/Duplicate/);
 assert.throws(()=>createIssue341Followup126StagedRouting({tasks:[]}));
});
