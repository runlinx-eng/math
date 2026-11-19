import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as M from '../dist/learning/phase5/b28-model.js';
import * as V from '../dist/learning/phase5/b28-view.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTaskFor,sessionTasks} from '../dist/learning/bridges.js';
import {compareBinding,replayCompareEvidence} from '../dist/learning/compare-evidence.js';

const locations={
 compareheight:[0,1,2],
 ordermeasure:[0,2],
 indirectlength:[0,1,2],
 lengthdifference:[0,1,2]
};
const specs=Object.entries(locations).flatMap(([sessionId,indices])=>indices.map(index=>({sessionId,index})));
const at=s=>sessionTaskFor(s.sessionId,s.index),ctx=s=>({sessionId:s.sessionId,index:s.index});
const cp=structuredClone,proof=(t,m)=>replayCompareEvidence(t,m);
const field=(t,m,key,value)=>{m[key]=String(value);M.field(t,m,key);};
const act=(t,m,a,index)=>M.act(t,m,'m28-'+a,index===undefined?{}:{index});
const answer=(t,m)=>t.questions.forEach((q,i)=>{m.answers[i]=String(q.value);M.field(t,m,'answers.'+i);});

test('eleven independent original compare tasks are assigned to four exact source nodes',()=>{
 assert.equal(specs.length,11);
 assert.equal(new Set(specs.map(x=>LESSONS[x.sessionId].topicId)).size,4);
 for(const s of specs){
  const t=at(s),m=M.example(t),b=compareBinding(t,ctx(s)),p=proof(t,m);
  assert.equal(t.type,'x-m28-compare');
  assert.equal(M.valid(t,m),true);
  assert.equal(M.inspect(t,m).correct,true);
  assert.ok(b,s.sessionId+':'+s.index+' source binding');
  assert.equal(b.nodeId,LESSONS[s.sessionId].topicId);
  assert.equal(b.method,null);
  assert.ok(p,s.sessionId+':'+s.index+' independent replay');
  assert.equal(p.kind,'length-comparison');
  assert.equal(p.construction.objects.length,t.items.length);
  assert.equal(p.construction.lengthDifference,String(Math.max(...t.items.map(x=>x.length))-
    Math.min(...t.items.map(x=>x.length))));
  assert.equal(p.construction.measurementPerformed,false);
  assert.equal(p.independentStrategyAssessed,false);
  assert.equal(p.generalMasteryAssessed,false);
  assert.equal(compareBinding(t,{sessionId:s.sessionId,index:-1}),null);
  assert.equal(compareBinding(t,{sessionId:s.sessionId,index:String(s.index)}),null);
  assert.equal(compareBinding(t,{sessionId:s.sessionId,index:99}),null);
  assert.equal(compareBinding({...t,prompt:t.prompt+' (forged)'},ctx(s)),null);
 }
 // These are original source git blobs, not invented reconstructed task bytes.
 for(const [path,sha] of Object.entries({
  'dist/learning/phase5/b28-model.js':'5ddc6c6f10ad79ba997a88ab25764a655fad4b94',
  'dist/learning/phase5/b28.js':'51c25af8bd3f97959b4918a010a7488c142df943'
 })){
  const bytes=readFileSync(new URL('../'+path,import.meta.url));
  const h=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(h,sha,path+' original source was not changed');
 }
});

test('copy, alignment, direct comparison and sorting are different visible contracts',()=>{
 for(const s of specs){
  const t=at(s),m=M.example(t),p=proof(t,m);
  assert.ok(p);
  if(t.mode==='indirect'){
   assert.equal(p.construction.recordedItems.length,t.items.length);
   assert.equal(p.construction.alignmentObserved,false);
   assert.equal(p.construction.finalZeroAligned,false);
   assert.ok(p.construction.copyHistory.every(x=>x.recorded));
  }else if(t.mode==='order'){
   assert.equal(p.construction.orderedIndices.length,t.items.length);
   assert.ok(p.construction.orderedIndices.every((n,i)=>i===0||
    t.items[p.construction.orderedIndices[i-1]].length<=t.items[n].length));
   assert.equal(p.construction.finalZeroAligned,true);
  }else{
   assert.equal(p.construction.finalZeroAligned,true);
   assert.ok(p.construction.choiceHistory.length>=1);
  }
  for(const q of p.construction.questions){
   assert.ok(q.kind);
   assert.equal(typeof q.raw,'string');
  }
 }
});

test('visible first mistake, correction and repeated choice are replayed without erasing history',()=>{
 const s={sessionId:'compareheight',index:0},t=at(s),m=M.initial(t,314159);
 field(t,m,'offset','0');
 act(t,m,'choice','left');
 assert.equal(M.inspect(t,m).correct,false);
 act(t,m,'choice','right');
 assert.equal(M.inspect(t,m).correct,true);
 const p=proof(t,m);assert.ok(p);
 assert.equal(p.construction.originalBad,true);
 assert.equal(p.construction.originalFirst.choice,'left');
 assert.deepEqual(p.construction.choiceHistory.map(x=>x.value),['left','right']);
 assert.deepEqual(p.construction.firstWrongChoices.map(x=>x.value),['left']);
 act(t,m,'choice','right');assert.ok(proof(t,m));
});

