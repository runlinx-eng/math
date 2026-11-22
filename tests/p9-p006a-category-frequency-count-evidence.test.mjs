// #342 P006a exact native source, independent frequency replay, adversarial guards.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {categoryFrequencyBinding,replayCategoryFrequencyEvidence,submittedCategoryFrequencyEvidence}
 from '../dist/learning/p006a-category-frequency-count-evidence.js';
const ctx={sessionId:'categoryuse',index:0};
const sha='945aa122537d0193ef311aadb9b1d47bd5c3bbe22f472c19163977e69b117fbe';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function make(t,order=[0,0,0,0,1,1,1,2,2]){
 const m=native.initial(t);
 for(const index of order)native.act(t,m,'b19-bar',{index,delta:1});
 m.total='9';native.field(t,m,'total');
 m.gap='1';native.field(t,m,'gap');return m;
}
test('P006a exact original registered source and full SHA, nine real bar actions, independent sum/difference',()=>{
 const t=sessionTaskFor(ctx.sessionId,ctx.index);
 console.log('P006A_NATIVE_FULL_TASK_SHA256 categoryuse:0 '+digest(t));
 assert.equal(digest(t),sha);
 assert.equal(LESSONS.categoryuse.topicId,'mt_1VSfm9yiLn');
 assert.equal(t.type,'x-datacount');
 assert.deepEqual(t.counts,[4,3,2]);
 assert.equal(categoryFrequencyBinding(t,ctx)?.nodeId,'mt_1VSfm9yiLn');
 const m=make(t);
 assert.equal(native.valid(t,m),true);
 assert.equal(native.inspect(t,m).correct,true);
 const proof=replayCategoryFrequencyEvidence(t,m,ctx);
 assert.ok(proof);assert.equal(proof.independentlyCountedTotal,9);
 assert.equal(proof.independentCategoryDifference,1);
 assert.equal(proof.actualChildrenSurveyed,false);
 assert.equal(proof.strictAApproved,false);
 assert.ok(replayCategoryFrequencyEvidence(t,make(t,[1,2,0,0,2,0,1,0,1]),ctx));
});
test('P006a original wrong-correct Check and strict source, submission identity',()=>{
 const t=sessionTaskFor(ctx.sessionId,ctx.index),m=make(t);
 const wrong=structuredClone(m);wrong.total='8';
 assert.equal(native.inspect(t,wrong).correct,false);
 assert.equal(replayCategoryFrequencyEvidence(t,wrong,ctx),null);
 const record={attempts:[{value:wrong},{value:structuredClone(m)}]};
 assert.ok(submittedCategoryFrequencyEvidence(t,m,record,ctx));
 assert.equal(submittedCategoryFrequencyEvidence(t,m,{attempts:[{value:wrong}]},ctx),null);
 assert.equal(submittedCategoryFrequencyEvidence(t,wrong,record,ctx),null);
 assert.equal(replayCategoryFrequencyEvidence(t,m,{sessionId:'categoryuse',index:1}),null);
 assert.equal(replayCategoryFrequencyEvidence(t,m,{sessionId:'bridge-categoryuse',index:0}),null);
 assert.equal(replayCategoryFrequencyEvidence({...t,counts:[5,2,2]},m,ctx),null);
 assert.equal(replayCategoryFrequencyEvidence({...t,prompt:t.prompt+'X'},m,ctx),null);
});
test('P006a no fabricated clicks, duplicates, hidden fields or wrong categories',()=>{
 const t=sessionTaskFor(ctx.sessionId,ctx.index),m=make(t);
 const reject=[
  x=>x.history.pop(),
  x=>x.history[0].d.delta='-1',
  x=>x.history[0].d.index='00',
  x=>x.history[0].d.index='5',
  x=>x.history[0].d.extra='x',
  x=>x.history[0].f.total='9',
  x=>x.history[0].f.fake='x',
  x=>x.history[0].a='max',
  x=>x.history[8].d.index='1',
  x=>x.board.counts=[3,4,2],
  x=>x.board.pairs=1,
  x=>x.total='09',
  x=>x.gap='0',
  x=>x.issue='some error',
  x=>x.inferredPopulation=true
 ];
 for(const change of reject){const x=structuredClone(m);change(x);
  assert.equal(replayCategoryFrequencyEvidence(t,x,ctx),null);
 }
});
