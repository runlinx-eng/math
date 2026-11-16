import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import reviewed from './fixtures/p9-order-cases.cjs';
import browserPlan from './p9-order-adapter-browser.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b15-model.js';
import {applyOrderStep,orderEvidenceExample} from '../scripts/order-evidence-fixture.mjs';
import {orderBinding as binding,replayOrderEvidence as replay,orderExactExpression as exact} from '../dist/learning/order-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,supportLesson,validateLesson,lessonSummary} from '../dist/learning/state.js';
await ensureB39Ready();
const {cases,excluded,associated}=reviewed,copy=x=>structuredClone(x),at=(id,index=0)=>sessionTasks(id)[index];
const context=c=>({sessionId:c.id,index:c.index}),saved=m=>({support:false,attempts:[{value:copy(m)}]});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex');
const field=(t,m,key,value)=>applyOrderStep(t,m,{field:key,value:String(value)});
const click=(t,m,action,data)=>applyOrderStep(t,m,{action:'b15-'+action,data});
function build(t,m,raw=t.expected||t.expression){field(t,m,'expression',raw);click(t,m,'build');}
function reduce(t,m,id,value){click(t,m,'op',{index:id});field(t,m,'result',value);click(t,m,'reduce');}
function solve(c,m=M.initial(c.task)){
 const t=c.task;if(t.construct)build(t,m);
 for(const [id,value] of c.steps)reduce(t,m,id,value);
 field(t,m,'answer',c.answer);return m;
}
function accepts(t,m){
 assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
 const raw=JSON.stringify(m),proof=replay(t,m);assert.ok(proof);assert.equal(JSON.stringify(m),raw);
 assert.deepEqual(replay(t,JSON.parse(raw)),proof);assert.deepEqual(JSON.parse(JSON.stringify(proof)),proof);return proof;
}
function rejects(t,m){const raw=JSON.stringify(m);assert.equal(replay(t,m),null);assert.equal(JSON.stringify(m),raw);}
const sourceCase=(id,index=0)=>cases.find(c=>c.id===id&&c.index===index);

test('all seventeen full source tasks, original files and native positions match fixed reviewed fingerprints',()=>{
 assert.equal(cases.length,17);assert.equal(new Set(cases.map(c=>c.nodeId)).size,6);
 for(const [path,hash] of Object.entries(reviewed.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+path,import.meta.url))),hash,path);
 const native=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).map((task,index)=>({id,index,task}))).filter(r=>r.task.type==='x-orderlab');
 assert.equal(native.length,20);
 assert.deepEqual(native.filter(r=>!r.task.writeOnly).map(r=>[r.id,r.index]),cases.map(c=>[c.id,c.index]));
 for(const c of cases){
  const task=at(c.id,c.index);assert.deepEqual(task,c.task);assert.equal(digest(JSON.stringify(stable(task))),c.taskHash);
  assert.equal(LESSONS[c.id].topicId,c.nodeId);assert.equal(binding(task,context(c)).nodeId,c.nodeId);
  for(const changed of [{...task,prompt:task.prompt+' '},{...task,extra:true},{...task,expression:task.expression+' '}])assert.equal(binding(changed,context(c)),null);
 }
});

test('each original visible reduction agrees with hand-checked quantities and the fixed exact final result',()=>{
 for(const c of cases){
  const m=solve(c),proof=accepts(c.task,m),expected=c.steps.map(([id,raw])=>({id,raw}));
  assert.deepEqual(proof.effectiveSteps.map(s=>({id:s.id,raw:s.raw})),expected);
  assert.deepEqual(proof.built.value,c.answer==='0.5'?['1','2']:[c.answer,'1']);
  assert.ok(proof.effectiveSteps.every(s=>s.exact));assert.equal(proof.retainedHistoryCount,m.history.length);
  assert.equal(proof.pending,null,'identical current and built text is not labelled an unapplied expression');
  assert.ok(thinkingGuide(c.task,context(c)));assert.ok(thinkingFeedback(c.task,m,saved(m),context(c)));
  assert.deepEqual(orderEvidenceExample(c.task),m,'original example drives the same currently visible path');
 }
});

