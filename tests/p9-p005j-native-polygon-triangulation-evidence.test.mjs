// #342 P005j: four exact-source native polygon triangulation tasks.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {polygonBinding,replayPolygonEvidence,submittedPolygonEvidence}
 from '../dist/learning/p005j-native-polygon-triangulation-evidence.js';
const CASES=[
 {id:'triangleangles',index:1,node:'mt_cdMlC7EpTJ',n:4,
  sha:'0f6663f98f33d41c0a34325fa27fa2efccd210c8226ec84f54b54d2c780fd0c7',answers:[2,360]},
 {id:'triangleangles',index:2,node:'mt_cdMlC7EpTJ',n:6,
  sha:'147de24573fdcaf86536f966660dc6f70defc3f1c96a2b1d1f40c4ae83af2dec',answers:[4,720,120]},
 {id:'polygonangles',index:1,node:'mt_J03RFlVdas',n:6,
  sha:'07e4b762dc704c68929bf22c12cfa40b749813061618ad50bfee9da182053e11',answers:[4,720]},
 {id:'polygonangles',index:2,node:'mt_J03RFlVdas',n:5,
  sha:'27d4dadcb1c638fb86fcdd4497c8658ebaa9716293697d394b252d6fe0a28993',answers:[108,72,360]}
];
const context=c=>({sessionId:c.id,index:c.index});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const sha=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const order=t=>Array.from({length:t.n-3},(_,i)=>t.n-2-i);
const make=(t,indices=order(t),wrong=false)=>{
 const m=native.initial(t,314159);
 for(const index of indices)native.act(t,m,'g25-diagonal',{index});
 t.questions.forEach((q,i)=>m.answers[i]=String(q.value));
 if(wrong)m.answers[0]='999';
 return m;
};
const altered=(m,fn)=>{const x=structuredClone(m);fn(x);return x;};
test('four frozen native source positions, full task SHA256 and independent polygon geometry',()=>{
 const seen=new Set();
 for(const c of CASES){
  const t=sessionTaskFor(c.id,c.index),m=make(t),position=c.id+':'+c.index;
  console.log('P005J_NATIVE_FULL_TASK_SHA256 '+position+' '+sha(t));
  assert.equal(seen.has(position),false);seen.add(position);
  assert.equal(sha(t),c.sha);
  assert.equal(LESSONS[c.id].topicId,c.node);
  assert.equal(t.type,'x-g25-polygon');
  assert.equal(t.n,c.n);
  assert.deepEqual(t.questions.map(q=>q.value),c.answers);
  assert.equal(polygonBinding(t,context(c))?.nodeId,c.node);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  const proof=replayPolygonEvidence(t,m,context(c));
  assert.ok(proof,position);
  assert.equal(proof.triangulationCount,c.n-2);
  assert.ok(Math.abs(proof.independentInteriorSumDegrees-(c.n-2)*180)<1e-7);
  assert.ok(Math.abs(proof.independentExteriorSumDegrees-360)<1e-7);
  assert.deepEqual(proof.originalDiagonalOrder,order(t));
  assert.equal(proof.independentAreaPartitionVerified,true);
  assert.equal(proof.strictAApproved,false);
  assert.equal(proof.verbalProofAssessed,false);
 }
});
test('native wrong Check to corrected latest submission, strict answer and source isolation',()=>{
 for(const c of CASES){
  const t=sessionTaskFor(c.id,c.index),good=make(t),wrong=make(t,order(t),true);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replayPolygonEvidence(t,wrong,context(c)),null);
  const record={attempts:[{value:wrong},{value:structuredClone(good)}]};
  assert.ok(submittedPolygonEvidence(t,good,record,context(c)));
  assert.equal(submittedPolygonEvidence(t,good,{attempts:[{value:wrong}]},context(c)),null);
  assert.equal(submittedPolygonEvidence(t,wrong,record,context(c)),null);
  assert.equal(submittedPolygonEvidence(t,good,{attempts:[]},context(c)),null);
  assert.equal(replayPolygonEvidence(t,good,{sessionId:c.id,index:0}),null);
  assert.equal(replayPolygonEvidence(t,good,{sessionId:'link-triangleangles-polygonangles',index:c.index}),null);
  assert.equal(replayPolygonEvidence(t,good,{sessionId:c.id,index:String(c.index)}),null);
  assert.equal(replayPolygonEvidence({...t,n:t.n+1},good,context(c)),null);
  assert.equal(replayPolygonEvidence({...t,prompt:t.prompt+'伪'},good,context(c)),null);
  assert.equal(replayPolygonEvidence({...t,questions:[...t.questions,{label:'fake',value:0}]},good,context(c)),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.answers[0]='0'+m.answers[0]),context(c)),null);
 }
});
test('reject missing, repeated, toggled, forged, removed, stale and malformed actions',()=>{
 for(const c of CASES){
  const t=sessionTaskFor(c.id,c.index),good=make(t),ctx=context(c);
  assert.equal(replayPolygonEvidence(t,make(t,order(t).slice(1)),ctx),null);
  assert.equal(replayPolygonEvidence(t,make(t,[...order(t),order(t)[0]]),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.history[0].a='choose'),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.history[0].f.fake='1'),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.history[0].d.index='02'),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.history[0].d.index='99'),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.history[0].d.extra='0'),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.board.diagonals=[]),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.board.first.diagonal.foo='1'),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.prose='proved'),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.issue='unresolved'),ctx),null);
  assert.equal(replayPolygonEvidence(t,altered(good,m=>m.extra=true),ctx),null);
 }
});
