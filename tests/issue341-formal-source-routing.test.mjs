// Only the new manifest-to-runtime route is exercised. Original mathematical
// contracts, old Node/Chromium suites and archived Check inputs are not rerun.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {ISSUE341_NORMALIZED_ADAPTERS} from '../dist/learning/issue341-candidate-feedback.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {createIssue341ManifestGatedRouting}
 from '../dist/learning/issue341-formal-source-routing.js';

const original=readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url),'utf8');
const official=JSON.parse(original);
const family=ISSUE341_NORMALIZED_ADAPTERS.find(x=>x.id==='issue341-P007A');
const [one,two]=family.sources;
const entry=s=>({sessionId:s.sessionId,index:s.index,type:s.type,
 nodeId:s.nodeId,adapter:family.id,taskHash:s.taskHash,method:null});
const withEntries=(...extra)=>({...official,tasks:[...official.tasks,...extra]});
const context=s=>({sessionId:s.sessionId,index:s.index});
const decision=(s,decision='APPROVE')=>({packet:family.packet,sessionId:s.sessionId,
 index:s.index,nodeId:s.nodeId,type:s.type,taskHash:s.taskHash,adapter:family.id,decision});
const clone=x=>JSON.parse(JSON.stringify(x));

test('current official A813 produces zero candidate activation; default runtime stays untouched',()=>{
 assert.equal(official.tasks.length,813);
 const route=createIssue341ManifestGatedRouting(official);
 assert.equal(route.approvedPositions,0);
 assert.equal(route.approvedFamilies,0);
 assert.equal(route.adapters.length,0);
 assert.ok(EVIDENCE_ADAPTERS.every(a=>!a.id.startsWith('issue341-')));
 assert.equal(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url),'utf8'),original);
 assert.equal(readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8').includes('issue341-'),false);
 assert.equal(readFileSync(new URL('../dist/learning/thinking-feedback.js',import.meta.url),'utf8').includes("from './issue341-"),false);
});

test('hypothetical one-of-two family selection stays restricted to the exact native position',()=>{
 assert.equal(family.sources.length,2);
 const route=createIssue341ManifestGatedRouting(withEntries(entry(one)),[decision(one)]);
 assert.equal(route.approvedPositions,1);
 assert.equal(route.approvedFamilies,1);
 assert.equal(route.adapters.length,1);
 assert.equal(route.adapters[0].sources.length,1);
 assert.equal(route.adapters[0].sources[0].taskHash,one.taskHash);
 const task=sessionTaskFor(one.sessionId,one.index);
 const bound=route.adapters[0].binding(task,context(one));
 assert.equal(bound?.strictAApproved,true);
 assert.equal(bound?.candidateSource?.taskHash,one.taskHash);
 assert.equal(route.registry.resolve(task,context(one)).match?.adapter.id,family.id);
 const siblingTask=sessionTaskFor(two.sessionId,two.index);
 assert.equal(route.adapters[0].binding(siblingTask,context(two)),null);
 assert.notEqual(route.registry.resolve(siblingTask,context(two)).match?.adapter.id,family.id);
 assert.equal(route.adapters[0].binding(task,{...context(one),index:String(one.index)}),null);
 assert.equal(route.adapters[0].binding({...task,prompt:task.prompt+' forged'},context(one)),null);
 assert.equal(route.guide(task,context(one)).question,'哪些记录能帮助你核对这次结果？');
 assert.equal(JSON.parse(original).tasks.length,813,'synthetic selection never writes the official file');
});

test('only exact reviewed manifest identities can be routed; wrong hash/type/adapter/duplicate refuse',()=>{
 assert.throws(()=>createIssue341ManifestGatedRouting({tasks:[]}),/formal manifest required/);
 const good=entry(one);
 for(const tampered of [
  {...good,taskHash:'0'.repeat(64)},
  {...good,nodeId:'unknown'},
  {...good,type:'x-forged'},
  {...good,adapter:'issue341-P007B'},
  {...good,method:{nodeId:'made-up'}},
  {...good,index:String(good.index)}
 ])assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(tampered),[decision(one)]));
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(good,clone(good)),[decision(one)]),/Duplicate/);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries({
  ...good,sessionId:'unknown-native-source'
 }),[decision(one)]),/frozen original/);
});

test('independent decisions and manifest must BOTH approve the exact same position',()=>{
 const approved=entry(one);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(approved)),
  /lacks matching independent approval/);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(approved),[decision(one,'BLOCKED')]),
  /lacks matching independent approval/);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(approved),[decision(one,'REJECT')]),
  /lacks matching independent approval/);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(approved),[decision(two)]),
  /lacks matching independent approval/);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(approved),[{
  ...decision(one),taskHash:'0'.repeat(64)}]),/frozen source identity/);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(approved),[{
  ...decision(one),packet:'P999'}]),/frozen source identity/);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(approved),[
  decision(one),decision(one)]),/Duplicate independent/);
 assert.throws(()=>createIssue341ManifestGatedRouting(withEntries(approved),{}),
  /decision list required/);
 assert.equal(createIssue341ManifestGatedRouting(official,[decision(one)]).approvedPositions,0,
  'a review decision alone cannot change the formal manifest');
 const accepted=createIssue341ManifestGatedRouting(withEntries(approved),[
  decision(one),decision(two,'BLOCKED')]);
 assert.equal(accepted.approvedPositions,1);
 assert.equal(accepted.adapters[0].sources.length,1);
 assert.equal(accepted.adapters[0].sources[0].sessionId,one.sessionId);
});