test('exact raw-string grammar preserves parentheses, left association, powers, unary signs and rational square roots',()=>{
 for(const [raw,value] of [['-3^2',['-9','1']],['(-3)^2',['9','1']],['12/2*3',['18','1']],['12/(2*3)',['2','1']],['20-6+2',['16','1']],['20-(6+2)',['12','1']],['2^3^2',['512','1']],['√(9+16)',['5','1']],['√(1/4)',['1','2']],['5×（1÷5）',['1','1']],['+3',['3','1']],['1/5',['1','5']],['320.00000000000000000001-125',['19500000000000000000001','100000000000000000000']]])assert.deepEqual(exact(raw)?.value,value,raw);
 for(const raw of ['1 2','1e2','0x10','NaN','Infinity','2(3)','1..2','()',')3(','1+','globalThis','Math.sqrt(4)'])assert.equal(exact(raw),null,raw);
 assert.equal(exact('√2').value,null);assert.equal(exact('0.5^1000000000').value,null);
 assert.equal(exact('2^65').value,null);assert.equal(exact('2^64').value[0],'18446744073709551616');
});

test('independent sibling order is free, but an unready parent and unsuccessful reduction remain real failed history',()=>{
 const c=sourceCase('orderlab',1),t=c.task,m=M.initial(t);
 click(t,m,'op',{index:3});assert.notEqual(m.issue,'');field(t,m,'result','12');click(t,m,'reduce');assert.equal(m.board.steps.length,0);
 reduce(t,m,5,'8');reduce(t,m,1,'4');reduce(t,m,3,'12');field(t,m,'answer','12');
 const p=accepts(t,m);assert.equal(p.failedRequests.length,2);assert.deepEqual(p.effectiveSteps.map(s=>s.id),[5,1,3]);
 assert.deepEqual(p.effectiveSteps.at(-1).dependencies,[1,5]);
});

test('all native tasks retain failed reduction, corrected construction, reset fields and full earlier history',()=>{
 for(const c of cases){
  const t=c.task,m=M.initial(t);if(t.construct)build(t,m);
  click(t,m,'op',{index:c.steps[0][0]});field(t,m,'result','999999');click(t,m,'reduce');
  assert.notEqual(m.issue,'');const failed=copy(m.history);
  for(const [id,value] of c.steps)reduce(t,m,id,value);field(t,m,'answer',c.answer);
  assert.equal(accepts(t,m).failedRequests.length,1);assert.deepEqual(m.history.slice(0,failed.length),failed);
  const before=copy(m.history),oldFields={answer:m.answer,result:m.result};click(t,m,'reset');
  assert.deepEqual({answer:m.answer,result:m.result},oldFields,'reset keeps now-hidden fields');rejects(t,m);
  solve(c,m);const p=accepts(t,m);assert.deepEqual(m.history.slice(0,before.length),before);
  assert.ok(p.constructions.some(e=>e.kind==='reset'));assert.equal(p.effectiveSteps.length,c.steps.length);
 }
});

test('original tolerance can pass an inexact intermediate; only a real exact rebuild restores strict evidence',()=>{
 const c=sourceCase('powerorder',4),t=c.task,m=M.initial(t);build(t,m);
 reduce(t,m,3,'0.20000001');reduce(t,m,1,'1');field(t,m,'answer','1');
 assert.equal(M.inspect(t,m).correct,true);rejects(t,m);const old=copy(m.history);
 click(t,m,'reset');solve(c,m);const p=accepts(t,m);
 assert.deepEqual(m.history.slice(0,old.length),old);assert.equal(p.earlierInexactReductions.length,2);
 assert.equal(p.effectiveSteps[0].raw,'0.2');assert.deepEqual(p.effectiveSteps[0].expected,['1','5']);
});

test('rounded original literals cannot masquerade as exact source structure or a newly applied pending expression',()=>{
 const c=sourceCase('storyfraction'),t=c.task,m=M.initial(t),raw='320.00000000000000000001-125';
 build(t,m,raw);reduce(t,m,1,'195');field(t,m,'answer','195');assert.equal(M.inspect(t,m).correct,true);rejects(t,m);
 const old=copy(m.history);build(t,m);reduce(t,m,1,'195');field(t,m,'answer','195');accepts(t,m);
 assert.deepEqual(m.history.slice(0,old.length),old);field(t,m,'expression',raw);
 assert.equal(M.inspect(t,m).correct,true);rejects(t,m);
 field(t,m,'expression','320.00 − 125');const p=accepts(t,m);
 assert.equal(p.built.raw,'320-125');assert.equal(p.pending.raw,'320.00 − 125');assert.equal(p.pending.appliedByBuild,false);
  assert.equal(p.pending.editTimingKnown,false);
});

