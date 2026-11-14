import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-storyledger-cases.cjs';
import planner from './fixtures/p9-storyledger-controls.cjs';
import * as M from '../dist/learning/phase5/b11-model.js';
import * as V from '../dist/learning/phase5/b11-view.js';
import {storyLedgerBinding as binding,replayStoryLedgerEvidence as replay} from '../dist/learning/storyledger-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {freshLesson,submitLesson} from '../dist/learning/state.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {sessionTasks,sessionMeta,BRIDGES} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();
const clone=structuredClone,ctx=c=>({sessionId:c.id,index:c.index}),task=c=>sessionTasks(c.id)[c.index];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=b=>createHash('sha256').update(b).digest('hex'),hash=v=>digest(JSON.stringify(stable(v)));
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const counters={paths:0,fields:0,buttons:0};
function step(t,m,s){const html=V.render(t,m);if(s.field){const found=[...html.matchAll(/<(input|select|textarea)\b[^>]*>/g)].filter(x=>attrs(x[0])['data-xfield']===s.field);assert.equal(found.length,1,'visible field '+s.field);assert.doesNotMatch(found[0][0],/\bdisabled\b/);if(found[0][1]==='select')assert.ok(html.slice(found[0].index,html.indexOf('</select>',found[0].index)).includes('value="'+s.value+'"'));m[s.field]=s.value;M.field(t,m,s.field);counters.fields++;}
 else{const button=[...html.matchAll(/<button\b[^>]*>/g)].find(x=>attrs(x[0])['data-x']===s.action);assert.ok(button);assert.doesNotMatch(button[0],/\bdisabled\b/);const before=clone(m);M.act(t,m,s.action);assert.equal(m.history.length,before.history.length+1);assert.deepEqual(m.history.slice(0,-1),before.history);assert.deepEqual(m.history.at(-1),{action:'b11-event',index:before.cursor,op:before.op,amount:before.amount,result:before.result,method:before.method});counters.buttons++;}assert.equal(M.valid(t,m),true);return m;}
function commit(t,m,values){for(const s of planner.steps(values))step(t,m,s);return m;}
function finish(t,m=M.initial(t),variant=0){while(m.cursor<t.steps.length)commit(t,m,planner.row(t,m.cursor,variant));counters.paths++;assert.equal(M.inspect(t,m).correct,true);return m;}
function accepts(t,m){const before=JSON.stringify(m),p=replay(t,m);assert.ok(p);assert.equal(JSON.stringify(m),before);return p;}
function rejects(t,m){const before=JSON.stringify(m);assert.equal(replay(t,m),null);assert.equal(JSON.stringify(m),before);}
const record=m=>({support:false,attempts:[{value:clone(m)}]});

test('fixed 8 native and 5 associated sources match every task fingerprint and unchanged source modules',()=>{
 assert.equal(fixture.cases.length,8);assert.equal(fixture.associatedCases.length,5);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,3);
 for(const [file,sha]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+file,import.meta.url))),sha);
 for(const c of [...fixture.cases,...fixture.associatedCases]){assert.deepEqual(task(c),c.task);assert.equal(hash(task(c)),c.taskHash);}
 for(const [catalog,expected]of [[LESSONS,fixture.cases],[BRIDGES,fixture.associatedCases]]){const found=[];for(const id of Object.keys(catalog))sessionTasks(id).forEach((t,index)=>{if(t.type==='x-storyledger')found.push(id+':'+index);});assert.deepEqual(found.sort(),expected.map(c=>c.id+':'+c.index).sort());}
});

