// #342 P005c: three original B25 angletypes vertex tasks, exact sources and negatives.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {vertexAngleBinding as binding,replayVertexAngleEvidence as replay,
 submittedVertexAngleEvidence as submitted}
 from '../dist/learning/p005c-native-vertex-angle-evidence.js';

const cases=[
 {index:2,sha:'fe8d25eebb372ca59917395fad7ad2c641ebeb9e66b59da04e536e11850ffd4c',
  kind:'obtuse',points:3,selected:[2],wrong:0,answer:'1'},
 {index:3,sha:'3e545f1207fd64dcee25f76cc7449116ba45995afd385738fec4c7fce527b140',
  kind:'acute',points:4,selected:[0,2],wrong:1,answer:'2'},
 {index:4,sha:'e2b698087a7edc69401092db6ff10b55938c9b49caedb5dfaed420bef75e96c6',
  kind:'obtuse',points:4,selected:[1,3],wrong:0,answer:'2'}
];
const context=i=>({sessionId:'angletypes',index:i});
const task=i=>sessionTaskFor('angletypes',i);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const model=(s,indices=s.selected)=>{
 const t=task(s.index),m=native.initial(t,314159);
 for(const i of indices)native.act(t,m,'g25-choose',{index:i});
 m.answers[0]=s.answer;return m;
};
const alter=(m,edit)=>{const x=structuredClone(m);edit(x);return x;};

test('P005c source-locked exact native runtime SHA256 and original controls',()=>{
 for(const s of cases){
  const t=task(s.index),sha=digest(t);
  console.log('P005C_NATIVE_FULL_TASK_SHA256 angletypes:'+s.index+' '+sha);
  assert.equal(sha,s.sha);
  assert.equal(t.type,'x-g25-vertices');
  assert.equal(t.kind,s.kind);
  assert.equal(t.points.length,s.points);
  assert.equal(t.questions[0].value,Number(s.answer));
  assert.equal(binding(t,context(s.index))?.nodeId,'mt_h0CVtqI2xo');
  assert.equal(native.valid(t,native.initial(t,314159)),true);
 }
});
test('P005c independent atan2 interiors identify triangle obtuse and rhombus alternate kinds',()=>{
 for(const s of cases){
  const t=task(s.index),m=model(s);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  const proof=replay(t,m,context(s.index));
  assert.ok(proof,'angletypes:'+s.index);
  assert.equal(proof.kind,'native-polygon-interior-angle-classification');
  assert.deepEqual(proof.selectedVertexIndices,s.selected);
  assert.deepEqual(proof.independentClassification,
   s.index===2?['acute','acute','obtuse']:
    ['acute','obtuse','acute','obtuse']);
  const sum=proof.measuredInteriorDegrees.reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(sum-(s.points-2)*180)<1e-8);
  assert.equal(proof.originalControlEvents.length,s.selected.length);
  assert.equal(proof.generalMasteryAssessed,false);
  assert.equal(proof.strictAApproved,false);
 }
});
test('P005c original wrong->correct toggle is real and independently replayed',()=>{
 for(const s of cases){
  const t=task(s.index),m=model(s,[s.wrong]);
  assert.equal(native.inspect(t,m).correct,false);
  assert.equal(replay(t,m,context(s.index)),null);
  native.act(t,m,'g25-choose',{index:s.wrong});
  for(const i of s.selected)native.act(t,m,'g25-choose',{index:i});
  assert.equal(native.inspect(t,m).correct,true);
  const proof=replay(t,m,context(s.index));
  assert.ok(proof);
  assert.equal(proof.correctionObserved,true);
  assert.ok(proof.originalControlEvents.some(e=>e.action==='unchoose'));
  assert.deepEqual(proof.selectedVertexIndices,s.selected);
 }
});
test('P005c rejects omitted, forged and tampered original control histories',()=>{
 for(const s of cases){
  const t=task(s.index),m=model(s);
  assert.equal(replay(t,native.initial(t,314159),context(s.index)),null);
  assert.equal(replay(t,alter(m,x=>{x.history=[];}),context(s.index)),null);
  assert.equal(replay(t,alter(m,x=>{x.history[0].d.index='00';}),context(s.index)),null);
  assert.equal(replay(t,alter(m,x=>{x.history[0].f.angle='90';}),context(s.index)),null);
  assert.equal(replay(t,alter(m,x=>{x.board.selected=[];}),context(s.index)),null);
  assert.equal(replay(t,alter(m,x=>{x.board.first={};}),context(s.index)),null);
  assert.equal(replay(t,alter(m,x=>{x.history.push({a:'reset',f:{},d:{}});}),context(s.index)),null);
  assert.equal(replay(t,alter(m,x=>{x.answers[0]='99';}),context(s.index)),null);
  assert.equal(replay(t,alter(m,x=>{x.issue='bad';}),context(s.index)),null);
  assert.equal(replay(t,model(s,[s.wrong]),context(s.index)),null);
 }
});
test('P005c rejects wrong source, cross-position swaps, shapes and question edits',()=>{
 for(const s of cases){
  const t=task(s.index),m=model(s),ctx=context(s.index);
  for(const other of cases.filter(x=>x.index!==s.index)){
   assert.equal(replay(t,m,context(other.index)),null);
  }
  assert.equal(replay(t,m,{sessionId:'angleparts',index:s.index}),null);
  assert.equal(replay(t,m,{sessionId:'angletypes',index:String(s.index)}),null);
  assert.equal(replay({...t,prompt:t.prompt+'?'},m,ctx),null);
  assert.equal(replay({...t,points:t.points.map(x=>[...x]).reverse()},m,ctx),null);
  assert.equal(replay({...t,kind:t.kind==='acute'?'obtuse':'acute'},m,ctx),null);
  assert.equal(replay({...t,questions:[{label:'其他题',value:Number(s.answer)}]},m,ctx),null);
 }
});
test('P005c latest Check must bind the same corrected native model',()=>{
 for(const s of cases){
  const t=task(s.index),m=model(s),wrong=model(s,[s.wrong]),ctx=context(s.index);
  assert.ok(submitted(t,m,{attempts:[{value:wrong},{value:structuredClone(m)}]},ctx));
  assert.equal(submitted(t,m,{attempts:[{value:wrong}]},ctx),null);
  assert.equal(submitted(t,m,{attempts:[]},ctx),null);
  assert.equal(submitted(t,m,{attempts:[{value:{}}]},ctx),null);
  assert.equal(submitted(t,m,{attempts:[{value:structuredClone(m)}]},context(1)),null);
 }
});