test('indirect comparison records each presented length; it does not prove independent inference',()=>{
 const s={sessionId:'indirectlength',index:1},t=at(s),m=M.initial(t,314159);
 act(t,m,'copy',2);act(t,m,'copy',0);act(t,m,'copy',1);
 act(t,m,'choice','right');act(t,m,'choice','left');answer(t,m);
 assert.equal(M.inspect(t,m).correct,true);
 const p=proof(t,m);assert.ok(p);
 assert.deepEqual(p.construction.recordedItems,[2,0,1]);
 assert.equal(p.construction.firstWrongChoices.length,1);
 assert.equal(p.construction.questions[0].kind,'transitivity');
 assert.equal(p.construction.questions[0].expected.choice,'yes');
 assert.equal(p.transferAssessed,false);
 const untouched=cp(m);untouched.offset='0';
 assert.equal(M.inspect(t,untouched).correct,true);
 assert.equal(proof(t,untouched),null);
});

test('a wrong order followed by clear and correct order keeps the original path',()=>{
 const t=at({sessionId:'indirectlength',index:0}),m=M.initial(t,314159);
 field(t,m,'offset','0');
 act(t,m,'order',0);act(t,m,'order',1);act(t,m,'order',2);
 assert.equal(M.inspect(t,m).correct,false);
 act(t,m,'clear');
 const byLength=t.items.map((x,i)=>[x.length,i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
 byLength.forEach(i=>act(t,m,'order',i));
 assert.equal(M.inspect(t,m).correct,true);
 const p=proof(t,m);assert.ok(p);
 assert.deepEqual(p.construction.orderedIndices,byLength);
 assert.equal(p.construction.clearedOrders.length,1);
 assert.deepEqual(p.construction.clearedOrders[0].previousOrder,[0,1,2]);
 assert.equal(p.construction.orderHistory.length,6);
});

test('native binding does not leak to associated lessons, stale context or old practice',()=>{
 for(const [sessionId,bridge] of Object.entries(BRIDGES)){
  for(const [index,t] of sessionTasks(sessionId).entries()){
   if(t.type==='x-m28-compare')
    assert.equal(compareBinding(t,{sessionId,index}),null,sessionId+':'+index);
  }
 }
 for(const s of specs){
  const t=at(s);
  for(const bad of [
   {sessionId:s.sessionId,index:-1},
   {sessionId:s.sessionId,index:s.index+0.1},
   {sessionId:s.sessionId,index:'0'},
   {sessionId:'__unknown__',index:s.index},
   null,[],{}
  ])assert.equal(compareBinding(t,bad),null);
  assert.equal(compareBinding({...t,items:[...t.items,{name:'injected',length:1}]},ctx(s)),null);
 }
});

test('strict replay rejects a grade-true near numeric claim and a silently altered snapshot',()=>{
 const t=at({sessionId:'compareheight',index:2}),m=M.example(t);
 assert.ok(proof(t,m));
 m.answers[0]='2.00000001';
 assert.equal(M.inspect(t,m).correct,true);
 assert.equal(proof(t,m),null);
 const orig=M.example(t);
 for(const change of [
  x=>x.offset='3',
  x=>x.measure='2',
  x=>x.unit='cm',
  x=>x.issue='manufactured',
  x=>x.board.first.choice='fabricated',
  x=>x.board.offset=2,
  x=>x.history[0].f.offset='wrong',
  x=>x.history[0].d.index='1',
  x=>x.history[0].f.other='forged',
  x=>x.history.push({a:'help',d:{},f:{}}),
  x=>x.history.push({a:'copy',d:{index:'0'},f:{}}),
  x=>x.history.push({a:'mark',d:{index:'0'},f:{}}),
  x=>x.seed=0
 ]){
  const bad=cp(orig);change(bad);
  assert.equal(proof(t,bad),null,JSON.stringify(bad).slice(0,140));
 }
});

test('original UI is still the source of visible operations and answer fields',()=>{
 for(const s of specs){
  const t=at(s),html=V.controls(t,M.initial(t,314159));
  if(t.mode==='indirect')assert.match(html,/m28-copy/);
  else assert.match(html,/data-xfield="offset"/);
  if(t.mode==='order')assert.match(html,/m28-clear/);
  else assert.match(html,/m28-choice/);
  assert.match(html,/m28-controls/);
 }
});

test('the original grader and state shape are not changed for inspected tasks',()=>{
 for(const s of specs){
  const t=at(s),model=M.example(t),saved=cp(model);
  assert.ok(proof(t,model));assert.deepEqual(model,saved);
  assert.ok(M.valid(t,model));
  assert.ok(M.inspect(t,model).correct);
  assert.equal(M.initial(t,314159).history.length,0);
  assert.equal(proof(t,M.initial(t,314159)),null);
 }
});
