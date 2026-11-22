// #342 P005e: native cross-source directed openings, original events and SHA locks.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {directedAngleBinding as binding,replayDirectedAngleEvidence as replay,
 submittedDirectedAngleEvidence as submitted}
 from '../dist/learning/p005e-directed-angle-classification-evidence.js';

const CASES=[
 {id:'rightcheck',index:0,node:'mt_MFfYcnv6Tv',
  sha:'09beb6f706b5d3ed887b4002c1fbe8b01f0baa34252d1beb3545e6a3537b3faa',
  kind:'right',angles:[50,90,130],expected:[1],answer:'90',classes:['acute','right','obtuse']},
 {id:'anglestraight',index:1,node:'mt_LBT-9jz7kR',
  sha:'8f6bc73d9e3bf01ece867b47a886b45e84a9de11e58b38e18785e971e8e227ce',
  kind:'reflex',angles:[45,90,180,270],expected:[3],answer:'reflex',
  classes:['acute','right','straight','reflex']}
];
const ctx=s=>({sessionId:s.id,index:s.index});
const task=s=>sessionTaskFor(s.id,s.index);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
  .map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
function make(s,correct=true){
 const t=task(s),m=native.initial(t,314159);
 for(let i=0;i<s.angles.length;i++)native.act(t,m,'g25-test',{index:i});
 native.act(t,m,'g25-choose',{index:0});
 if(correct){
  native.act(t,m,'g25-choose',{index:0});
  for(const i of s.expected)native.act(t,m,'g25-choose',{index:i});
 }
 m.answers[0]=s.answer;return m;
}
const tamper=(m,change)=>{const x=structuredClone(m);change(x);return x;};

test('P005e exact registered source, task SHA and independent directed-angle geometry',()=>{
 for(const s of CASES){
  const t=task(s);
  console.log('P005E_NATIVE_FULL_TASK_SHA256 '+s.id+':'+s.index+' '+hash(t));
  assert.equal(hash(t),s.sha);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(t.type,'x-g25-compare');
  assert.deepEqual(t.angles,s.angles);
  assert.equal(t.kind,s.kind);
  assert.equal(t.requireTest,true);
  assert.equal(binding(t,ctx(s))?.nodeId,s.node);
  const m=make(s);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  const p=replay(t,m,ctx(s));
  assert.ok(p);
  assert.deepEqual(p.selectedOriginalIndices,s.expected);
  assert.deepEqual(p.independentClassification,s.classes);
  p.measuredDirectedDegrees.forEach((v,i)=>assert.ok(Math.abs(v-s.angles[i])<1e-8));
  assert.equal(p.correctionObserved,true);
  assert.equal(p.strictAApproved,false);
  assert.equal(p.generalMasteryAssessed,false);
 }
});
test('P005e genuine wrong-to-correct controls and last original Check',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),wrong=make(s,false);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replay(t,wrong,ctx(s)),null);
  assert.ok(submitted(t,m,{attempts:[{value:wrong},{value:structuredClone(m)}]},ctx(s)));
  assert.equal(submitted(t,m,{attempts:[{value:wrong}]},ctx(s)),null);
  assert.equal(submitted(t,m,{attempts:[]},ctx(s)),null);
  assert.equal(submitted(t,wrong,{attempts:[{value:structuredClone(m)}]},ctx(s)),null);
 }
});
test('P005e refuse untested actions, forged history/board, stale answers and non-native source',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),c=ctx(s);
  assert.equal(replay(t,tamper(m,x=>x.history.splice(1,1)),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].d.index='00'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].a='record'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history.push({a:'record',f:{},d:{}})),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history.push({...x.history[0]})),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.tested=[]),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.selected=[]),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.last=null),c),null);
  assert.equal(replay(t,tamper(m,x=>x.answers[0]='wrong'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.issue='fake'),c),null);
  assert.equal(replay({...t,prompt:t.prompt+'?'},m,c),null);
  assert.equal(replay({...t,angles:t.angles.map(x=>x+1)},m,c),null);
  assert.equal(replay({...t,kind:'acute'},m,c),null);
  assert.equal(replay({...t,questions:[{label:'fake',value:1}]},m,c),null);
  if(t.lengths)assert.equal(replay({...t,lengths:[1,1,1]},m,c),null);
  assert.equal(replay(t,m,{sessionId:s.id,index:String(s.index)}),null);
  for(const other of CASES.filter(x=>x.id!==s.id))
   assert.equal(replay(t,m,ctx(other)),null);
 }
});
