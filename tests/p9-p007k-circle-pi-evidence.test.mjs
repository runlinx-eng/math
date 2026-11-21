// #342 source-locked native original circumference / diameter pi evidence.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {nativeCirclePiBinding,replayNativeCirclePiEvidence,submittedNativeCirclePiEvidence} from '../dist/learning/p007k-circle-pi-evidence.js';
const ctx={sessionId:'shapefacts',index:2},HASH='bc230723f50cd5fc792097e4690916ea1b6c9cb2935c042f40005569f0d3c825';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function fixture(){
 const t=sessionTaskFor('shapefacts',2),m=native.initial(t,314159);
 const draw=r=>{m.radius=String(r);
  for(const a of ['circle','radial','diameter','rim'])native.act(t,m,'g23-'+a);};
 m.answers=['9','pi'];draw(5.5);const wrong=structuredClone(m);
 draw(4.5);const good=structuredClone(m);
 return {t,wrong,good,record:{attempts:[{value:wrong},{value:good}]}};
}
test('P007k exact source and independent pi geometry',()=>{
 const {t,wrong,good,record}=fixture();
 console.log('P007K_NATIVE_FULL_TASK_SHA256 shapefacts:2 '+digest(t));
 assert.equal(LESSONS.shapefacts.topicId,'mt_DNYQLahbfa');
 assert.equal(digest(t),HASH);assert.equal(native.valid(t,wrong),true);
 assert.equal(native.valid(t,good),true);assert.equal(native.inspect(t,wrong).correct,false);
 assert.equal(native.inspect(t,good).correct,true);
 assert.equal(nativeCirclePiBinding(t,ctx)?.originalTaskSha256,HASH);
 const p=replayNativeCirclePiEvidence(t,good,ctx);assert.ok(p);
 assert.equal(p.independentGeometry.diameterCm,9);
 assert.equal(p.independentGeometry.circumferenceToDiameterRatio,Math.PI);
 assert.equal(p.independentGeometry.circumferenceCm,9*Math.PI);
 assert.equal(p.independentGeometry.areaSquareCm,20.25*Math.PI);
 assert.equal(p.strictAApproved,false);
 assert.ok(submittedNativeCirclePiEvidence(t,good,record,ctx)?.wrongToCorrectCircleObserved);
});
test('P007k reject original task, node and index mutations',()=>{
 const {t,good}=fixture();
 for(const c of [null,{},[],{sessionId:'circleparts',index:2},
 {sessionId:'shapefacts',index:1},{sessionId:'shapefacts',index:'2'}])
 assert.equal(replayNativeCirclePiEvidence(t,good,c),null);
 for(const bad of [{...t,radius:5},{...t,prompt:t.prompt+'!'},{...t,questions:[]},{...t,extra:true}])
 assert.equal(replayNativeCirclePiEvidence(bad,good,ctx),null);
});
test('P007k reject forged circle/control/board/answers',()=>{
 const {t,good}=fixture();
 const changes=[m=>m.history.pop(),m=>m.history[0].f.radius='1',
 m=>m.history[0].a='turn',m=>m.history[0].f.extra='fake',
 m=>m.history[0].d.index='0',m=>m.board.rim=false,
 m=>m.board.radius=3,m=>m.board.first.circle.radius='9',
 m=>m.answers[1]='twice',m=>m.radius='3',m=>m.prose='understood',
 m=>m.seed=0,m=>m.issue='fake',m=>m.extra=true];
 for(const change of changes){const bad=structuredClone(good);change(bad);
 assert.equal(replayNativeCirclePiEvidence(t,bad,ctx),null,change.toString());}
});
test('P007k reject stale or spoofed original Check',()=>{
 const {t,wrong,good,record}=fixture();
 assert.ok(submittedNativeCirclePiEvidence(t,good,record,ctx));
 for(const attempts of [[],[{value:wrong}],[{value:good},{value:good}],
 [{value:wrong},{value:wrong}],[{value:wrong},{value:good},{value:good}],
 [{value:{...wrong,seed:1}},{value:good}],
 [{value:{...wrong,history:[]}},{value:good}]])
 assert.equal(submittedNativeCirclePiEvidence(t,good,{attempts},ctx),null);
});
