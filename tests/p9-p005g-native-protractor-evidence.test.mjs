// #342 P005g: original native protractor positions; exact task and adversarial Node replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {protractorBinding as binding,replayProtractorEvidence as replay,
 submittedProtractorEvidence as submitted}
 from '../dist/learning/p005g-native-protractor-evidence.js';
const CASES=[
 {id:'angleprotractor',index:0,node:'mt_4MFUAsbx_6',mode:'measure',
  amount:47,sha:'107b5a8506ea58a40654d33f663faf8cc36d1060cbf5e3b6c890c95801bb126a'},
 {id:'angleprotractor',index:1,node:'mt_4MFUAsbx_6',mode:'draw',
  amount:135,sha:'b59a56720e76b1c137285af1f28c5a39215295ffe87712266a187c8d98fedc42'},
 {id:'angleprotractor',index:2,node:'mt_4MFUAsbx_6',mode:'measure',
  amount:130,sha:'38f731b2d957fd5a6bd7befea7ba52703a90d8ebe014cfaec13f0a82ed75440d'}
];
const ctx=s=>({sessionId:s.id,index:s.index});
const task=s=>sessionTaskFor(s.id,s.index);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
function align(t,m){
 native.act(t,m,'g25-move',{index:'right'});
 native.act(t,m,'g25-move',{index:'right'});
 native.act(t,m,'g25-move',{index:'up'});
 native.act(t,m,'g25-flip');
}
function make(s,{wrong=false,drawCorrection=false}={}){
 const t=task(s),m=native.initial(t,314159);
 align(t,m);
 if(s.mode==='draw'){
  if(drawCorrection){m.angle='50';native.act(t,m,'g25-draw');}
  m.angle=String(wrong?50:s.amount);native.act(t,m,'g25-draw');
 }else if(wrong)m.answers[0]='50';
 t.questions.forEach((q,i)=>{
  if(!wrong||i!==0)m.answers[i]=String(q.value);
 });
 return m;
}
const tamper=(m,cb)=>{const x=structuredClone(m);cb(x);return x;};
test('P005g original source, task SHA and independent protractor alignment',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s,{drawCorrection:s.mode==='draw'});
  console.log('P005G_NATIVE_FULL_TASK_SHA256 '+s.id+':'+s.index+' '+hash(t));
  assert.equal(hash(t),s.sha);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(t.type,'x-g25-protractor');
  assert.equal(t.mode,s.mode);
  assert.equal(t.amount,s.amount);
  assert.equal(binding(t,ctx(s))?.nodeId,s.node);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  const p=replay(t,m,ctx(s));
  assert.ok(p,'exact original replay exists');
  assert.equal(p.targetDegrees,s.amount);
  assert.equal(p.independentlyObservedDegrees,s.amount);
  assert.deepEqual(p.alignedCenter,[0,0]);
  assert.equal(p.zeroLineRotationDegrees,0);
  assert.equal(p.originalControlEvents.length,s.mode==='draw'?6:4);
  assert.equal(p.drawCorrectionObserved,s.mode==='draw');
  assert.equal(p.strictAApproved,false);
  assert.equal(p.physicalProtractorAssessed,false);
 }
});
test('P005g last Check, wrong answer, original draw correction and no invented controls',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),w=make(s,{wrong:true});
  assert.equal(native.inspect(t,w).correct,false);
  assert.equal(replay(t,w,ctx(s)),null);
  assert.ok(submitted(t,m,{attempts:[{value:w},{value:structuredClone(m)}]},ctx(s)));
  assert.equal(submitted(t,m,{attempts:[{value:w}]},ctx(s)),null);
  assert.equal(submitted(t,m,{attempts:[]},ctx(s)),null);
  assert.equal(submitted(t,w,{attempts:[{value:m}]},ctx(s)),null);
  assert.equal(replay(t,native.initial(t,314159),ctx(s)),null);
  if(s.mode==='draw'){
   const corrected=make(s,{drawCorrection:true});
   assert.ok(replay(t,corrected,ctx(s))?.drawCorrectionObserved);
  }
 }
});
test('P005g rejects replay tampering, forged source, ineffective controls and stale data',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),c=ctx(s);
  assert.equal(replay(t,tamper(m,x=>x.history.splice(0,1)),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].d.index='left'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history.push({a:'move',f:{},d:{index:'left'}})),c),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].d.index='invalid'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.x=20),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.rotation=180),c),null);
  assert.equal(replay(t,tamper(m,x=>x.board.first.move={angle:'20'}),c),null);
  assert.equal(replay(t,tamper(m,x=>x.issue='not-clear'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.answers[0]='0'),c),null);
  assert.equal(replay(t,tamper(m,x=>x.length='2'),c),null);
  if(s.mode==='draw'){
   assert.equal(replay(t,tamper(m,x=>x.history.at(-1).f.angle='0135'),c),null);
   assert.equal(replay(t,tamper(m,x=>x.board.drawn=50),c),null);
  }
  assert.equal(replay({...t,prompt:t.prompt+'?'},m,c),null);
  assert.equal(replay({...t,amount:t.amount+1},m,c),null);
  assert.equal(replay({...t,questions:[{label:'fake',value:1}]},m,c),null);
  assert.equal(replay(t,m,{sessionId:s.id,index:String(s.index)}),null);
  assert.equal(replay(t,m,{sessionId:s.id,index:999}),null);
  assert.equal(replay(t,m,{sessionId:'angleestimate',index:s.index}),null);
 }
});
