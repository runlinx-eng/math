import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b08-model.js';
import {positiveOrderPreauditBinding,replayPositiveOrderPreaudit} from '../dist/learning/positive-order-preaudit.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
const copy=structuredClone;
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=t=>digest(JSON.stringify(stable(t)));
const native=[
 ['bigcompare',2,'mt_MHaiUd2FLA','3af8e623611e2f89e1e0aa354e1f023203a77fd200f5ceee9381967878a05639'],
 ['sixdigits',2,'mt_JwP9QFv6gQ','15c65015c8abb99241d30bb8ffff1bf16ea6ba529c114a612ffd664acce484ea'],
 ['millionwords',1,'mt_Gag_h98jWP','f4b80d951ea72967caa1de4041a4aa113cd4d7d1d69d56ab59fb6ecbb1278e38']
];
const tFor=([id,index])=>sessionTasks(id)[index];
const context=([id,index])=>({sessionId:id,index});
function build(c){
 const task=tFor(c),m=M.initial(task);
 const expected=task.values.map((v,i)=>({n:BigInt(v),i})).sort((a,b)=>a.n<b.n?-1:a.n>b.n?1:0).map(x=>x.i);
 for(const i of expected)M.act(task,m,'wide-order',{index:i});
 for(let i=0;i<task.values.length;i++){m.positions[i]=Math.round((Number(task.values[i])-task.min)/(task.max-task.min)*1000);M.field(task,m,'positions.'+i);}
 return {task,m,record:{attempts:[{value:copy(m)}]},expected};
}
const replay=(c,m,record)=>replayPositiveOrderPreaudit(tFor(c),m,record,context(c));
test('source/task fingerprints and exact native admission; no formal A registration',()=>{
 for(const c of native){
  const task=tFor(c),binding=positiveOrderPreauditBinding(task,context(c));
  assert.equal(LESSONS[c[0]].topicId,c[2]);
  assert.equal(hash(task),c[3]);
  assert.equal(binding?.strictAApproved,false);
  assert.equal(EVIDENCE_ADAPTERS.some(a=>a.binding(task,context(c))),false);
  assert.equal(thinkingGuide(task,context(c)),null);
  assert.equal(positiveOrderPreauditBinding({...task,prompt:task.prompt+' altered'},context(c)),null);
  assert.equal(positiveOrderPreauditBinding(task,{sessionId:c[0],index:99}),null);
  assert.equal(positiveOrderPreauditBinding(task,{sessionId:c[0],index:String(c[1])}),null);
 }
});
test('actual pick/remove/re-pick chrono, numerical order and final axis invariant',()=>{
 for(const c of native){
  const {task,m,expected}=build(c);
  assert.equal(M.inspect(task,m).correct,true); // Baseline before deliberately wrong reorder.
  const move=expected[1];M.act(task,m,'wide-order',{index:move});M.act(task,m,'wide-order',{index:move});
  // re-select is appended last; so this corrected sequence must not pass.
  assert.equal(M.inspect(task,m).correct,false);
  M.act(task,m,'wide-order',{index:move}); // undo last, current remaining cards
  assert.equal(m.order.length,expected.length-1);
  // Rebuild correct via real clicking (first clear, then reselect in sorted order).
  for(const i of [...m.order])M.act(task,m,'wide-order',{index:i});
  for(const i of expected)M.act(task,m,'wide-order',{index:i});
  assert.equal(M.valid(task,m),true);
  assert.equal(M.inspect(task,m).correct,true);
  const record={attempts:[{value:copy(m)}]},before=JSON.stringify(m);
  const evidence=replay(c,m,record);
  assert.ok(evidence);
  assert.equal(evidence.strictAApproved,false);
  assert.equal(evidence.events.length,m.orderTrace.length);
  assert.equal(evidence.sliderMotionHistoryObserved,false);
  assert.deepEqual(evidence.selectedOrder,expected.map(i=>task.values[i]));
  assert.equal(JSON.stringify(m),before);
 }
});
test('reject forgery, stale latest Check, no trace, wrong signed/source and truncation',()=>{
 for(const c of native){
  const {task,m,record}=build(c);
  assert.ok(replay(c,m,record));
  const altered=copy(m);altered.orderTrace[0].index=999;
  assert.equal(replay(c,altered,{attempts:[{value:copy(altered)}]}),null);
  const changedKind=copy(m);changedKind.orderTrace[0].kind='remove';
  assert.equal(replay(c,changedKind,{attempts:[{value:copy(changedKind)}]}),null);
  const missing=copy(m);missing.orderTrace=[];
  assert.equal(replay(c,missing,{attempts:[{value:copy(missing)}]}),null);
  const overflow=copy(m);overflow.orderTraceOverflow=true;
  assert.equal(replay(c,overflow,{attempts:[{value:copy(overflow)}]}),null);
  const stale=copy(record);stale.attempts[0].value.order=[];
  assert.equal(replay(c,m,stale),null);
  const missingPoint=copy(m);missingPoint.touched[0]=false;
  assert.equal(replay(c,missingPoint,{attempts:[{value:copy(missingPoint)}]}),null);
  const generated=M.example(task);
  assert.equal(M.inspect(task,generated).correct,true);
  assert.equal(replay(c,generated,{attempts:[{value:copy(generated)}]}),null); // Terminal state is not click evidence.
  const old=copy(m);delete old.orderTrace;delete old.orderTraceOverflow;
  assert.equal(M.valid(task,old),true); // State-v2 backward compatibility
  assert.equal(M.inspect(task,old).correct,true); // original grading unchanged
  assert.equal(replay(c,old,{attempts:[{value:copy(old)}]}),null);
 }
 assert.equal(positiveOrderPreauditBinding(tFor(native[0]),{sessionId:'tenmillion',index:1}),null);
});