test('terminal failed builds preserve completed exact work, first attempt, original issue and later restored expression',()=>{
 for(const c of cases.filter(c=>c.task.construct)){
  const t=c.task,m=M.initial(t);build(t,m,'not an expression');const first=m.board.first;
  solve(c,m);const complete=copy(m.board),events=copy(m.history);build(t,m,'(');
  assert.notEqual(m.issue,'');assert.deepEqual(m.board,complete);field(t,m,'expression',t.expected);
  const p=accepts(t,m);assert.equal(p.firstBuild,first);assert.equal(p.currentIssue,m.issue);
  assert.equal(p.failedRequests.length,2);assert.deepEqual(m.history.slice(0,events.length),events);
  const forged=copy(m);forged.issue='';assert.equal(M.valid(t,forged),true);rejects(t,forged);
 }
});

test('old enormous powers and overlong failed text stay saved without unbounded exact work or permanent rejection',()=>{
 const c=sourceCase('storyfraction'),t=c.task,m=M.initial(t);
 build(t,m,'0.5^1000000000');reduce(t,m,1,'0');field(t,m,'answer','0');rejects(t,m);
 build(t,m,'9'.repeat(2000));assert.notEqual(m.issue,'');const old=copy(m.history);
 click(t,m,'reset');solve(c,m);const p=accepts(t,m);
 assert.deepEqual(m.history.slice(0,old.length),old);assert.equal(p.earlierInexactReductions.length,1);
 assert.equal(p.failedRequests.length,1);assert.equal(p.limits.exactPowerMagnitude,64);
});

test('real field visibility rejects hidden edits, completed controls, wrong attributes and fabricated API calls even before reset',()=>{
 const c=sourceCase('bracketlab'),t=c.task;
 const variants=[
  m=>{M.act(t,m,'b15-op',{index:c.steps[0][0]});},
  m=>{M.act(t,m,'b15-reduce');},
  m=>{m.result='88';M.act(t,m,'b15-reset');solve(c,m);},
  m=>{M.act(t,m,'b15-reset',{index:0});solve(c,m);},
  m=>{M.act(t,m,'b15-reset',{value:'unused'});solve(c,m);},
  m=>{m.expression=t.expression;M.act(t,m,'b15-build');for(const [id,value] of c.steps)reduce(t,m,id,value);field(t,m,'answer',c.answer);},
  m=>{m.reason='hidden';M.act(t,m,'b15-reset');solve(c,m);}
 ];
 for(const mutate of variants){const m=solve(c);mutate(m);assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejects(t,m);}
});

test('all root fields, board, first request, issue, data shape and event order fail closed when forged',()=>{
 const c=sourceCase('powerorder',4),t=c.task,good=solve(c);
 const changes=[m=>m.extra=true,m=>delete m.operator,m=>m.history[0].data.extra=true,m=>m.history[0].data.fields.extra='',
  m=>m.history[0].data.fields.result='1',m=>m.history[0].data.fields.expression=7,m=>m.history[1].data.index='3',
  m=>m.history[1].action='b15-tile',m=>m.board.first='forged',m=>m.board.expression='1',
  m=>m.board.tree.b.a.v=999,m=>m.board.done[3]=0.20000001,m=>m.board.steps[0].value=0.20000001,
  m=>m.issue='invented',m=>m.history.reverse(),m=>m.history=m.history.slice(1),m=>m.history.push(copy(m.history.at(-1)))];
 for(const change of changes){const m=copy(good);change(m);rejects(t,m);}
 for(const m of [null,[],{}, {...good,history:Array(2001).fill(good.history[0])}])rejects(t,m);
 for(const task of [null,{}, {...t,prompt:7},{...t,writeOnly:true},{...t,extra:true},{...t,type:'x-lawtiles'}])rejects(task,good);
});

test('full submitted snapshot remains mandatory; edits, reset, support, saved failures and old successful attempts remain distinct',()=>{
 for(const c of cases){
  const a=freshLesson(c.id);a.index=c.index;const m=modelForLesson(a),t=c.task;
  assert.equal(submitLesson(a).correct,false);const first=copy(a.cases[c.index].attempts);
  supportLesson(a);solve(c,m);assert.equal(submitLesson(a).correct,true);
  const before=copy(a.cases[c.index]);assert.ok(thinkingFeedback(t,m,before,context(c)));
  field(t,m,'answer',c.answer+' ');assert.equal(currentSubmission(a).status,'modified');
  assert.equal(thinkingFeedback(t,m,before,context(c)),null);assert.equal(submitLesson(a).correct,true);
  click(t,m,'reset');assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(t,m,a.cases[c.index],context(c)),null);
  solve(c,m);assert.equal(submitLesson(a).correct,true);assert.equal(currentSubmission(a).status,'correct');
  assert.deepEqual(a.cases[c.index].attempts.slice(0,first.length),first);assert.equal(a.cases[c.index].support,true);
  assert.deepEqual(validateLesson(copy(a),c.id),a);assert.equal(lessonSummary(a).cases[c.index].independent,false);
  // This is the existing shared retry transition, not a new persisted epoch.
  const old=copy(a.cases[c.index]);a.models[c.index]=M.initial(t);assert.equal(currentSubmission(a).status,'modified');
  assert.deepEqual(a.cases[c.index],old);solve(c,a.models[c.index]);assert.equal(submitLesson(a).correct,true);
  assert.deepEqual(a.cases[c.index].attempts.slice(0,old.attempts.length),old.attempts);
 }
});

