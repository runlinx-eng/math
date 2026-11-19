import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as M from '../dist/learning/phase5/b28-model.js';
import * as V from '../dist/learning/phase5/b28-view.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTaskFor,sessionTasks} from '../dist/learning/bridges.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import compareFixture from './fixtures/p9-compare-cases.cjs';
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

test('eleven frozen original length values, answers and sorted orders have exact source meaning',()=>{
 const source=compareFixture.cases;
 assert.equal(source.length,11);
 assert.equal(new Set(source.map(x=>x.id+':'+x.index)).size,11);
 for(const row of source){
  const s={sessionId:row.id,index:row.index},task=at(s),model=M.example(task);
  const p=proof(task,model),b=compareBinding(task,ctx(s));
  assert.ok(p&&b,row.id+':'+row.index);
  assert.equal(b.nodeId,row.nodeId);
  assert.equal(LESSONS[row.id].topicId,row.nodeId);
  assert.equal(task.mode||'compare',row.mode);
  assert.deepEqual(task.items.map(x=>x.length),row.lengths);
  assert.equal(task.want,row.want);
  assert.deepEqual(task.questions.map(q=>String(q.value)),row.answers);
  assert.equal(p.construction.lengthDifference,String(row.difference));
  assert.equal(Math.max(...row.lengths)-Math.min(...row.lengths),row.difference);
  if(row.mode==='order')assert.deepEqual(p.construction.orderedIndices,row.sorted);
  assert.deepEqual(row.sorted.map(index=>row.lengths[index]),
    [...row.lengths].sort((a,b)=>a-b));
 }
});

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
  const relations=p.construction.suppliedPairwiseRelations;
  assert.equal(relations.length,t.items.length*(t.items.length-1)/2);
  for(const r of relations){
   const difference=t.items[r.firstIndex].length-t.items[r.secondIndex].length;
   assert.equal(r.signedDifference,String(difference));
   assert.equal(r.relation,difference>0?'>':difference<0?'<':'=');
   assert.ok(r.firstIndex<r.secondIndex);
  }
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

test('exactly seven cross-course linked comparisons stay nonnative',()=>{
 const reviewedAssociated={
  'link-attributes-compareheight':[1],
  'link-compareheight-indirectlength':[0,1],
  'link-compareheight-lengthstart':[0],
  'link-lengthdifference-lengthstory':[0],
  'link-lengthtools-lengthdifference':[1],
  'link-ordermeasure-measurecalc':[0]
 };
 const list=Object.entries(reviewedAssociated).flatMap(([sessionId,indices])=>
  indices.map(index=>({sessionId,index})));
 assert.equal(list.length,7);
 for(const s of list){
  const task=at(s);
  assert.equal(task.type,'x-m28-compare',s.sessionId+':'+s.index);
  assert.equal(compareBinding(task,ctx(s)),null);
  // A reused task may have a plausible example, but it is not a new native A.
  assert.equal(M.inspect(task,M.example(task)).correct,true);
 }
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


test('visible duplicate copies and repeated sort clicks preserve no-op event history',()=>{
 const indirect=at({sessionId:'indirectlength',index:1}),recorded=M.example(indirect);
 assert.ok(proof(indirect,recorded));
 act(indirect,recorded,'copy',0);
 const recordedProof=proof(indirect,recorded);assert.ok(recordedProof);
 assert.equal(recordedProof.construction.copyHistory.at(-1).item,0);
 assert.equal(recordedProof.construction.copyHistory.at(-1).recorded,false);
 assert.equal(recordedProof.events.at(-1).action,'copy');
 const ordered=at({sessionId:'indirectlength',index:0}),sorted=M.example(ordered);
 const repeatedIndex=sorted.board.order[0];
 act(ordered,sorted,'order',repeatedIndex);
 const sortedProof=proof(ordered,sorted);assert.ok(sortedProof);
 assert.equal(sortedProof.construction.orderHistory.at(-1).item,repeatedIndex);
 assert.equal(sortedProof.construction.orderHistory.at(-1).appended,false);
 assert.equal(sortedProof.events.at(-1).action,'order');
});

test('a correct old grade cannot authorize invisible cross-mode controls',()=>{
 const hidden=[
  {sessionId:'compareheight',index:0,action:'clear'},
  {sessionId:'indirectlength',index:0,action:'copy',value:0},
  {sessionId:'indirectlength',index:1,action:'align'},
  {sessionId:'indirectlength',index:1,action:'order',value:0},
 ];
 for(const s of hidden){
  const t=at(s),m=M.example(t);
  assert.ok(proof(t,m));
  act(t,m,s.action,s.value);
  assert.ok(M.valid(t,m),s.sessionId+':'+s.action+' old model accepts event');
  assert.equal(M.inspect(t,m).correct,true);
  assert.equal(proof(t,m),null,s.sessionId+':'+s.action+' is not a visible action');
 }
});

test('every original comparison keeps real attempts and exact proof across unchanged V2 backup',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
 for(const s of specs){
  const task=at(s),model=M.example(task),lesson=State.freshLesson(s.sessionId);
  lesson.index=s.index;lesson.view='task';lesson.models[s.index]=cp(model);
  State.submitLesson(lesson);
  assert.deepEqual(lesson.cases[s.index].attempts.at(-1).value,model);
  const state=Core.fresh();state.lessons[s.sessionId]=lesson;
  assert.deepEqual(Core.validate(cp(state),atlas),state);
  const payload=JSON.stringify({app:'math-explorer',version:2,state});
  const imported=Core.parseBackup(payload,atlas);
  assert.deepEqual(imported,state);
  assert.ok(proof(task,imported.lessons[s.sessionId].models[s.index]));
  const originalBytes=JSON.stringify(state),saved=new Map();
  const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
  Storage.writeStored(Core.KEY,originalBytes,storage);
  assert.equal(Storage.readStored(Core.KEY,storage),originalBytes);
 }
});


test('final comparison must follow the observable reference, not precede it',()=>{
 for(const s of [{sessionId:'compareheight',index:0},{sessionId:'indirectlength',index:1}]){
  const task=at(s),model=M.initial(task,314159);
  act(task,model,'choice',task.want);
  if(task.mode==='indirect')task.items.forEach((_,i)=>act(task,model,'copy',i));
  else field(task,model,'offset','0');
  answer(task,model);
  assert.equal(M.valid(task,model),true,s.sessionId+' original state remains valid');
  assert.equal(M.inspect(task,model).correct,true,s.sessionId+' original grader remains unchanged');
  assert.equal(proof(task,model),null,
   s.sessionId+' final comparison must follow the observable reference');
  act(task,model,'choice',task.want);
  const evidence=proof(task,model);
  assert.ok(evidence,s.sessionId+' an actual later comparison restores strict evidence');
  assert.equal(evidence.construction.choiceHistory.length,2);
  assert.equal(evidence.independentStrategyAssessed,false);
 }
});
