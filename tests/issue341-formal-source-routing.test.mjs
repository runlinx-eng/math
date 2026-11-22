// #341 exact formal source/router checks; no original math suite or fixture replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {ISSUE341_NORMALIZED_ADAPTERS} from '../dist/learning/issue341-candidate-feedback.js';
import {ISSUE341_FOLLOWUP_126_ADAPTERS} from '../dist/learning/issue341-followup-126-candidates.js';
import {ISSUE342_A_P006_ADAPTERS} from '../dist/learning/issue342-a355-p006-candidates.js';
import {ISSUE341_FOLLOWUP_218_ADAPTERS} from '../dist/learning/issue341-followup-218-candidates.js';
import {ISSUE342_A_P001_P005_ADAPTERS} from '../dist/learning/issue342-a355-next-66-candidates.js';
import {ISSUE342_A_FIRST33_ADAPTERS} from '../dist/learning/issue342-a258-first33-candidates.js';
import {ISSUE342_A_NEXT11_ADAPTERS} from '../dist/learning/issue342-a258-next11-candidates.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();
import {ISSUE341_FORMAL_MANIFEST,hasIssue341FormalSource,hasIssue341FormalSession}
 from '../dist/learning/issue341-formal-admissions.js';
import {createIssue341ManifestGatedRouting} from '../dist/learning/issue341-formal-source-routing.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const official=JSON.parse(read('../docs/spatial-learning/evidence-review-manifest.json'));
const family=ISSUE341_NORMALIZED_ADAPTERS.find(x=>x.id==='issue341-P007A');
const [one,two]=family.sources;
const entry=s=>({sessionId:s.sessionId,index:s.index,type:s.type,nodeId:s.nodeId,
 adapter:family.id,taskHash:s.taskHash,method:null});
const only=(...tasks)=>({schema:official.schema,tasks});
const context=s=>({sessionId:s.sessionId,index:s.index});

