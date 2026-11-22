// #342 / P006j: original B19 three-day usage events, original source and adversarial math.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {nativeThreeDayUsageBinding,replayNativeThreeDayUsage,
 submittedNativeThreeDayUsage} from
 '../dist/learning/p006j-native-playground-three-day-usage-evidence.js';

const ID='playgroundstudy',INDEX=0,NODE='mt_kxeuXm6EyC';
const POSITION='playgroundstudy:0',HASH='271fc40982890e7b261ed64bf00b387dd8f4071d13db5098186b47ebe1ecadff';
const VALUES=['秋千','滑梯','秋千','攀爬架','滑梯','秋千',
 '滑梯','秋千','攀爬架','秋千','滑梯','秋千'];
const COUNTS=[6,4,2],BY_DAY=[[2,1,1],[2,2,0],[2,1,1]];
const context={sessionId:ID,index:INDEX};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
  .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function replayOriginal(task,wrong=false){
 const m=native.initial(task),steps=native.solveSteps(task);
 if(wrong){
  m.questions=['lead'];m.scope='defined';m.reason='consistent';
  native.act(task,m,'b19-plan');
  assert.ok(m.issue,'the original biased plan is rejected');
  m.questions=['clear'];native.act(task,m,'b19-plan');
  assert.equal(m.issue,'');
 }
 for(const s of steps){
  if(s.field){
   const p=s.field.split('.');
   if(p.length===2)m[p[0]][+p[1]]=String(s.value);
   else m[s.field]=String(s.value);
   native.field(task,m,s.field);
  }else if(!(wrong&&s.action==='b19-plan'))native.act(task,m,s.action,s.data);
 }
 return m;
}
test('P006j full native original fingerprint, day-scoped frequency and strict event replay',()=>{
 const task=sessionTaskFor(ID,INDEX),hash=digest(task);
 console.log('P006J_NATIVE_FULL_TASK_SHA256 '+POSITION+' '+hash);
 assert.equal(hash,HASH);
 assert.equal(LESSONS[ID].topicId,NODE);
 assert.equal(task.type,'x-datastudio');
 assert.deepEqual(task.rows.map(r=>r.values[0]),VALUES);
 assert.deepEqual(task.rows.map(r=>r.day),
  VALUES.map((_,i)=>'第'+(Math.floor(i/4)+1)+'天午休'));
 const binding=nativeThreeDayUsageBinding(task,context);
 assert.equal(binding?.recordCount,12);
 assert.equal(binding?.unit,'次使用');
 for(const wrong of [false,true]){
  const m=replayOriginal(task,wrong);
  assert.equal(native.valid(task,m),true);
  assert.equal(native.inspect(task,m).correct,true);
  const proof=replayNativeThreeDayUsage(task,m,context);
  assert.ok(proof,'native original event replay '+String(wrong));
  assert.deepEqual(proof.independentDayCategoryCounts,BY_DAY);
  assert.deepEqual(proof.independentFrequencyCounts,COUNTS);
  assert.equal(proof.frequencyTotal,12);
  assert.equal(proof.maximumMinusMinimum,4);
  assert.equal(proof.observedOriginalRecordClicks,12);
  assert.equal(proof.wrongQuestionThenCorrectionObserved,wrong);
  assert.equal(proof.observedUniqueIndividuals,false);
  assert.equal(proof.uniquePeopleCountInferable,false);
  assert.equal(proof.actualRespondentsObserved,false);
  assert.equal(proof.strictAApproved,false);
  const record={attempts:[{value:structuredClone(m)}]};
  assert.ok(submittedNativeThreeDayUsage(task,m,record,context));
  assert.equal(submittedNativeThreeDayUsage(task,m,{attempts:[]},context),null);
 }
});
test('P006j wrong source, day, counts, altered events and false unique-person claims refused',()=>{
 const task=sessionTaskFor(ID,INDEX),m=replayOriginal(task,true);
 for(const ctx of [
  {sessionId:'playgroundstudy',index:1},
  {sessionId:'playgroundstudy',index:'0'},
  {sessionId:'digitalstudy',index:0},
  {sessionId:'__proto__',index:0}
 ])assert.equal(replayNativeThreeDayUsage(task,m,ctx),null);
 for(const bad of [
  {...task,prompt:task.prompt+'？'},
  {...task,who:'12名不同的孩子'},
  {...task,unit:'人'},
  {...task,formula:true},
  {...task,charts:['dot']},
  {...task,rows:task.rows.slice(1)},
  {...task,rows:task.rows.map((r,i)=>i===4?{...r,day:'第1天午休'}:r)},
  {...task,cols:[{...task.cols[0],values:['滑梯','秋千','攀爬架']}]}
 ])assert.equal(replayNativeThreeDayUsage(bad,m,context),null);
 const attacks=[
  x=>x.history.pop(),
  x=>x.history[0].a='reset',
  x=>x.history[0].f.questions[0]='clear',
  x=>x.history[1].f.questions[0]='lead',
  x=>x.history[2].f.entry[0]='滑梯',
  x=>x.history[2].d.index='0',
  x=>x.history[2].f.entry.push('another'),
  x=>x.history.push(structuredClone(x.history.at(-1))),
  x=>x.board.rows[0][0]='滑梯',
  x=>x.board.table.counts[0]=7,
  x=>x.board.table.total=12.5,
  x=>x.board.heights[0]--,
  x=>x.board.plot.chart='dot',
  x=>x.board.report.scope='all',
  x=>x.board.report.gap=5,
  x=>x.issue='fake',
  x=>x.gap='100',
  x=>x.board.uniquePeople=12
 ];
 for(const attack of attacks){
  const forged=structuredClone(m);attack(forged);
  assert.equal(replayNativeThreeDayUsage(task,forged,context),null,attack.toString());
 }
 const record={attempts:[{value:structuredClone(m)}]};
 const stale=structuredClone(record);stale.attempts[0].value.total='100';
 assert.ok(submittedNativeThreeDayUsage(task,m,record,context));
 assert.equal(submittedNativeThreeDayUsage(task,m,stale,context),null);
 assert.equal(replayNativeThreeDayUsage(sessionTaskFor('playgroundstudy',1),m,context),null);
});