for(const c of fixture.cases){
 test(c.id+':'+c.index+' exact units and current full submission allow only bounded source feedback',()=>{
  const t=task(c),m=finish(t),p=accepts(t,m);assert.equal(binding(t,ctx(c)).nodeId,c.nodeId);assert.equal(sessionMeta(c.id).topicId,c.nodeId);assert.equal(binding(t,ctx(c)).method,null);
  assert.deepEqual([p.start,...p.accepted.map(e=>e.balanceAfter)],c.balances);assert.equal(p.signedTotal,c.balances.at(-1)-c.balances[0]);assert.equal(p.failed.length,0);assert.equal(p.methodAssessed,false);assert.equal(p.mentalStrategyAssessed,false);assert.equal(p.physicalManipulationAssessed,false);
  const fb=thinkingFeedback(t,m,record(m),ctx(c));assert.ok(thinkingGuide(t,ctx(c)));assert.ok(fb);assert.equal(fb.method,null);assert.match(JSON.stringify(fb),/只作为自己的方法记录/);assert.match(JSON.stringify(fb),/长期掌握/);assert.doesNotMatch(JSON.stringify(fb),/MP\.\d|你独立|已经掌握/);
  assert.equal(thinkingFeedback(t,m,{attempts:[]},ctx(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:M.initial(t)}]},ctx(c)),null);
 });
 test(c.id+':'+c.index+' all normal wrong submissions stay visible in replay and correction advances only the same cursor',()=>{
  const t=task(c),m=M.initial(t);let balance=t.start;
  for(let i=0;i<t.steps.length;i++){const beforeSaved=clone(m.saved),first=planner.wrongRow(t,i,'operation');for(const kind of ['operation','amount','result','empty-method','empty-operation','unparsed','overprecision']){commit(t,m,planner.wrongRow(t,i,kind));assert.equal(m.cursor,i);assert.deepEqual(m.saved,beforeSaved);assert.ok(m.issue);rejects(t,m);}
   assert.deepEqual(m.first[i],first);commit(t,m,planner.row(t,i,1));assert.equal(m.cursor,i+1);assert.deepEqual(m.first[i],first);balance=c.balances[i+1];assert.equal(M.number(m.saved[i].result,t.scale??1),balance);}
  const p=accepts(t,m);assert.equal(p.failed.length,t.steps.length*7);assert.equal(p.events.length,m.history.length);assert.deepEqual(p.events.map(e=>e.stepIndex),m.history.map(e=>e.index));
  for(const e of p.failed){assert.equal(e.cursorAfter,e.cursorBefore);assert.equal(e.balanceAfter,e.balanceBefore);assert.ok(e.failures.length>0);}assert.deepEqual(p.first,m.first);assert.equal(p.end,balance);
  const fb=thinkingFeedback(t,m,record(m),ctx(c));assert.match(JSON.stringify(fb),/未推进的提交/);assert.match(JSON.stringify(fb),/首尝试/);
 });
 test(c.id+':'+c.index+' all three method choices and exact numeric aliases remain self-reported choices',()=>{
  for(let v=0;v<3;v++){const t=task(c),m=finish(t,M.initial(t),v),p=accepts(t,m);assert.ok(p.events.every(e=>e.methodChoiceAttribution==='self-report-only'));assert.deepEqual(p.accepted.map(e=>e.raw.method),t.steps.map((_,i)=>planner.methods[(i+v)%3]));}
 });
 test(c.id+':'+c.index+' structural history corruption cannot borrow a correct final ledger',()=>{
  const t=task(c),m=finish(t);for(const mutate of [x=>x.history=[],x=>x.history[0].action='b11-estimate',x=>x.history[0].index=1,x=>x.history[0].result='999',x=>x.first=[],x=>x.first[0].result='999',x=>x.saved[0].method='tool',x=>x.saved[0].amount='+'+x.saved[0].amount,x=>x.amount='1',x=>x.extra=true,x=>x.history[0].extra=true,x=>x.history[0].method='invented',x=>x.history.push(clone(x.history.at(-1))),x=>x.issue='extra']){const n=clone(m);mutate(n);rejects(t,n);}
 });
 test(c.id+':'+c.index+' five real State submissions preserve all older attempts across explicit current-model retries',()=>{
  const t=task(c),a=freshLesson(c.id);a.view='task';a.index=c.index;const checked=[];
  const check=correct=>{const old=clone(a.cases[c.index]?.attempts||[]),result=submitLesson(a);assert.equal(result.correct,correct);assert.deepEqual(a.cases[c.index].attempts.slice(0,-1),old);checked.push(clone(a.cases[c.index].attempts.at(-1)));assert.equal(!!thinkingFeedback(t,a.models[c.index],a.cases[c.index],ctx(c)),correct);};
  a.models[c.index]=M.initial(t);commit(t,a.models[c.index],planner.wrongRow(t,0,'operation'));check(false);finish(t,a.models[c.index],0);check(true);
  // This is exactly the existing p3-retry model replacement; the browser test
  // must additionally click the real shared UI control and inspect its storage.
  a.models[c.index]=M.initial(t);assert.equal(thinkingFeedback(t,a.models[c.index],a.cases[c.index],ctx(c)),null);commit(t,a.models[c.index],planner.wrongRow(t,0,'amount'));check(false);finish(t,a.models[c.index],1);check(true);
  a.models[c.index]=M.initial(t);finish(t,a.models[c.index],2);assert.equal(thinkingFeedback(t,a.models[c.index],a.cases[c.index],ctx(c)),null);check(true);
  assert.deepEqual(a.cases[c.index].attempts,checked);assert.equal(checked.length,5);assert.ok(checked.every(x=>x.value&&typeof x.id==='string'&&typeof x.at==='string'));
 });
}

