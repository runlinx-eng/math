// #342 / P006k: native source fingerprints, independent frequency and negative replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {nativeStudioRowFrequencyBinding,replayNativeStudioRowFrequency,
 submittedNativeStudioRowFrequency} from
 '../dist/learning/p006k-native-simulated-survey-studio-evidence.js';

const cases=[
 {id:'digitalstudy',node:'mt_yrvYKSwSRZ',
  hash:'24880cc3f5a04a8aff18ef85c521710c9423eb288a26ca4f95fcc285a00f9643',
  expected:[4,3,2,1],records:10,cols:1,maximum:[0],minimum:[3],gap:3},
 {id:'ownstudy',node:'mt_Y6JmLjnfRP',
  hash:'b4978e3896ff692b60f981377649494f13771bb8da24015e78985648fc6be32d',
  expected:[3,6,4,2],records:15,cols:3,maximum:[1],minimum:[3],gap:4}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
  .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function original(t,wrong){
 const m=native.initial(t),steps=native.solveSteps(t);
 if(wrong){
  m.questions=Array(t.cols.length).fill('clear');
  m.questions[0]='lead';m.scope='defined';m.reason='consistent';
  native.act(t,m,'b19-plan');
  assert.ok(m.issue,'biased native question rejected');
  m.questions[0]='clear';native.act(t,m,'b19-plan');
  assert.equal(m.issue,'');
 }
 let passed=!wrong;
 for(const s of steps){
  if(!passed){if(s.action==='b19-plan')passed=true;continue;}
  if(s.field){
   const p=s.field.split('.');
   if(p.length===2)m[p[0]][Number(p[1])]=String(s.value);
   else m[s.field]=String(s.value);
   native.field(t,m,s.field);
  }else native.act(t,m,s.action,s.data);
 }
 return m;
}
for(const s of cases){
 const context={sessionId:s.id,index:0},task=sessionTaskFor(s.id,0);
 test('P006k '+s.id+' full source SHA, original row/cell count, independent COUNTIF and correction',()=>{
  const hash=digest(task);
  console.log('P006K_NATIVE_FULL_TASK_SHA256 '+s.id+':0 '+hash);
  assert.equal(hash,s.hash);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(task.type,'x-datastudio');
  assert.equal(task.rows.length,s.records);
  assert.equal(task.cols.length,s.cols);
  assert.equal(nativeStudioRowFrequencyBinding(task,context)?.recordCount,s.records);
  for(const wrong of [false,true]){
   const model=original(task,wrong);
   assert.equal(native.valid(task,model),true);
   assert.equal(native.inspect(task,model).correct,true);
   const proof=replayNativeStudioRowFrequency(task,model,context);
   assert.ok(proof,'independent source-locked event replay '+wrong);
   assert.deepEqual(proof.independentFrequencyCounts,s.expected);
   assert.equal(proof.frequencyTotal,s.records);
   assert.equal(proof.observedQuestionCells,s.records*s.cols);
   assert.deepEqual(proof.maximumCategoryIndices,s.maximum);
   assert.deepEqual(proof.minimumCategoryIndices,s.minimum);
   assert.equal(proof.maximumMinusMinimum,s.gap);
   assert.equal(proof.wrongQuestionThenCorrectionObserved,wrong);
   assert.equal(proof.observedOriginalRecordClicks,s.records);
   assert.equal(proof.simulatedRespondentCount,s.records);
   assert.equal(proof.actualRespondentsObserved,false);
   assert.equal(proof.uniquePeopleCountInferable,false);
   assert.equal(proof.strictAApproved,false);
   const record={attempts:[{value:structuredClone(model)}]};
   assert.ok(submittedNativeStudioRowFrequency(task,model,record,context));
   assert.equal(submittedNativeStudioRowFrequency(task,model,{attempts:[]},context),null);
  }
 });
 test('P006k '+s.id+' forged original rows, truncated formulas, altered events and stale Check rejected',()=>{
  const model=original(task,true);
  for(const ctx of [
   {sessionId:s.id,index:1},{sessionId:s.id,index:'0'},
   {sessionId:'__proto__',index:0},{sessionId:'playgroundstudy',index:0}
  ])assert.equal(replayNativeStudioRowFrequency(task,model,ctx),null);
  for(const bad of [
   {...task,prompt:task.prompt+'？'},
   {...task,unit:'45名儿童'},
   {...task,rows:task.rows.slice(1)},
   {...task,rows:task.rows.map((r,i)=>i===0?{...r,id:'R99'}:r)},
   {...task,cols:task.cols.map((c,i)=>i===0?{...c,values:c.values.toReversed()}:c)},
   {...task,analysis:1},
   {...task,who:'45名真实受访者'}
  ])assert.equal(replayNativeStudioRowFrequency(bad,model,context),null);
  const attacks=[
   x=>x.history.pop(),
   x=>x.history[0].a='record',
   x=>x.history[0].f.questions[0]='clear',
   x=>x.history[2].f.entry[0]='forged',
   x=>x.history[2].d.index='0',
   x=>x.history.at(-1).f.formulas[0]='=COUNTIF(B2:B2,"'+task.cols[0].values[0]+'")',
   x=>x.history.push(structuredClone(x.history.at(-1))),
   x=>x.board.rows[0][0]='forged',
   x=>x.board.table.counts[0]++,
   x=>x.board.table.total++,
   x=>x.board.table.formulas[0]='=COUNTIF(B2:B2,"'+task.cols[0].values[0]+'")',
   x=>x.board.heights[0]--,
   x=>x.board.plot.counts[0]++,
   x=>x.board.max=[0,1,2,3],
   x=>x.board.report.scope='all',
   x=>x.board.report.gap++,
   x=>x.issue='fabricated',
   x=>x.board.actualRespondentsObserved=true
  ];
  for(const attack of attacks){
   const forged=structuredClone(model);attack(forged);
   assert.equal(replayNativeStudioRowFrequency(task,forged,context),null,attack.toString());
  }
  const record={attempts:[{value:structuredClone(model)}]};
  assert.ok(submittedNativeStudioRowFrequency(task,model,record,context));
  const stale=structuredClone(record);stale.attempts[0].value.gap='999';
  assert.equal(submittedNativeStudioRowFrequency(task,model,stale,context),null);
 });
}