test('all 850 frozen candidate positions exactly match official 1663 manifest and browser release snapshot',()=>{
 assert.equal(official.tasks.length,1663);
 assert.equal(ISSUE341_FORMAL_MANIFEST.tasks.length,850);
 assert.equal(ISSUE341_NORMALIZED_ADAPTERS.length,113);
 assert.equal(ISSUE342_A_P006_ADAPTERS.length,19);
 assert.equal(ISSUE341_FOLLOWUP_218_ADAPTERS.length,52);
 assert.equal(ISSUE342_A_P001_P005_ADAPTERS.length,31);
 assert.equal(ISSUE342_A_FIRST33_ADAPTERS.length,4);
 assert.equal(ISSUE342_A_FIRST33_ADAPTERS.reduce((n,f)=>n+f.sources.length,0),33);
 assert.equal(ISSUE342_A_NEXT11_ADAPTERS.length,5);
 assert.equal(ISSUE342_A_NEXT11_ADAPTERS.reduce((n,f)=>n+f.sources.length,0),11);
 assert.equal(new Set(official.tasks.map(r=>JSON.stringify([r.sessionId,r.index]))).size,1663);
 const officialRows=official.tasks.filter(r=>r.adapter?.startsWith('issue341-'));
 assert.equal(officialRows.length,850);
 assert.deepEqual(officialRows,ISSUE341_FORMAL_MANIFEST.tasks);
 const frozen=[...ISSUE341_NORMALIZED_ADAPTERS,...ISSUE341_FOLLOWUP_126_ADAPTERS,...ISSUE341_FOLLOWUP_218_ADAPTERS,...ISSUE342_A_P006_ADAPTERS,...ISSUE342_A_P001_P005_ADAPTERS,...ISSUE342_A_FIRST33_ADAPTERS,...ISSUE342_A_NEXT11_ADAPTERS].flatMap(f=>f.sources.map(s=>({family:f.id,source:s})));
 assert.equal(frozen.length,850);
 const byPosition=new Map(officialRows.map(r=>[JSON.stringify([r.sessionId,r.index]),r]));
 for(const {family,source} of frozen){
  const row=byPosition.get(JSON.stringify([source.sessionId,source.index]));
  assert.ok(row,source.position);
  assert.equal(row.nodeId,source.nodeId);
  assert.equal(row.type,source.type);
  assert.equal(row.taskHash,source.taskHash);
  assert.equal(row.adapter,family);
  assert.equal(row.method,null);
  assert.equal(hasIssue341FormalSource(source.sessionId,source.index),true);
  assert.equal(hasIssue341FormalSession(source.sessionId),true);
 }
 assert.equal(hasIssue341FormalSource(one.sessionId,String(one.index)),false);
 assert.ok(EVIDENCE_ADAPTERS.every(row=>!row.id.startsWith('issue341-')),
  'legacy registry stays untouched; production composes its own exact route');
 const html=read('../dist/learning/learn.js');
 assert.match(html,/ensureIssue341FormalRouting\(next\)/);
 assert.match(html,/formalGuide\(t,/);
 assert.match(html,/formalFeedback\(t,/);
 assert.match(read('../dist/sw.js'),/issue341-formal-source-routing.js/);
});

test('formal runtime supports exact all839 frozen sources',()=>{
 const route=createIssue341ManifestGatedRouting(ISSUE341_FORMAL_MANIFEST);
 assert.equal(route.approvedPositions,850);
 assert.equal(route.approvedFamilies,259);
 assert.equal(route.adapters.length,259);
 assert.equal(route.adapters.reduce((n,a)=>n+a.sources.length,0),850);
 for(const source of family.sources){
  const task=sessionTaskFor(source.sessionId,source.index);
  const selected=route.registry.resolve(task,context(source));
  assert.equal(selected.status,'matched');
  assert.equal(selected.match.adapter.id,family.id);
  assert.equal(selected.match.binding.strictAApproved,true);
 }
 assert.equal(route.guide(sessionTaskFor(one.sessionId,one.index),context(one)).question,
  '哪些记录能帮助你核对这次结果？');
});

test('partial formal manifest never activates the same-family unlisted sibling',()=>{
 const route=createIssue341ManifestGatedRouting(only(entry(one)));
 assert.equal(route.approvedPositions,1);
 assert.equal(route.approvedFamilies,1);
 const adapter=route.adapters[0],task=sessionTaskFor(one.sessionId,one.index);
 assert.equal(adapter.binding(task,context(one))?.strictAApproved,true);
 assert.equal(adapter.sources.length,1);
 assert.equal(adapter.binding(sessionTaskFor(two.sessionId,two.index),context(two)),null);
 assert.equal(adapter.binding(task,{...context(one),index:String(one.index)}),null);
 assert.equal(adapter.binding({...task,prompt:task.prompt+' forged'},context(one)),null);
});

test('malformed hashes, types, adapters, methods and duplicate sources refuse closed',()=>{
 assert.throws(()=>createIssue341ManifestGatedRouting({tasks:[]}),/formal manifest required/);
 const good=entry(one);
 for(const row of [
  {...good,taskHash:'0'.repeat(64)},
  {...good,nodeId:'unknown'},
  {...good,type:'x-forged'},
  {...good,adapter:'issue341-P007B'},
  {...good,method:{nodeId:'made-up'}},
  {...good,index:String(good.index)}
 ])assert.throws(()=>createIssue341ManifestGatedRouting(only(row)));
 assert.throws(()=>createIssue341ManifestGatedRouting(only(good,{...good})),/Duplicate/);
 assert.throws(()=>createIssue341ManifestGatedRouting(only({...good,sessionId:'unknown-native-source'})),/frozen original/);
 assert.equal(createIssue341ManifestGatedRouting(only()).approvedPositions,0);
});


test('A258 33 source-locked new bindings reject sibling, wrong hash and altered original task',()=>{
 const all=ISSUE342_A_FIRST33_ADAPTERS.flatMap(f=>f.sources.map(s=>({f,s})));
 const sourcePositions=new Set(all.map(({s})=>s.position));
 assert.equal(sourcePositions.size,33);
 const route=createIssue341ManifestGatedRouting(ISSUE341_FORMAL_MANIFEST);
 for(const {f,s} of all){
  const task=sessionTaskFor(s.sessionId,s.index),ctx=context(s);
  const resolved=route.registry.resolve(task,ctx);
  assert.equal(resolved.status,'matched',s.position);
  assert.equal(resolved.match.adapter.id,f.id,s.position);
  assert.equal(resolved.match.binding.candidateSource.taskHash,s.taskHash,s.position);
  assert.equal(resolved.match.binding.strictAApproved,true,s.position);
  const bad={...task,prompt:(task.prompt||'')+' forged'};
  assert.equal(route.registry.resolve(bad,ctx).status,'unbound',s.position+' forged task');
  const isolated=createIssue341ManifestGatedRouting(only({...s,adapter:f.id,method:null}));
  assert.equal(isolated.approvedPositions,1);
  assert.equal(isolated.approvedFamilies,1);
  assert.equal(isolated.registry.resolve(task,ctx).status,'matched');
  const sibling=f.sources.find(row=>row.position!==s.position);
  if(sibling){
   const otherTask=sessionTaskFor(sibling.sessionId,sibling.index);
   assert.equal(isolated.registry.resolve(otherTask,context(sibling)).status,'unbound',
    'no same-family sibling auto-approved '+sibling.position);
  }
 }
});

test('A258 next11 exact source identity and partial approval fail closed',()=>{
 const rows=ISSUE342_A_NEXT11_ADAPTERS.flatMap(f=>f.sources.map(s=>({f,s})));
 assert.equal(rows.length,11);
 const full=createIssue341ManifestGatedRouting(ISSUE341_FORMAL_MANIFEST);
 for(const {f,s} of rows){
  const task=sessionTaskFor(s.sessionId,s.index),ctx=context(s);
  const match=full.registry.resolve(task,ctx);
  assert.equal(match.status,'matched',s.position);
  assert.equal(match.match.adapter.id,f.id,s.position);
  assert.equal(match.match.binding.candidateSource.taskHash,s.taskHash,s.position);
  assert.equal(match.match.binding.strictAApproved,true,s.position);
  const onlyOne=createIssue341ManifestGatedRouting(only({...s,adapter:f.id,method:null}));
  assert.equal(onlyOne.approvedPositions,1);
  assert.equal(onlyOne.registry.resolve(task,ctx).status,'matched');
  for(const sibling of f.sources.filter(other=>other.position!==s.position)){
   assert.equal(onlyOne.registry.resolve(sessionTaskFor(sibling.sessionId,sibling.index),context(sibling)).status,'unbound',
    'same family sibling cannot be auto-granted '+sibling.position);
  }
  assert.equal(full.registry.resolve({...task,prompt:task.prompt+' forged'},ctx).status,'unbound');
  assert.throws(()=>createIssue341ManifestGatedRouting(only({...s,adapter:f.id,method:null,taskHash:'0'.repeat(64)})));
 }
});
