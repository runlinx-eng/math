// #342 / P006i: source original B19 studio, independent math and adversarial history.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {nativeStudioRowChartBinding,replayNativeStudioRowChart,
 submittedNativeStudioRowChart} from '../dist/learning/p006i-native-studio-row-to-chart-evidence.js';
const cases=[
 {id:'studyplan',index:1,node:'mt_SHVyE1CLUa',values:[8,9,8,7,9,8,10,9],
  labels:['7','8','9','10'],counts:[1,3,3,1],formula:false},
 {id:'betterquestion',index:1,node:'mt_O-U263ukg1',values:[0,2,1,3,2,4,1,2,0,3],
  labels:['0','1','2','3','4'],counts:[2,2,3,2,1],formula:true}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const put=(m,k,v)=>{const p=k.split('.');if(p.length===2)m[p[0]][+p[1]]=String(v);else m[k]=String(v);native.field(m);};
function replay(t,wrong=false){
 const m=native.initial(t),steps=native.solveSteps(t);
 if(wrong){
  m.questions=['lead'];m.scope='defined';m.reason='consistent';
  native.act(t,m,'b19-plan');
  assert.ok(m.issue,'original wrong question rejected');
  m.questions=['clear'];native.act(t,m,'b19-plan');
  assert.equal(m.issue,'');
 }
 for(const s of steps){
  if(s.field){
   const p=s.field.split('.');
   if(p.length===2)m[p[0]][+p[1]]=String(s.value);
   else m[s.field]=String(s.value);
   native.field(t,m,s.field);
  }else if(!(wrong&&s.action==='b19-plan'))native.act(t,m,s.action,s.data);
 }
 return m;
}
for(const s of cases){
 const position=s.id+':'+s.index,ctx={sessionId:s.id,index:s.index};
 test('P006i original source rows, exact independent frequency, original native events '+position,()=>{
  const t=sessionTaskFor(s.id,s.index),hash=digest(t);
  console.log('P006I_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(t.type,'x-datastudio');
  assert.deepEqual(t.rows.map(r=>Number(r.values[0])),s.values);
  const b=nativeStudioRowChartBinding(t,ctx);
  assert.equal(b?.position,position);assert.equal(b?.rowCount,s.values.length);
  for(const wrong of [false,true]){
   const m=replay(t,wrong);
   assert.equal(native.valid(t,m),true);
   assert.equal(native.inspect(t,m).correct,true);
   const proof=replayNativeStudioRowChart(t,m,ctx);
   assert.ok(proof,'genuine original native trajectory '+position+' '+wrong);
   assert.deepEqual(proof.independentFrequencyCounts,s.counts);
   assert.equal(proof.frequencyTotal,s.values.length);
   assert.equal(proof.maximumMinusMinimum,Math.max(...s.counts)-Math.min(...s.counts));
   assert.equal(proof.observedSourceRowRecordClicks,s.values.length);
   assert.equal(proof.wrongQuestionThenCorrectionObserved,wrong);
   assert.equal(proof.tableCalculation,s.formula?'source-scoped-countif':'independent-category-count');
   assert.equal(proof.strictAApproved,false);
   const record={attempts:[{value:structuredClone(m)}]};
   assert.ok(submittedNativeStudioRowChart(t,m,record,ctx));
   assert.equal(submittedNativeStudioRowChart(t,m,{attempts:[]},ctx),null);
  }
 });
 test('P006i source isolation, extra/missing actions, tampered rows and fake claims rejected '+position,()=>{
  const t=sessionTaskFor(s.id,s.index),m=replay(t,true);
  for(const c of [{sessionId:'__proto__',index:s.index},
   {sessionId:s.id,index:s.index+1},{sessionId:s.id,index:'1'}])
   assert.equal(replayNativeStudioRowChart(t,m,c),null);
  for(const bad of [{...t,prompt:t.prompt+'?'},{...t,rows:t.rows.slice(1)},
   {...t,cols:t.cols.map(c=>({...c,question:c.question+' changed'}))}])
   assert.equal(replayNativeStudioRowChart(bad,m,ctx),null);
  const attacks=[
   x=>x.history.pop(),x=>x.history[0].a='reset',
   x=>x.history[0].f.questions[0]='clear',
   x=>x.history[1].f.questions[0]='lead',
   x=>x.history[2].d.index='0',
   x=>x.history[2].f.entry[0]='forged',
   x=>x.history[2].f.total='999',
   x=>x.history[2].f.entry.push('extra'),
   x=>x.history.push(structuredClone(x.history.at(-1))),
   x=>x.board.rows[0][0]='other',
   x=>x.board.table.counts[0]=999,
   x=>x.board.heights[0]--,
   x=>x.board.plot.chart='dot',
   x=>x.board.report.scope='all',
   x=>x.board.report.gap=999,
   x=>x.issue='forged',
   x=>x.total='999'
  ];
  for(const change of attacks){const x=structuredClone(m);change(x);
   assert.equal(replayNativeStudioRowChart(t,x,ctx),null,change.toString());
  }
  const good={attempts:[{value:structuredClone(m)}]};
  assert.ok(submittedNativeStudioRowChart(t,m,good,ctx));
  const stale=structuredClone(good);stale.attempts[0].value.total='111';
  assert.equal(submittedNativeStudioRowChart(t,m,stale,ctx),null);
 });
}
