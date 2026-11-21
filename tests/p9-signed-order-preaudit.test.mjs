import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b08-model.js';
import {signedOrderPreauditBinding,replaySignedOrderModel,replaySignedOrderPreaudit} from '../dist/learning/signed-order-preaudit.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';

await ensureB39Ready();
const context={sessionId:'tenmillion',index:1};
const task=sessionTasks(context.sessionId)[context.index];
const clone=structuredClone;
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const checked=m=>({attempts:[{value:clone(m)}]});
function make(){
 const m=M.initial(task);
 for(const index of [2,0,1])M.act(task,m,'wide-order',{index});
 for(let i=0;i<task.values.length;i++){
  m.positions[i]=Math.round((Number(task.values[i])-task.min)/(task.max-task.min)*1000);
  M.field(task,m,'positions.'+i);
 }
 return m;
}
const replay=m=>replaySignedOrderPreaudit(task,m,checked(m),context);

test('exact native signed source, stable task fingerprint, no production registration',()=>{
 assert.equal(LESSONS.tenmillion.topicId,'mt_XNmGwNggdU');
 assert.equal(digest(task),'0deadc9a3d0aac1cdf6206a515848e9642f08d687f6d8e4b730d70aae64c859c');
 assert.deepEqual(task.values,['-8200','-7900','-9100']);
 assert.deepEqual([task.min,task.max],[-10000,0]);
 assert.equal(signedOrderPreauditBinding(task,context)?.strictAApproved,false);
 assert.deepEqual(EVIDENCE_ADAPTERS.filter(a=>a.binding(task,context)),[]);
 for(const c of [{sessionId:'tenmillion',index:0},{sessionId:'tenmillion',index:2},
  {sessionId:'bigcompare',index:2},{sessionId:'tenmillion',index:'1'},{}])
  assert.equal(signedOrderPreauditBinding(task,c),null);
 assert.equal(signedOrderPreauditBinding({...task,prompt:task.prompt+'!'},context),null);
});
test('signed numeric order, real model actions, and final axis coordinates',()=>{
 const m=make(),before=JSON.stringify(m);
 assert.equal(M.valid(task,m),true);
 assert.equal(M.inspect(task,m).correct,true);
 const proof=replay(m);
 assert.ok(proof);
 assert.deepEqual(proof.selectedOrder,['-9100','-8200','-7900']);
 assert.deepEqual(proof.operations.map(e=>e.kind),['pick','pick','pick']);
 assert.deepEqual(proof.finalAxisPositions.map(p=>p.position),[180,210,90]);
 assert.equal(proof.observedSliderMotionChronology,false);
 assert.equal(proof.learnerUnderstandingAssessed,false);
 assert.equal(JSON.stringify(m),before);
});
test('wrong first attempt and genuine remove/reorder retain correction chronology',()=>{
 const m=M.initial(task);
 for(const i of [1,0,2])M.act(task,m,'wide-order',{index:i});
 for(let i=0;i<3;i++){m.positions[i]=Math.round((Number(task.values[i])-task.min)/(task.max-task.min)*1000);M.field(task,m,'positions.'+i);}
 const wrong=checked(m);
 assert.equal(M.inspect(task,m).correct,false);
 assert.equal(replaySignedOrderPreaudit(task,m,wrong,context),null);
 for(const i of [1,0,2])M.act(task,m,'wide-order',{index:i});
 for(const i of [2,0,1])M.act(task,m,'wide-order',{index:i});
 assert.equal(M.inspect(task,m).correct,true);
 const corrected=checked(m);
 corrected.attempts.unshift(wrong.attempts[0]);
 const proof=replaySignedOrderPreaudit(task,m,corrected,context);
 assert.ok(proof);
 assert.equal(proof.operations.length,9);
 assert.deepEqual(proof.operations.map(e=>e.kind),
  ['pick','pick','pick','remove','remove','remove','pick','pick','pick']);
 assert.deepEqual(corrected.attempts[0].value.order,[1,0,2]);
 assert.deepEqual(corrected.attempts[1].value.order,[2,0,1]);
 const stale=clone(corrected);
 stale.attempts[1].value.order=[];
 assert.equal(replaySignedOrderPreaudit(task,m,stale,context),null);
 assert.equal(replaySignedOrderPreaudit(task,m,{attempts:[]},context),null);
});
test('no retroactive strict credit from example/old model or fabricated clicks',()=>{
 const example=M.example(task);
 assert.equal(M.inspect(task,example).correct,true);
 assert.equal(replay(example),null);
 const old=make();delete old.orderTrace;delete old.orderTraceOverflow;
 assert.equal(M.valid(task,old),true);
 assert.equal(M.inspect(task,old).correct,true);
 assert.equal(replay(old),null);
 const noActions=make();noActions.orderTrace=[];
 assert.equal(replay(noActions),null);
 const overflow=make();overflow.orderTraceOverflow=true;
 assert.equal(replay(overflow),null);
 const fake=make();fake.orderTrace[0].index=5;
 assert.equal(replay(fake),null);
 const fakeKind=make();fakeKind.orderTrace[0].kind='remove';
 assert.equal(replay(fakeKind),null);
 const incomplete=make();incomplete.orderTrace.pop();
 assert.equal(replay(incomplete),null);
 const extra=make();extra.forged=true;
 assert.equal(replay(extra),null);
});
test('strict fail-closed for crossed/tied axis, altered source and missing touched',()=>{
 const m=make(),baseline=replay(m);
 assert.ok(baseline);
 const crossed=clone(m);[crossed.positions[0],crossed.positions[1]]=
  [crossed.positions[1],crossed.positions[0]];
 assert.equal(replay(crossed),null);
 const tied=clone(m);tied.positions[1]=tied.positions[0];
 assert.equal(replay(tied),null);
 const untouched=clone(m);untouched.touched[1]=false;
 assert.equal(replay(untouched),null);
 const reverse=clone(m);reverse.order.reverse();
 assert.equal(replay(reverse),null);
 assert.equal(replaySignedOrderModel({...task,values:['-8200','-7900','-9000']},m,context),null);
 assert.equal(replaySignedOrderModel({...task,min:-9000},m,context),null);
 assert.equal(replaySignedOrderModel(task,m,{sessionId:'bigcompare',index:2}),null);
});
