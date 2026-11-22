// #342 P005k: native B25 ordered angle cards, no shared adapter or grader changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {angleOrderingBinding as binding,replayAngleOrderingEvidence as replay,
 submittedAngleOrderingEvidence as submitted}
 from '../dist/learning/p005k-cross-source-angle-order-evidence.js';
const ctx={sessionId:'angleestimate',index:2};
const task=sessionTaskFor(ctx.sessionId,ctx.index);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
const model=(choices=[1,3,2,0])=>{
 const m=native.initial(task,314159);
 for(let i=0;i<4;i++)native.act(task,m,'g25-test',{index:i});
 for(const i of choices)native.act(task,m,'g25-choose',{index:i});
 return m;
};
const alter=(m,edit)=>{const x=structuredClone(m);edit(x);return x;};
test('P005k real native B25 task fingerprint, source, and independent ascending opening',()=>{
 console.log('P005K_NATIVE_FULL_TASK_SHA256 angleestimate:2 '+hash);
 assert.equal(hash,'66129894fabd7fda86e14f8373186a7b65cae628f29a1868a7f30c137e0935e9');
 assert.equal(binding(task,ctx)?.nodeId,'mt_YUJ5pwalqL');
 assert.equal(task.type,'x-g25-compare');
 assert.deepEqual(task.angles,[135,40,100,70]);
 assert.deepEqual(task.lengths,[1,3,2,1]);
 assert.equal(task.order,true);
 assert.deepEqual(task.questions,[]);
 const m=model();assert.equal(native.valid(task,m),true);
 assert.equal(native.inspect(task,m).correct,true);
 const proof=replay(task,m,ctx);assert.ok(proof);
 assert.deepEqual(proof.ascendingOriginalIndices,[1,3,2,0]);
 for(const [i,expected] of [135,40,100,70].entries())
  assert.ok(Math.abs(proof.measuredOpeningsDegrees[i]-expected)<1e-8);
 assert.equal(proof.originalControlEvents.length,8);
 assert.equal(proof.generalMasteryAssessed,false);
});
test('P005k rejects swaps, omitted test, duplicate pick, forged events, malformed and tampered board',()=>{
 assert.equal(replay(task,model([1,2,3,0]),ctx),null);
 assert.equal(replay(task,model([1,3,2]),ctx),null);
 const m=model();
 assert.equal(replay(task,alter(m,x=>{x.history.splice(0,1);}),ctx),null);
 assert.equal(replay(task,alter(m,x=>{x.history[4].d.index='00';}),ctx),null);
 assert.equal(replay(task,alter(m,x=>{x.history.push(x.history[4]);}),ctx),null);
 assert.equal(replay(task,alter(m,x=>{x.board.selected=[0,1,2,3];}),ctx),null);
 assert.equal(replay(task,alter(m,x=>{x.board.tested=[];}),ctx),null);
 assert.equal(replay(task,alter(m,x=>{x.issue='bad';}),ctx),null);
 assert.equal(replay(task,alter(m,x=>{x.answers[0]='35';}),ctx),null);
});
test('P005k source gate and latest original Check reject wrong lesson and stale attempt',()=>{
 const m=model(),wrong=model([1,2,3,0]);
 const record={attempts:[{value:wrong},{value:structuredClone(m)}]};
 assert.ok(submitted(task,m,record,ctx));
 assert.equal(submitted(task,m,{attempts:[{value:wrong}]},ctx),null);
 assert.equal(submitted(task,m,{attempts:[]},ctx),null);
 assert.equal(replay(task,m,{sessionId:'angleestimate',index:0}),null);
 assert.equal(replay(task,m,{sessionId:'rightcheck',index:0}),null);
 assert.equal(replay({...task,angles:[119,35,90,65]},m,ctx),null);
 assert.equal(replay({...task,lengths:[3,3,2,3]},m,ctx),null);
 assert.equal(replay({...task,order:false},m,ctx),null);
});
test('P005k actual wrong-to-correct with undo, reset and no-op rejection',()=>{
 const m=native.initial(task,314159);
 for(let i=0;i<4;i++)native.act(task,m,'g25-test',{index:i});
 for(const i of [1,2])native.act(task,m,'g25-choose',{index:i});
 assert.equal(native.inspect(task,m).correct,false);
 native.act(task,m,'g25-undo');
 for(const i of [3,2,0])native.act(task,m,'g25-choose',{index:i});
 assert.equal(native.inspect(task,m).correct,true);
 const proof=replay(task,m,ctx);assert.ok(proof);
 assert.equal(proof.undoObserved,true);
 native.act(task,m,'g25-reset');
 assert.equal(replay(task,m,ctx),null);
 const duplicate=model();
 native.act(task,duplicate,'g25-choose',{index:1});
 assert.equal(replay(task,duplicate,ctx),null);
 const undoEmpty=native.initial(task,314159);
 native.act(task,undoEmpty,'g25-undo');
 for(let i=0;i<4;i++)native.act(task,undoEmpty,'g25-test',{index:i});
 for(const i of [1,3,2,0])native.act(task,undoEmpty,'g25-choose',{index:i});

 assert.equal(replay(task,undoEmpty,ctx),null);
});
