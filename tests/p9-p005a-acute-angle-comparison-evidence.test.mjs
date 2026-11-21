// #342 P005a native angletypes:0, actual B25 events and fail-closed checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {acuteAngleComparisonBinding as binding,
 replayAcuteAngleComparisonEvidence as replay,
 submittedAcuteAngleComparisonEvidence as submitted}
 from '../dist/learning/p005a-acute-angle-comparison-evidence.js';
const ctx={sessionId:'angletypes',index:0};
const task=sessionTaskFor(ctx.sessionId,ctx.index);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
const model=(choices=[0,3])=>{
 const m=native.initial(task,314159);
 for(let i=0;i<4;i++)native.act(task,m,'g25-test',{index:i});
 for(const i of choices)native.act(task,m,'g25-choose',{index:i});
 m.answers[0]='acute';return m;
};
const alter=(m,edit)=>{const x=structuredClone(m);edit(x);return x;};
test('P005a exact runtime task, source and trigonometric acute classification',()=>{
 console.log('P005A_NATIVE_FULL_TASK_SHA256 angletypes:0 '+hash);
 assert.match(hash,/^[a-f0-9]{64}$/);
 assert.equal(binding(task,ctx)?.nodeId,'mt_h0CVtqI2xo');
 assert.deepEqual(task.angles,[35,90,125,65]);
 const m=model();
 assert.equal(native.valid(task,m),true);
 assert.equal(native.inspect(task,m).correct,true);
 const proof=replay(task,m,ctx);assert.ok(proof);
 assert.deepEqual(proof.selectedAcuteIndices,[0,3]);
 assert.deepEqual(proof.independentClassification,['acute','right','obtuse','acute']);
 assert.equal(proof.originalControlEvents.length,6);
 assert.equal(proof.generalMasteryAssessed,false);
});
test('P005a rejects untested click, incomplete comparison, wrong Check and tampering',()=>{
 assert.equal(replay(task,model([0]),ctx),null);
 const x=model();
 const untested=alter(x,m=>{m.history.splice(3,1);});
 assert.equal(replay(task,untested,ctx),null);
 const wrong=alter(x,m=>{m.answers[0]='obtuse';});
 assert.equal(native.inspect(task,wrong).correct,false);
 assert.equal(replay(task,wrong,ctx),null);
 assert.equal(replay(task,alter(x,m=>{m.history[0].d.index='00';}),ctx),null);
 assert.equal(replay(task,alter(x,m=>{m.board.selected=[0,2];}),ctx),null);
 assert.equal(replay(task,alter(x,m=>{m.board.tested=[];}),ctx),null);
 assert.equal(replay(task,alter(x,m=>{m.issue='failure';}),ctx),null);
});
test('P005a rejects stale original Check and changed source/position',()=>{
 const m=model(),wrong=alter(m,x=>{x.answers[0]='obtuse';});
 const record={attempts:[{value:wrong},{value:structuredClone(m)}]};
 assert.ok(submitted(task,m,record,ctx));
 assert.equal(submitted(task,m,{attempts:[{value:wrong}]},ctx),null);
 assert.equal(submitted(task,m,{attempts:[]},ctx),null);
 assert.equal(replay(task,m,{sessionId:'angletypes',index:1}),null);
 assert.equal(replay({...task,angles:[36,90,125,65]},m,ctx),null);
 assert.equal(replay({...task,lengths:[1,1,1,2]},m,ctx),null);
 assert.equal(replay(task,m,{sessionId:'rightcheck',index:0}),null);
});
test('P005a wrong-to-correct native selection and reset replay',()=>{
 const m=native.initial(task,314159);
 for(let i=0;i<4;i++)native.act(task,m,'g25-test',{index:i});
 native.act(task,m,'g25-choose',{index:1});
 m.answers[0]='acute';assert.equal(native.inspect(task,m).correct,false);
 native.act(task,m,'g25-choose',{index:1});
 for(const i of [0,3])native.act(task,m,'g25-choose',{index:i});
 assert.equal(native.inspect(task,m).correct,true);
 const proof=replay(task,m,ctx);assert.ok(proof);
 assert.equal(proof.originalControlEvents.some(e=>e.action==='unchoose'),true);
 native.act(task,m,'g25-reset');
 assert.equal(replay(task,m,ctx),null);
});