test('three write-only native tasks and eleven associated tasks never inherit native qualification',()=>{
 assert.equal(excluded.length,3);assert.equal(associated.length,11);assert.equal(associated.filter(c=>c.task.writeOnly).length,2);
 const bridge=Object.keys(BRIDGES).flatMap(sessionId=>sessionTasks(sessionId).map((task,index)=>({sessionId,index,task}))).filter(r=>r.task.type==='x-orderlab');
 assert.deepEqual(bridge,associated);
 for(const c of [...excluded,...associated]){
  const t=at(c.sessionId,c.index),ctx={sessionId:c.sessionId,index:c.index},m=orderEvidenceExample(t);
  assert.equal(M.inspect(t,m).correct,true);assert.equal(binding(t,ctx),null);assert.equal(thinkingGuide(t,ctx),null);
  assert.equal(thinkingFeedback(t,m,saved(m),ctx),null);if(t.writeOnly)rejects(t,m);else accepts(t,m);
 }
});

test('the exact standalone browser plan and every boundary use genuine original visible controls and complete State submissions',async tcase=>{
 const counts={native:0,isolated:0,boundaries:0,actions:0,fields:0,submissions:0};
 const apply=(t,m,s)=>{applyOrderStep(t,m,s);counts[s.field?'fields':'actions']++;assert.equal(M.valid(t,m),true);};
 for(const c of [...cases,...excluded.map(c=>({...c,id:c.sessionId})),...associated.map(c=>({...c,id:c.sessionId}))]){
  const task=at(c.id,c.index),a=freshLesson(c.id);a.index=c.index;const m=modelForLesson(a);
  for(const step of browserPlan.operationPlan(task))apply(task,m,step);
  assert.equal(submitLesson(a).correct,true);counts.submissions++;
  if(c.nodeId&&cases.some(r=>r.id===c.id&&r.index===c.index)){counts.native++;accepts(task,m);}
  else{counts.isolated++;assert.equal(thinkingFeedback(task,m,a.cases[c.index],context(c)),null);}
 }
 for(const variant of browserPlan.boundaryVariants){
  const id=['inexact-intermediate','commuted-construction'].includes(variant)?'powerorder':variant==='insert-mismatch'?'bracketlab':
   ['unready-parent','independent-siblings'].includes(variant)?'orderlab':'storyfraction';
  const index=id==='powerorder'?4:id==='bracketlab'?2:id==='orderlab'?1:0;
  const c=sourceCase(id,index),task=c.task,a=freshLesson(id);a.index=index;const m=modelForLesson(a);
  const f=(key,value)=>apply(task,m,{field:key,value}),act=(name,data)=>apply(task,m,{action:'b15-'+name,data});
  const check=(correct,strict)=>{
   const prior=copy(a.cases[index]?.attempts||[]);assert.equal(submitLesson(a).correct,correct);counts.submissions++;
   assert.equal(!!replay(task,m),strict);assert.equal(!!thinkingFeedback(task,m,a.cases[index],context(c)),strict);
   assert.deepEqual(a.cases[index].attempts.slice(0,prior.length),prior);assert.deepEqual(validateLesson(copy(a),id),a);
  };
  await browserPlan.boundaryFlow(variant,{task,
   field:f,action:act,build:raw=>{f('expression',raw);act('build');},
   reduce:(nodeId,value)=>{act('op',{index:nodeId});f('result',value);act('reduce');},
   run:options=>{for(const s of browserPlan.operationPlan(task,options))apply(task,m,s);},check,
   staleReload:()=>{assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(task,m,a.cases[index],context(c)),null);
    const restored=validateLesson(copy(a),id);assert.deepEqual(restored,a);assert.equal(currentSubmission(restored).status,'modified');},
   model:()=>copy(m),assert:(value,message)=>assert.ok(value,message),shot:()=>{}});
  counts.boundaries++;
 }
 assert.deepEqual({native:counts.native,isolated:counts.isolated,boundaries:counts.boundaries},{native:17,isolated:14,boundaries:10});
 tcase.diagnostic(JSON.stringify({originalVisibleControlProbe:counts,chromium:false}));
});