for(const c of fixture.associatedCases)test(c.id+':'+c.index+' reuses real controls without inheriting native evidence or method labels',()=>{
 const t=task(c),m=M.initial(t);commit(t,m,planner.wrongRow(t,0,'result'));finish(t,m,1);accepts(t,m);assert.equal(binding(t,ctx(c)),null);assert.equal(thinkingGuide(t,ctx(c)),null);assert.equal(thinkingFeedback(t,m,record(m),ctx(c)),null);
});
test('malformed JSON contexts fail before property lookup and no source fingerprint may drift',()=>{
 for(const c of fixture.cases){const t=task(c),m=finish(t);for(const context of [null,[],true,false,1,'storymoney',{}, {sessionId:null,index:0},{sessionId:[],index:0},{sessionId:{toString:null},index:0},{sessionId:c.id,index:'0'},{sessionId:c.id,index:{}},{sessionId:c.id,index:-1},{sessionId:'__proto__',index:0},{sessionId:'constructor',index:0}]){assert.equal(binding(t,context),null);assert.equal(thinkingGuide(t,context),null);assert.equal(thinkingFeedback(t,m,record(m),context),null);}
  assert.equal(binding({...t,prompt:t.prompt+' changed'},ctx(c)),null);const changed=clone(t);changed.steps[0].amount++;assert.equal(binding(changed,ctx(c)),null);}
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>assert.equal(binding(t,{sessionId:id,index}),null));
});
test('comparison and target-gap sources describe the tracked quantity instead of physical transactions',()=>{
 for(const [id,index,role,words]of [['storymoney',2,'smaller-comparison',/较小数量/],['storylarger',2,'remaining-goal',/距离目标还差/],['storymoney',1,'remaining-length',/余下的长度/]]){const t=sessionTasks(id)[index],m=finish(t),c={sessionId:id,index};assert.equal(binding(t,c).role,role);assert.match(JSON.stringify(thinkingFeedback(t,m,record(m),c)),words);}
});
test('a repeated rejected submission is retained rather than silently deduplicated or treated as advancement',()=>{
 const t=task(fixture.cases[0]),m=M.initial(t),bad=planner.wrongRow(t,0,'result');commit(t,m,bad);commit(t,m,bad);finish(t,m);const p=accepts(t,m);assert.equal(p.failed.length,2);assert.equal(p.failed[0].balanceAfter,p.start);assert.equal(p.failed[1].stepIndex,0);assert.deepEqual(p.first[0],bad);
});
test('arithmetically consistent but wrong source interpretations do not advance comparison or target-gap work',()=>{
 for(const [id,index,wrong]of [['storymoney',2,{op:'+',amount:'8',result:'40',method:'mental'}],['storylarger',2,{op:'+',amount:'12450',result:'37450',method:'written'}]]){
  const t=sessionTasks(id)[index],m=M.initial(t);commit(t,m,wrong);assert.equal(m.cursor,0);assert.deepEqual(m.saved,[]);finish(t,m,1);
  const p=accepts(t,m);assert.equal(p.failed.length,1);assert.deepEqual(p.failed[0].raw,wrong);assert.equal(p.failed[0].balanceAfter,t.start);assert.ok(p.failed[0].failures.includes('operation-does-not-match-source-event'));assert.deepEqual(p.first[0],wrong);
 }
});
test('the original exact-decimal grammar preserves signed and zero aliases without admitting erased precision',()=>{
 const t=sessionTasks('storymillion')[3];for(const bad of ['34.750001','3 4.75','3.475e1','34.75/1']){const m=M.initial(t),wrong={...planner.row(t,0),amount:bad};commit(t,m,wrong);assert.equal(m.cursor,0);finish(t,m,1);const p=accepts(t,m);assert.equal(p.failed.length,1);assert.deepEqual(p.first[0],wrong);assert.equal(p.end,4915);}
 const m=M.initial(t),good=planner.row(t,0);good.amount=' ＋034.750000 ';good.result='＋065.250000';commit(t,m,good);finish(t,m,1);const p=accepts(t,m);assert.equal(p.failed.length,0);assert.equal(p.accepted[0].raw.amount,good.amount);assert.equal(p.accepted[0].balanceAfter,6525);
});
test('unknown structure fails closed without mutating input or changing original completion',()=>{
 const t=task(fixture.cases[0]),m=finish(t);for(const bad of [null,[],true,42,{}, {...m,history:null},{...m,first:[null]},{...m,cursor:'2'}])rejects(t,bad);
 const gap=clone(m);gap.history=[];assert.equal(M.valid(t,gap),true);assert.equal(M.inspect(t,gap).correct,true);rejects(t,gap);assert.equal(M.inspect(t,m).correct,true);
});
test('probe totals are model/view calls and do not assert Chromium or child learning outcomes',()=>{assert.ok(counters.paths>=40);assert.ok(counters.buttons>300);assert.ok(counters.fields===counters.buttons*4);});
