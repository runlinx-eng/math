// #342 P005f: two native estimate/reveal positions, exact task identities and adversarial replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {angleEstimateBinding as binding,replayAngleEstimateEvidence as replay,
 submittedAngleEstimateEvidence as submitted}
 from '../dist/learning/p005f-native-angle-estimates-evidence.js';

const CASES=[
 {id:'angleestimate',index:0,node:'mt_YUJ5pwalqL',
  sha:'2e95b28676442bc8fc86c1bdfdeec5cfb3cff4d88efa1c546acbf6dfa3e06e35',
  amount:130,tolerance:15,className:'obtuse',answer:'more',bad:70},
 {id:'angleestimate',index:1,node:'mt_YUJ5pwalqL',
  sha:'0747b513cf0a1b47fa7287c24c8f1124fad9decd5264b49ac198cc44d8c24b6d',
  amount:270,tolerance:20,className:'reflex',answer:'reflex',bad:90}
];
const ctx=s=>({sessionId:s.id,index:s.index});
const task=s=>sessionTaskFor(s.id,s.index);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
  .map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
function guess(t,m,value){
 m.angle=String(value);native.act(t,m,'g25-guess');native.act(t,m,'g25-reveal');
}
function make(s,correct=true){
 const t=task(s),m=native.initial(t,314159);
 guess(t,m,s.bad);
 if(correct)guess(t,m,s.amount);
 m.answers[0]=s.answer;
 return m;
}
const tamper=(m,change)=>{const x=structuredClone(m);change(x);return x;};

test('P005f native registered node and full SHA, independent directed screen angle',()=>{
 for(const s of CASES){
  const t=task(s);
  console.log('P005F_NATIVE_FULL_TASK_SHA256 '+s.id+':'+s.index+' '+hash(t));
  assert.equal(hash(t),s.sha);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(t.type,'x-g25-estimate');
  assert.equal(t.amount,s.amount);
  assert.equal(t.tolerance,s.tolerance);
  assert.equal(binding(t,ctx(s))?.nodeId,s.node);
  const m=make(s);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  const p=replay(t,m,ctx(s));
  assert.ok(p);
  assert.equal(p.measuredDirectedDegrees,s.amount);
  assert.equal(p.independentClass,s.className);
  assert.equal(p.estimateDegrees,s.amount);
  assert.equal(p.absoluteErrorDegrees,0);
  assert.equal(p.allowedErrorDegrees,s.tolerance);
  assert.equal(p.correctionObserved,true);
  assert.equal(p.initialMistakePersisted,true);
  assert.equal(p.strictAApproved,false);
  assert.equal(p.generalMasteryAssessed,false);
 }
});
test('P005f wrong-to-correct, fresh Check and initially-correct path',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),wrong=make(s,false);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replay(t,wrong,ctx(s)),null);
  assert.ok(submitted(t,m,{attempts:[{value:wrong},{value:structuredClone(m)}]},ctx(s)));
  assert.equal(submitted(t,m,{attempts:[{value:wrong}]},ctx(s)),null);
  assert.equal(submitted(t,m,{attempts:[]},ctx(s)),null);
  assert.equal(submitted(t,wrong,{attempts:[{value:m}]},ctx(s)),null);
  const fresh=native.initial(t,314159);
  guess(t,fresh,s.amount);fresh.answers[0]=s.answer;
  assert.equal(native.inspect(t,fresh).correct,true);
  assert.ok(replay(t,fresh,ctx(s)));
  assert.equal(replay(t,fresh,ctx(s)).correctionObserved,false);
  assert.equal(replay(t,fresh,ctx(s)).initialMistakePersisted,false);
 }
});
test('P005f rejects forged history, ranges, board, source and stale answers',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),c=ctx(s);
  assert.equal(replay(t,tamper(m,x=>x.history.splice(1,1)),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].f.angle='070'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].a='record'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history.push({a:'reveal',f:{},d:{}})),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history.push({...x.history[0]})),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.guess=s.bad),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.revealed=false),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.first.guessValue=999),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.first.incorrectPrediction=false),c),null);
  assert.equal(replay(t,tamper(m,x=>x.angle='0'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.answers[0]='wrong'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.issue='fake'),c),null);
  assert.equal(replay({...t,prompt:t.prompt+'?'},m,c),null);
  assert.equal(replay({...t,amount:t.amount+1},m,c),null);
  assert.equal(replay({...t,tolerance:t.tolerance+1},m,c),null);
  assert.equal(replay({...t,questions:[{label:'fake',value:1}]},m,c),null);
  assert.equal(replay(t,m,{sessionId:s.id,index:String(s.index)}),null);
  assert.equal(replay(t,m,{sessionId:s.id,index:3}),null);
  assert.equal(replay(t,m,{sessionId:'angletypes',index:s.index}),null);
 }
});
