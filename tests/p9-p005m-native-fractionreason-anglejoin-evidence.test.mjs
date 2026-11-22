// #342 P005m source-locked two-task B16 triangle-angle join contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b16-model.js';
import {angleJoinBinding,replayAngleJoinEvidence,submittedAngleJoinEvidence}
 from '../dist/learning/p005m-native-fractionreason-anglejoin-evidence.js';
const CASES=[
 {id:'fractionreason',index:2,node:'mt_2ESZh70NyS',angles:[45,90,45],
  sha:'87348811a8a2af3a10b9f4e29d1f56ffe13d6ebc0c4b259326cf5ec3a951ab70'},
 {id:'fractionreason',index:3,node:'mt_2ESZh70NyS',angles:[30,60,90],
  sha:'7d32137f7f140f8fabaa1d8e07c2ae0a8a6a7c60933566b300a5beb3100506e8'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const context=c=>({sessionId:c.id,index:c.index});
function make(t,order=[0,1,2]){
 const m=native.initial(t),position=new Map();
 let start=0;
 for(const index of order){position.set(index,start);start+=t.angles[index];}
 for(const index of order){
  native.act(t,m,'b16-angle',{index});
  m.rotation=String(position.get(index));
  native.act(t,m,'b16-rotate-place');
 }
 for(const value of ['original','together','straight'])
  native.act(t,m,'b16-chain',{value});
 m.answer='180';return m;
}
function change(model,fn){const m=structuredClone(model);fn(m);return m;}
test('two original B16 native tasks, exact full SHA, source and independent Euclidean sum',()=>{
 for(const c of CASES){
  const t=sessionTaskFor(c.id,c.index),ctx=context(c);
  console.log('P005M_NATIVE_FULL_TASK_SHA256 '+c.id+':'+c.index+' '+digest(t));
  assert.equal(digest(t),c.sha);assert.equal(LESSONS[c.id].topicId,c.node);
  assert.equal(t.type,'x-anglejoin');assert.deepEqual(t.angles,c.angles);
  assert.equal(angleJoinBinding(t,ctx)?.nodeId,c.node);
  const m=make(t);assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  const p=replayAngleJoinEvidence(t,m,ctx);
  assert.ok(p,c.id+':'+c.index);assert.equal(p.unbrokenHalfTurnVerified,true);
  assert.deepEqual(p.originalAnglePickOrder,[0,1,2]);
  assert.equal(p.independentTriangleSumDegrees,180);
  assert.equal(p.verbalProofAssessed,false);assert.equal(p.strictAApproved,false);
 }
});
test('wrong to corrected latest original Check, source isolation and task tampering',()=>{
 for(const c of CASES){
  const t=sessionTaskFor(c.id,c.index),good=make(t),wrong=change(good,m=>m.answer='90'),ctx=context(c);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replayAngleJoinEvidence(t,wrong,ctx),null);
  const record={attempts:[{value:wrong},{value:structuredClone(good)}]};
  assert.ok(submittedAngleJoinEvidence(t,good,record,ctx));
  assert.equal(submittedAngleJoinEvidence(t,good,{attempts:[{value:wrong}]},ctx),null);
  assert.equal(submittedAngleJoinEvidence(t,wrong,record,ctx),null);
  assert.equal(submittedAngleJoinEvidence(t,good,{attempts:[]},ctx),null);
  assert.equal(replayAngleJoinEvidence(t,good,{sessionId:c.id,index:1}),null);
  assert.equal(replayAngleJoinEvidence(t,good,{sessionId:'bridge-fractionreason',index:c.index}),null);
  assert.equal(replayAngleJoinEvidence({...t,angles:[60,60,60]},good,ctx),null);
  assert.equal(replayAngleJoinEvidence({...t,prompt:t.prompt+'伪'},good,ctx),null);
  assert.equal(replayAngleJoinEvidence({...t,extra:1},good,ctx),null);
  assert.equal(replayAngleJoinEvidence(t,change(good,m=>m.answer='0180'),ctx),null);
 }
});
test('reject fake, missing, repeated, misordered, stale, malformed and nongeometric histories',()=>{
 for(const c of CASES){
  const t=sessionTaskFor(c.id,c.index),ctx=context(c),good=make(t);
  const rejects=[
   m=>m.history.pop(),m=>m.history[0].action='chain',
   m=>m.history[0].data.index='00',m=>m.history[0].data.index='7',
   m=>m.history[0].data.fields.fake='x',
   m=>m.history[1].data.fields.rotation='15',
   m=>m.history[1].data.fields.rotation='000',
   m=>m.history[2].data.index='0',
   m=>m.history[6].data.value='straight',
   m=>m.history[6].data.fields.answer='180',
   m=>m.history[6].data.extra='hidden',
   m=>m.board.placed[1].start=0,
   m=>m.board.placed.pop(),
   m=>m.board.chain=['straight','together','original'],
   m=>m.board.taken=[1,0,2],
   m=>m.board.selected=0,m=>m.rotation='0',
   m=>m.issue='unresolved',m=>m.prose='I proved a theorem',
   m=>m.hidden=true
  ];
  for(const fn of rejects)assert.equal(replayAngleJoinEvidence(t,change(good,fn),ctx),null);
  const reversed=make(t,[2,1,0]);
  // Other actual pick orders are allowed when sectors cover a proper half-turn.
  assert.ok(replayAngleJoinEvidence(t,reversed,ctx));
  const bad=make(t);
  bad.history[3].data.fields.rotation='90';
  assert.equal(replayAngleJoinEvidence(t,bad,ctx),null);
 }
});
