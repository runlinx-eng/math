// #342 P005d: independent native B25 vertex-angle checks across four distinct lesson sources.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {vertexAngleBinding as binding,replayVertexAngleEvidence as replay,
 submittedVertexAngleEvidence as submitted} from '../dist/learning/p005d-cross-source-vertex-angle-evidence.js';

const CASES=[
 {id:'anglecorner',index:2,node:'mt_8OAGVdeTJ_',sha:'732d4288b4601c08cca221c8c35d13ebf080c2326d7a579f4b1cc0689087c5b8',
  kind:'right',expected:[0,1,2,3],wrong:0,answer:'4'},
 {id:'rightcheck',index:1,node:'mt_MFfYcnv6Tv',sha:'0b936ffb21588a5f4b82cc6ee2f55796f509456cec2613e773131a1803e59979',
  kind:'right',expected:[0,1,2,3],wrong:0,answer:'4'},
 {id:'linemark',index:2,node:'mt_QysgF57dxh',sha:'31fcde19c84f05c03b7e4629201d21e2ba1cfdeb4e0562053d3810e62e06d8db',
  kind:'obtuse',expected:[2],wrong:0,answer:'meeting'},
 {id:'linenotation',index:0,node:'mt_e4V6hvcuEJ',sha:'6e14b21b9bafdff25c2a163736fa1886d477ff10122c8f64ad816621a2773ab0',
  kind:'right',expected:[0,1,2,3],wrong:0,answer:'right'}
];
const context=s=>({sessionId:s.id,index:s.index});
const task=s=>sessionTaskFor(s.id,s.index);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const make=(s,indices=s.expected)=>{
 const t=task(s),m=native.initial(t,314159);
 for(const i of indices)native.act(t,m,'g25-choose',{index:i});
 m.answers[0]=s.answer;return m;
};
const tamper=(m,change)=>{const x=structuredClone(m);change(x);return x;};

test('P005d four registered original lessons, locked sources, complete task hashes',()=>{
 for(const s of CASES){
  const t=task(s),h=hash(t);
  console.log('P005D_NATIVE_FULL_TASK_SHA256 '+s.id+':'+s.index+' '+h);
  assert.equal(h,s.sha);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(t.type,'x-g25-vertices');
  assert.equal(t.kind,s.kind);
  assert.equal(String(t.questions[0].value),s.answer);
  assert.equal(binding(t,context(s))?.nodeId,s.node);
  assert.equal(native.valid(t,native.initial(t,314159)),true);
 }
});
test('P005d independent atan2 interior angle geometry across sources',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),proof=replay(t,m,context(s));
  assert.equal(native.inspect(t,m).correct,true);
  assert.ok(proof,s.id);
  assert.equal(proof.kind,'native-polygon-interior-angle-classification');
  assert.equal(proof.nodeId,s.node);
  assert.deepEqual(proof.selectedVertexIndices,s.expected);
  const angleSum=proof.measuredInteriorDegrees.reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(angleSum-(t.points.length-2)*180)<1e-7);
  assert.equal(proof.originalControlEvents.length,s.expected.length);
  assert.ok(proof.independentClassification.filter(k=>k===s.kind).length===s.expected.length);
  assert.equal(proof.strictAApproved,false);
  assert.equal(proof.generalMasteryAssessed,false);
 }
});
test('P005d original wrong-to-correct toggle and latest Check',()=>{
 for(const s of CASES){
  const t=task(s),wrong=make(s,[s.wrong]);
  assert.equal(native.inspect(t,wrong).correct,false,s.id);
  assert.equal(replay(t,wrong,context(s)),null);
  const m=structuredClone(wrong);
  native.act(t,m,'g25-choose',{index:s.wrong});
  for(const i of s.expected)native.act(t,m,'g25-choose',{index:i});
  assert.equal(native.inspect(t,m).correct,true);
  const proof=replay(t,m,context(s));
  assert.ok(proof,s.id);
  assert.equal(proof.correctionObserved,true);
  assert.ok(proof.originalControlEvents.some(e=>e.action==='unchoose'));
  assert.ok(submitted(t,m,{attempts:[{value:wrong},{value:structuredClone(m)}]},context(s)));
  assert.equal(submitted(t,m,{attempts:[{value:wrong}]},context(s)),null);
  assert.equal(submitted(t,m,{attempts:[]},context(s)),null);
 }
});
test('P005d malformed event history, forged source, swapped lesson and stale board fail closed',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s);
  assert.equal(replay(t,tamper(m,x=>{x.history=[];}),context(s)),null);
  assert.equal(replay(t,tamper(m,x=>{x.history[0].d.index='00';}),context(s)),null);
  assert.equal(replay(t,tamper(m,x=>{x.board.selected=[];}),context(s)),null);
  assert.equal(replay(t,tamper(m,x=>{x.board.first={};}),context(s)),null);
  assert.equal(replay(t,tamper(m,x=>{x.history.push({a:'reset',f:{},d:{}});}),context(s)),null);
  assert.equal(replay(t,tamper(m,x=>{x.answers[0]='wrong';}),context(s)),null);
  assert.equal(replay(t,tamper(m,x=>{x.issue='forged';}),context(s)),null);
  assert.equal(replay({...t,prompt:t.prompt+'?'},m,context(s)),null);
  assert.equal(replay({...t,points:t.points.map(p=>[...p]).reverse()},m,context(s)),null);
  assert.equal(replay({...t,kind:t.kind==='right'?'acute':'right'},m,context(s)),null);
  assert.equal(replay({...t,questions:[{label:'tampered',value:s.answer}]},m,context(s)),null);
  assert.equal(replay(t,m,{sessionId:s.id,index:String(s.index)}),null);
  for(const other of CASES.filter(x=>x.id!==s.id)){
   assert.equal(replay(t,m,context(other)),null);
  }
 }
});
