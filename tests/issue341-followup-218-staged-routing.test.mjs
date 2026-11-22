// Exact B218 source-gate contracts. This does not activate the production learner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {ISSUE341_FOLLOWUP_218_ADAPTERS} from '../dist/learning/issue341-followup-218-candidates.js';
import {createIssue341Followup218StagedRouting} from '../dist/learning/issue341-followup-218-staged-routing.js';
await ensureB39Ready();
const official=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url),'utf8'));
const frozen=ISSUE341_FOLLOWUP_218_ADAPTERS.flatMap(f=>f.sources.map(s=>({f,s})));
const row=({f,s})=>({sessionId:s.sessionId,index:s.index,type:s.type,nodeId:s.nodeId,
 adapter:f.id,taskHash:s.taskHash,method:null});
const only=(...tasks)=>({schema:official.schema,tasks});
const context=s=>({sessionId:s.sessionId,index:s.index});
test('52 B218 candidate families contain precisely 218 frozen source identities without overlap',()=>{
 assert.equal(ISSUE341_FOLLOWUP_218_ADAPTERS.length,52);
 assert.equal(frozen.length,218);
 const older=official.tasks.filter(s=>!s.adapter?.startsWith('issue341-B218-'));
 assert.equal(older.length,1401);
 const old=new Set(older.map(s=>JSON.stringify([s.sessionId,s.index])));
 assert.equal(old.size,1401);
 const next=new Set();
 for(const {f,s} of frozen){
  const k=JSON.stringify([s.sessionId,s.index]);assert.ok(!next.has(k),k);
  next.add(k);assert.ok(!old.has(k),'previously formal '+k);
  assert.match(s.taskHash,/^[0-9a-f]{64}$/);assert.ok(f.id.startsWith('issue341-B218-'));
  const task=sessionTaskFor(s.sessionId,s.index);assert.ok(task,s.position);
  assert.equal(task.type,s.type,s.position);
  const binding=f.binding(task,context(s));assert.ok(binding,s.position);
  assert.equal(binding.strictAApproved,false,s.position);
  assert.equal(binding.candidateSource.taskHash,s.taskHash,s.position);
  assert.equal(f.binding({...task,type:'forged-type'},context(s)),null);
 }
});
test('explicit all-B218 route selects exactly 218 while empty source list selects nothing',()=>{
 const route=createIssue341Followup218StagedRouting(only(...frozen.map(row)));
 assert.equal(route.selectedPositions,218);assert.equal(route.selectedFamilies,52);
 assert.equal(route.adapters.reduce((n,a)=>n+a.sources.length,0),218);
 for(const {f,s} of frozen){
  const chosen=route.registry.resolve(sessionTaskFor(s.sessionId,s.index),context(s));
  assert.equal(chosen.status,'matched',s.position);
  assert.equal(chosen.match.adapter.id,f.id,s.position);
  assert.equal(chosen.match.binding.strictAApproved,true,s.position);
 }
 const empty=createIssue341Followup218StagedRouting(only(...official.tasks.filter(s=>!s.adapter?.startsWith('issue341-B218-'))));
 assert.equal(empty.selectedPositions,0);assert.equal(empty.selectedFamilies,0);
});
test('partial manifest excludes siblings; malformed, forged, or duplicate sources fail closed',()=>{
 const [first,second]=frozen;
 const route=createIssue341Followup218StagedRouting(only(row(first)));
 assert.equal(route.selectedPositions,1);
 assert.equal(route.adapters[0].binding(sessionTaskFor(second.s.sessionId,second.s.index),context(second.s)),null);
 const valid=row(first);
 for(const bad of [
  {...valid,taskHash:'0'.repeat(64)}, {...valid,nodeId:'forged-node'},
  {...valid,type:'x-forged'}, {...valid,index:String(valid.index)},
  {...valid,method:{}}, {...valid,adapter:'issue341-B218-invalid'}
 ])assert.throws(()=>createIssue341Followup218StagedRouting(only(bad)));
 assert.throws(()=>createIssue341Followup218StagedRouting(only(valid,valid)),/Duplicate/);
 assert.throws(()=>createIssue341Followup218StagedRouting({tasks:[]}));
});
