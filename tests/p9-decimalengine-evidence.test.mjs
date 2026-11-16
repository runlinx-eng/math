import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-decimalengine-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {TASKS,PRACTICE} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b17-model.js';
import * as V from '../dist/learning/phase5/b17-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import {decimalEngineBinding as binding,replayDecimalEngineEvidence as replay} from '../dist/learning/decimalengine-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

// Independent test author: literal original task/source fingerprints, manually
// calculated rows and BigInt checks. No new core helper, M.solveSteps or example
// produces expected mathematics. Renderer checks below are Node probes, not Chrome.
await ensureB39Ready();
const {cases,bridges,practices}=fixture,cp=structuredClone;
const FIELDS=['answer','fraction','decimal','factor','denom','num','position','left','right','prediction','relation','reason','hcf','q','remainder','kind','percent','amount','multiplier','divisor','offset','n','aform','bform','whole','part','angle','equation'];
const VISIBLE=['fraction','factor','kind','q','remainder','answer','reason'];
const task=c=>sessionTaskFor(c.id,c.index),at=(id,index)=>cases.find(c=>c.id===id&&c.index===index);
const expected=c=>c.expected||cases.find(native=>native.taskHash===c.taskHash).expected;
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const metrics={fields:0,buttons:0,acceptedModels:0,factorOrders:0,submissions:0,actualChromium:false};
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
function exact(n,d=1n){n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];}
const pair=q=>q.map(Number);
const add=(a,b)=>exact(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
function permutations(xs){
 if(!xs.length)return[[]];
 return [...new Set(xs)].flatMap(x=>{const copy=[...xs];copy.splice(copy.indexOf(x),1);
  return permutations(copy).map(rest=>[x,...rest]);});
}
function decimalValue(integer,nonrepeat,repeat){
 const scale=10n**BigInt(nonrepeat.length),whole=BigInt(integer)*scale+BigInt(nonrepeat||'0');
 if(!repeat)return exact(whole,scale);
 const cycle=10n**BigInt(repeat.length)-1n;
 return exact(whole*cycle+BigInt(repeat),scale*cycle);
}
function field(t,m,key,value){
 const html=V.render(t,m),controls=[...html.matchAll(/<(input|select|textarea)\b[^>]*>/g)]
  .filter(x=>attrs(x[0])['data-xfield']===key);
 assert.equal(controls.length,1,'unique original visible field '+key);
 const tag=controls[0][0],a=attrs(tag);assert.doesNotMatch(tag,/\bdisabled\b/);
 if(a.maxlength)assert.ok(String(value).length<=Number(a.maxlength));
 if(controls[0][1]==='select'){
  const section=html.slice(controls[0].index,html.indexOf('</select>',controls[0].index));
  assert.ok([...section.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)),
   'original option '+key+'='+value);
 }
 m[key]=String(value);M.field(t,m,key);metrics.fields++;return m;
}
function act(t,m,action){
 const buttons=(V.render(t,m).match(/<button\b[^>]*>/g)||[])
  .filter(s=>attrs(s)['data-x']==='b17-'+action);
 assert.equal(buttons.length,1,'unique original visible button '+action);
 assert.doesNotMatch(buttons[0],/\bdisabled\b/);
 assert.equal(attrs(buttons[0])['data-index'],undefined);
 const n=m.history.length;M.act(t,m,'b17-'+action);
 assert.equal(m.history.length,Math.min(n+1,1500));metrics.buttons++;return m;
}
const rawAct=(t,m,a,data={})=>M.act(t,m,'b17-'+a,data);
function reduce(c,m,raw=expected(c).simple.join('/')){
 field(task(c),m,'fraction',raw);act(task(c),m,'reduce');return m;
}
function factorize(c,m,order=expected(c).factorOrders[0],spell=String){
 for(const k of order.slice(m.board.factors.length)){field(task(c),m,'factor',spell(k));act(task(c),m,'factor');}
 return m;
}
function predict(c,m,kind=expected(c).kind){field(task(c),m,'kind',kind);act(task(c),m,'predict-stop');return m;}
function divide(c,m,spell=String){
 for(const row of expected(c).rows.slice(m.board.rows.length)){
  field(task(c),m,'q',spell(row.quotient));field(task(c),m,'remainder',spell(row.remainder));act(task(c),m,'digit');
 }return m;
}
function answer(c,m,raw=expected(c).answer,reason='base-ten'){
 field(task(c),m,'answer',raw);field(task(c),m,'reason',reason);return m;
}
function finish(c,m=M.initial(task(c)),options={}){
 if(!m.board.simple)reduce(c,m,options.fraction);
 if(m.board.factorLeft>1)factorize(c,m,options.order,options.factorSpelling);
 if(!m.board.prediction)predict(c,m,options.prediction);
 if(!m.board.stop)divide(c,m,options.digitSpelling);
 field(task(c),m,'kind',expected(c).kind);
 if(m.board.prediction!==expected(c).kind)act(task(c),m,'predict-stop');
 return answer(c,m,options.answer);
}
const record=m=>({support:false,attempts:[{value:cp(m)}]});
function rejects(c,m,label=''){
 const before=JSON.stringify(m);assert.equal(replay(task(c),m),null,label);
 assert.equal(JSON.stringify(m),before,'rejection does not mutate original data');
}
function originalOnly(c,m,label){
 assert.equal(M.valid(task(c),m),true,label+' remains an original-valid record');
 assert.equal(M.inspect(task(c),m).correct,true,label+' preserves original grading');rejects(c,m,label);
}
function accepts(c,m){
 const t=task(c),e=expected(c),before=JSON.stringify(m);
 assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
 const p=replay(t,m);assert.ok(p,c.id+':'+c.index+' strict proof');
 assert.equal(JSON.stringify(m),before,'replay reads without editing');
 assert.deepEqual(p.originalQuantity,[t.n,t.d]);assert.deepEqual(p.simple,e.simple);assert.deepEqual(p.value,e.simple);
 assert.deepEqual(p.factorization.factors,m.board.factors);
 assert.equal(p.factorization.denominator,e.simple[1]);assert.equal(p.factorization.residualDenominator,1);
 assert.equal(p.factorization.product,e.simple[1]);
 assert.equal(p.factorization.onlyTwoAndFive,e.kind==='stop');
 assert.deepEqual(p.rows.map(row=>({input:row.input,quotient:row.quotient,remainder:row.remainder})),e.rows);
 let share=exact(0);
 for(let i=0;i<p.rows.length;i++){
  const row=p.rows[i],want=e.rows[i],den=BigInt(e.simple[1]),unit=10n**BigInt(i);
  assert.equal(row.index,i);assert.equal(BigInt(want.input),BigInt(want.quotient)*den+BigInt(want.remainder));
  assert.ok(want.remainder>=0&&want.remainder<e.simple[1]);
  assert.deepEqual(row.unit,pair(exact(1n,unit)));
  assert.deepEqual(row.inputQuantity,pair(exact(want.input,unit)));
  assert.deepEqual(row.allocatedQuantity,pair(exact(BigInt(want.quotient)*den,unit)));
  assert.deepEqual(row.remainingQuantity,pair(exact(want.remainder,unit)));
  assert.deepEqual(row.shareIncrement,pair(exact(want.quotient,unit)));
  assert.equal(row.enteredQuotient.value,want.quotient);assert.equal(row.enteredRemainder.value,want.remainder);
  assert.equal(row.enteredQuotient.numberSemantics,true);assert.equal(row.enteredRemainder.numberSemantics,true);
  share=add(share,exact(want.quotient,unit));
 }
 if(e.kind==='stop')assert.deepEqual(pair(share),e.simple);
 assert.equal(p.expansion.kind,e.kind);assert.equal(p.expansion.integerDigits,e.integerDigits);
 assert.equal(p.expansion.nonrepeatingDigits,e.nonrepeatingDigits);assert.equal(p.expansion.repeatingDigits,e.repeatingDigits);
 assert.equal(p.expansion.cycleIndex,e.cycleIndex);
 assert.equal(p.expansion.cycleStartFractionalPlace,e.cycleStartFractionalPlace);
 assert.equal(p.expansion.firstRepeatedRemainder,e.firstRepeatedRemainder);
 assert.deepEqual(p.expansion.exactValue,e.simple);
 assert.deepEqual(m.board.remainders,e.remainders);assert.equal(m.board.stop,true);assert.equal(m.board.cycle,e.cycleIndex);
 assert.equal(p.answer.raw,m.answer);assert.equal(p.eventCount,m.history.length);
 assert.equal(p.events.length,m.history.length);assert.deepEqual(p.finalConstruction,m.board);
 assert.equal(p.issue,m.issue);assert.equal(p.finalPrediction.value,e.kind);
 assert.equal(p.firstPrediction.value,m.board.first);
 assert.equal(p.failedRequests.length,p.events.filter(x=>!x.accepted).length);
 assert.equal(p.resets.length,p.events.filter(x=>x.action==='reset').length);
 for(const event of p.events){
  const original=m.history[event.historyIndex];assert.ok(original);
  assert.equal(event.action,original.a);
  assert.deepEqual(event.fields,Object.fromEntries(VISIBLE.map(key=>[key,original.f[key]])));
 }
 assert.equal(p.assessmentLimits.recordingLimit,1500);
 assert.equal(p.assessmentLimits.allLaterClicksRecorded,false);
 assert.equal(p.assessmentLimits.historyCompletenessAuthenticated,false);
 metrics.acceptedModels++;return p;
}

test('literal six native sources, three associated positions, one practice and original files remain exact',()=>{
 assert.equal(cases.length,6);assert.equal(new Set(cases.map(c=>c.nodeId)).size,2);
 assert.equal(bridges.length,3);assert.equal(practices.length,1);
 assert.deepEqual(Object.keys(M.fields),FIELDS);
 const native=Object.entries(TASKS).flatMap(([id,ts])=>ts.flatMap((t,index)=>t.type==='x-decimalengine'?[id+':'+index]:[]));
 assert.deepEqual(native.sort(),cases.map(c=>c.id+':'+c.index).sort());
 const related=Object.entries(BRIDGES).flatMap(([id,b])=>b.tasks.flatMap((t,index)=>t.type==='x-decimalengine'?[id+':'+index]:[]));
 assert.deepEqual(related.sort(),bridges.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(Object.entries(PRACTICE).filter(([,t])=>t.type==='x-decimalengine').map(([id])=>id),['fdpswitch']);
 for(const c of [...cases,...bridges,...practices]){
  assert.deepEqual(task(c),c.task);assert.equal(hash(task(c)),c.taskHash);
  assert.equal((LESSONS[c.id]||BRIDGES[c.id]).topicId,c.nodeId);
 }
 for(const [path,want]of Object.entries(fixture.sourceHashes))
  assert.equal(digest(fs.readFileSync(new URL('../'+path,import.meta.url))),want,path);
});

test('manual fraction, row and repeating-block expectations have an independent exact mathematical check',()=>{
 let count=0;
 for(const c of cases){
  const e=c.expected;assert.deepEqual(pair(exact(c.task.n,c.task.d)),e.simple);
  assert.deepEqual(pair(decimalValue(e.integerDigits,e.nonrepeatingDigits,e.repeatingDigits)),e.simple);
  assert.deepEqual(permutations(e.factorOrders[0]).sort(),cp(e.factorOrders).sort());
  for(const order of e.factorOrders){assert.equal(order.reduce((a,b)=>a*b,1),e.simple[1]);count++;}
  let rem=e.simple[0];const seen=[];
  for(let i=0;i<e.rows.length;i++){
   const row=e.rows[i],input=i?rem*10:rem;
   assert.equal(row.input,input);assert.equal(row.quotient,Number(BigInt(input)/BigInt(e.simple[1])));
   assert.equal(row.remainder,Number(BigInt(input)%BigInt(e.simple[1])));rem=row.remainder;
   if(rem!==0&&!seen.includes(rem))seen.push(rem);
  }
  assert.deepEqual(seen,e.remainders);
  assert.equal(e.kind==='stop',rem===0);
 }
 assert.equal(count,11);
});

test('binding requires exact native source/task/index; similar associated and practice contexts remain excluded',()=>{
 for(const c of cases){
  const t=task(c),source=binding(cp(t),{sessionId:c.id,index:c.index});
  assert.ok(source);assert.equal(source.nodeId,c.nodeId);assert.equal(source.method,null);
  assert.equal(typeof source.question,'string');assert.ok(source.question.length);
  for(const context of [null,{},[],{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},
   {sessionId:'missing',index:c.index},{sessionId:c.id,index:c.index+100}])
   assert.equal(binding(t,context),null);
  for(const bad of [{...t,n:t.n+1},{...t,d:t.d+1},{...t,prompt:t.prompt+' '},{...t,type:'x-fracrename'},{...t,extra:true}]){
   assert.equal(binding(bad,c),null);assert.equal(replay(bad,finish(c)),null);
  }
 }
 for(const c of [...bridges,...practices])assert.equal(binding(task(c),c),null);
});

for(const c of cases)test(c.id+':'+c.index+' accepts every independently enumerated legal prime-factor order through original visible controls',()=>{
 for(const order of c.expected.factorOrders){
  const m=finish(c,undefined,{order}),p=accepts(c,m);metrics.factorOrders++;
  assert.deepEqual(p.factorization.factors,order);assert.equal(p.firstPrediction.matchesExpected,true);
  assert.equal(p.currentRoundFirstPrediction.matchesExpected,true);assert.equal(p.failedRequests.length,0);
  assert.equal(p.reduction.raw,c.expected.simple.join('/'));
 }
});

for(const c of cases)test(c.id+':'+c.index+' retains failed reduction/factor/digit, wrong first prediction, correction and reset',()=>{
 const t=task(c),e=c.expected,m=M.initial(t);
 field(t,m,'fraction',String(e.simple[0]*2)+'/'+String(e.simple[1]*2));let before=cp(m.board);
 act(t,m,'reduce');assert.deepEqual(m.board,before);assert.ok(m.issue);assert.equal(m.board.first,null);
 reduce(c,m);field(t,m,'factor','4');before=cp(m.board);act(t,m,'factor');
 assert.deepEqual(m.board,before);assert.ok(m.issue);factorize(c,m);
 predict(c,m,'');assert.equal(m.board.first,null);assert.equal(m.board.prediction,null);assert.equal(m.issue,'');
 predict(c,m,e.kind==='stop'?'repeat':'stop');assert.notEqual(m.board.first,e.kind);
 field(t,m,'q','-1');field(t,m,'remainder',String(e.rows[0].remainder));before=cp(m.board);
 act(t,m,'digit');assert.deepEqual(m.board,before);assert.ok(m.issue);divide(c,m);
 field(t,m,'kind',e.kind);answer(c,m);assert.equal(M.inspect(t,m).correct,false);
 rejects(c,m,'editing the final select is not resubmitting its prediction');
 act(t,m,'predict-stop');let p=accepts(c,m);
 assert.equal(p.firstPrediction.matchesExpected,false);assert.equal(p.finalPrediction.matchesExpected,true);
 assert.ok(p.events.some(event=>event.action==='predict-stop'&&event.accepted&&event.mathematicallyCorrect===false));
 assert.ok(p.failedRequests.some(event=>event.action==='reduce'));
 assert.ok(p.failedRequests.some(event=>event.action==='factor'));
 assert.ok(p.failedRequests.some(event=>event.action==='digit'));
 const first=p.firstPrediction,history=cp(m.history),fields=Object.fromEntries(FIELDS.map(k=>[k,m[k]]));
 act(t,m,'reset');assert.deepEqual(Object.fromEntries(FIELDS.map(k=>[k,m[k]])),fields);
 assert.deepEqual(m.history.slice(0,history.length),history);assert.equal(m.board.first,first.value);
 assert.equal(M.inspect(t,m).correct,false);finish(c,m);p=accepts(c,m);
 assert.deepEqual(p.firstPrediction,first);assert.equal(p.currentRoundFirstPrediction.matchesExpected,true);
 assert.equal(p.resets.length,1);assert.ok(p.currentRoundFirstPrediction.historyIndex>first.historyIndex);
});

test('all intermediate stages remain incomplete, including a factorization without actual division rows',()=>{
 for(const c of cases){
  const m=M.initial(task(c));rejects(c,m);reduce(c,m);rejects(c,m);factorize(c,m);rejects(c,m);
  predict(c,m);rejects(c,m);
  const last=c.expected.rows.length-1;
  for(let i=0;i<last;i++){
   field(task(c),m,'q',c.expected.rows[i].quotient);field(task(c),m,'remainder',c.expected.rows[i].remainder);
   act(task(c),m,'digit');rejects(c,m);
  }
  divide(c,m);rejects(c,m,'finished long division without final submitted answer/reason');answer(c,m);accepts(c,m);
 }
});

test('reduce permits original finite-decimal/percent normalization but fraction syntax must already be simplest',()=>{
 for(const [id,index,forms]of [['fdpswitch',0,['0.375','37.5%','+0.375']],
  ['decimalstops',2,['0.175','17.5%']],['decimalstops',4,['0.4','40%']]]){
  const c=at(id,index);
  for(const raw of forms){const m=finish(c,undefined,{fraction:raw}),p=accepts(c,m);
   assert.equal(p.reduction.raw,raw);assert.deepEqual(p.reduction.normalizedPair,c.expected.simple);
   assert.equal(p.reduction.systemReduced,true);
  }
 }
 const c=at('decimalstops',4),m=M.initial(task(c));reduce(c,m,'6/15');
 assert.equal(m.board.simple,null);assert.ok(m.issue);finish(c,m);accepts(c,m);
 // Original mixed-number tokens split on ordinary spaces/slashes; adjacent
 // tabs remain inside a token. These cases check the exact existing grammar.
 for(const raw of ['0 \t2/5','0\t 2/5']){
  const built=finish(c,undefined,{fraction:raw}),p=accepts(c,built);
  assert.equal(p.reduction.raw,raw);assert.equal(p.reduction.inputForm,'mixed');
  assert.equal(p.reduction.toolNormalized,false);
 }
 const rejected=M.initial(task(c));reduce(c,rejected,'0\t2/5');
 assert.equal(rejected.board.simple,null);assert.ok(rejected.issue);
 finish(c,rejected);assert.ok(accepts(c,rejected).failedRequests.some(e=>e.action==='reduce'));
});

test('original Number input semantics accept hex, exponent, blank zero and rounded spellings without claiming raw exact arithmetic',()=>{
 const c=at('fdpswitch',0),t=task(c);
 for(const spelling of [n=>'0x'+n.toString(16),n=>n+'e0',n=>' '+n+' ',n=>n===0?'':n+'.0000000000000001']){
  const m=finish(c,undefined,{factorSpelling:spelling,digitSpelling:spelling}),p=accepts(c,m);
  for(const row of p.rows){
   assert.equal(row.enteredQuotient.raw,spelling(row.quotient));
   assert.equal(row.enteredRemainder.raw,spelling(row.remainder));
   assert.equal(row.enteredQuotient.numberSemantics,true);
  }
 }
 const m=finish(c,undefined,{factorSpelling:n=>n+'.0000000000000001',digitSpelling:n=>n===0?'1e-999':String(n)});
 const p=accepts(c,m);assert.equal(p.rows[0].enteredQuotient.raw,'1e-999');
 assert.equal(p.rows[0].enteredQuotient.value,0);
 const bad=M.initial(t);reduce(c,bad);field(t,bad,'factor','Infinity');act(t,bad,'factor');
 assert.equal(bad.board.factorLeft,8);assert.ok(bad.issue);finish(c,bad);accepts(c,bad);
});

test('finite final answers use original exact B16 syntax; they are not restricted to decimal spelling',()=>{
 const c=at('fdpswitch',0),t=task(c),m=finish(c);
 for(const raw of ['0.375','+0.375','000.375','0.37500000','3/8','6/16','0 3/8',' 3/8 ','37500000/100000000']){
  field(t,m,'answer',raw);accepts(c,m);
 }
 for(const raw of ['.375','3.75e-1','37.5%','0.375000000','0.37499999','0.376','3 / 8','1/3']){
  field(t,m,'answer',raw);assert.equal(M.inspect(t,m).correct,false,raw);rejects(c,m,raw);
 }
});

test('repeating final answers are the exact repeating block, not an approximation, whole decimal or trimmed string',()=>{
 for(const c of cases.filter(c=>c.expected.kind==='repeat')){
  const t=task(c),m=finish(c),block=c.expected.answer;
  for(const raw of [block+' ', ' '+block,block+block,'0.'+block,block+'.0','+'+block,'0'+block,block+'…']){
   field(t,m,'answer',raw);assert.equal(M.inspect(t,m).correct,false,raw);rejects(c,m,raw);
  }
  field(t,m,'answer',block);const p=accepts(c,m);
  assert.equal(p.expansion.cycleStartFractionalPlace,c.expected.cycleIndex+1);
 }
});

test('incorrect long-division rows preserve the entire construction and original error until a real correction action',()=>{
 const c=at('decimalstops',3),t=task(c),m=M.initial(t);reduce(c,m);factorize(c,m);predict(c,m);
 for(const row of c.expected.rows){
  field(t,m,'q',row.quotient+1);field(t,m,'remainder',row.remainder);
  const prior=cp(m.board);act(t,m,'digit');const issue=m.issue;
  assert.deepEqual(m.board,prior);assert.ok(issue);
  field(t,m,'q',row.quotient);assert.equal(m.issue,issue);rejects(c,m);
  act(t,m,'digit');assert.equal(m.issue,'');
 }
 answer(c,m);const p=accepts(c,m);assert.equal(p.failedRequests.filter(e=>e.action==='digit').length,3);
 for(const e of p.failedRequests.filter(e=>e.action==='digit'))assert.deepEqual(e.before,e.after);
});

test('wrong final classification and reason remain wrong; changing kind without a real predict action cannot repair stored prediction',()=>{
 for(const c of cases){
  const t=task(c),m=finish(c);predict(c,m,c.expected.kind==='stop'?'repeat':'stop');
  field(t,m,'kind',c.expected.kind);assert.equal(M.inspect(t,m).correct,false);rejects(c,m);
  act(t,m,'predict-stop');field(t,m,'reason','size');assert.equal(M.inspect(t,m).correct,false);rejects(c,m);
  field(t,m,'reason','base-ten');accepts(c,m);
 }
});

test('original hidden-field windows reject invisible changes, including numerically equivalent spellings',()=>{
 const c=at('fdpswitch',0),t=task(c),good=finish(c);
 for(const [fieldName,value]of [['fraction','6/16'],['factor','0x2'],['q','5e0'],['remainder',''],['decimal','0.375']]){
  const m=cp(good);m[fieldName]=value;originalOnly(c,m,'hidden '+fieldName);
 }
 const wrong=M.initial(t);reduce(c,wrong);factorize(c,wrong);predict(c,wrong,'repeat');
 wrong.kind='stop';divide(c,wrong);answer(c,wrong);
 assert.equal(M.inspect(t,wrong).correct,false);rejects(c,wrong);
 const hidden=M.initial(t);hidden.reason='base-ten';finish(c,hidden);originalOnly(c,hidden,'reason appeared before it was visible');
});

test('family actions must actually be visible and carry no invented data, even when original model accepts a no-effect action',()=>{
 const c=at('fdpswitch',0),t=task(c);
 const early=M.initial(t);reduce(c,early);rawAct(t,early,'reduce');finish(c,early);
 originalOnly(c,early,'second reduce is hidden after first successful reduction');
 const finished=finish(c);for(const action of ['reduce','factor','digit','run','card']){
  const m=cp(finished);rawAct(t,m,action);originalOnly(c,m,'hidden/nonfamily '+action);
 }
 for(const data of [{index:'0'},{index:'00'},{value:'2'},{row:'0'}]){
  const m=cp(finished);rawAct(t,m,'predict-stop',data);originalOnly(c,m,'button has no data attributes');
 }
});

test('proof rejects forged rows, factors, first, cycle, issue, schema keys and deleted required history without mutation',()=>{
 const c=at('decimalstops',3),t=task(c),good=finish(c);
 const mutations=[m=>m.extra=true,m=>m.board.extra=true,m=>m.board.first='stop',m=>m.board.factors.reverse(),
  m=>m.board.rows[1].q=2,m=>m.board.rows[1].input=11,m=>m.board.remainders.reverse(),m=>m.board.cycle=0,
  m=>m.board.stop=false,m=>m.issue='invented',m=>m.history=[],m=>m.history.reverse(),
  m=>m.history[0].extra=true,m=>m.history[0].d.extra='0',m=>m.history[0].f.extra='',
  m=>delete m.history[0].f.angle,m=>m.history[0].f.factor=2,m=>m.history[0].a='unknown',
  m=>m.history.splice(m.history.findIndex(e=>e.a==='digit'),1)];
 for(const mutate of mutations){const m=cp(good);mutate(m);assert.notDeepEqual(m,good);rejects(c,m,String(mutate));}
 for(const m of [null,{},[],true,{...good,board:null},{...good,history:null},{...good,answer:3},
  {...good,history:[null]},{...good,history:[{a:'digit',d:null,f:{}}]}])
  assert.doesNotThrow(()=>assert.equal(replay(t,m),null));
 const cross=at('decimalstops',5);assert.equal(replay(task(cross),good),null,'another source numerator cannot borrow a finished cycle');
});

test('500-character original fields are preserved; 501 is still rejected even though the text input can hold 2000',()=>{
 const c=at('fdpswitch',0),t=task(c),m=finish(c,undefined,{fraction:' '.repeat(497)+'3/8',
  factorSpelling:n=>'0'.repeat(499)+n,digitSpelling:n=>'0'.repeat(499)+n});
 field(t,m,'answer',' '.repeat(495)+'0.375');let p=accepts(c,m);
 assert.equal(p.reduction.raw.length,500);assert.equal(p.rows[0].enteredQuotient.raw.length,500);
 field(t,m,'answer',' '.repeat(496)+'0.375');assert.equal(m.answer.length,501);
 assert.equal(M.valid(t,m),false);rejects(c,m);
 const before=cp(m.history);rawAct(t,m,'predict-stop');assert.deepEqual(m.history,before,'oversized event not recorded');
 const historyLong=finish(c);historyLong.history[0].f.fraction=' '.repeat(501);
 assert.equal(M.valid(t,historyLong),false);rejects(c,historyLong);
});

test('1500-action cap retains bounded evidence and cannot authenticate clicks ignored after the cap',()=>{
 const c=at('fdpswitch',3),t=task(c),m=M.initial(t),needed=5;
 for(let i=0;i<1500-needed;i++)act(t,m,'reset');finish(c,m);assert.equal(m.history.length,1500);
 let p=accepts(c,m);assert.equal(p.resets.length,1495);assert.equal(p.eventCount,1500);
 const before=JSON.stringify(m);act(t,m,'predict-stop');assert.equal(JSON.stringify(m),before);
 p=accepts(c,m);assert.equal(p.assessmentLimits.allLaterClicksRecorded,false);
 const overflow=cp(m);overflow.history.push(cp(m.history.at(-1)));assert.equal(M.valid(t,overflow),false);rejects(c,overflow);
 const incomplete=M.initial(t);for(let i=0;i<1496;i++)act(t,incomplete,'reset');
 reduce(c,incomplete);factorize(c,incomplete);predict(c,incomplete);divide(c,incomplete);
 assert.equal(incomplete.board.stop,false);rejects(c,incomplete,'ignored final row is not synthesized');
});

test('an omitted observationally redundant blank prediction cannot be authenticated as a missing historical click',()=>{
 const c=at('fdpswitch',0),t=task(c),m=M.initial(t);reduce(c,m);factorize(c,m);predict(c,m,'');
 const unusedIndex=m.history.length-1;finish(c,m);accepts(c,m);
 const omitted=cp(m);omitted.history.splice(unusedIndex,1);
 assert.equal(M.valid(t,omitted),true);const p=accepts(c,omitted);
 assert.equal(p.assessmentLimits.historyCompletenessAuthenticated,false);
});

test('all three associated tasks and the one stored practice remain outside native guide/feedback and keep original v2 validity',()=>{
 for(const c of [...bridges,...practices]){
  const t=task(c),m=finish(c);assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
  assert.equal(binding(t,c),null);assert.equal(thinkingGuide(t,c),null);
  assert.equal(thinkingFeedback(t,m,record(m),c),null);
  const lesson=State.freshLesson(c.id);
  if(c.index===-1)lesson.models[-1]=m;else{lesson.index=c.index;lesson.models[c.index]=m;State.submitLesson(lesson);}
  assert.deepEqual(State.validateLesson(lesson,c.id,{allowBridge:c.index!==-1}),lesson);
 }
});

for(const c of cases)test(c.id+':'+c.index+' preserves six actual submissions, errors, first, reset, complete lesson and v2 backup',()=>{
 const t=task(c),lesson=State.freshLesson(c.id);lesson.index=c.index;const m=State.modelForLesson(lesson);
 reduce(c,m);factorize(c,m);predict(c,m,c.expected.kind==='stop'?'repeat':'stop');
 assert.equal(State.submitLesson(lesson).correct,false);metrics.submissions++;
 const first=JSON.stringify(lesson.cases[c.index].attempts[0]);State.supportLesson(lesson);finish(c,m);
 assert.equal(State.submitLesson(lesson).correct,true);metrics.submissions++;
 assert.ok(thinkingFeedback(t,m,lesson.cases[c.index],c));field(t,m,'answer','wrong');
 assert.equal(State.currentSubmission(lesson).status,'modified');
 assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);
 assert.equal(State.submitLesson(lesson).correct,false);metrics.submissions++;
 field(t,m,'answer',c.expected.answer);assert.equal(State.submitLesson(lesson).correct,true);metrics.submissions++;
 const oldHistory=cp(m.history);act(t,m,'reset');assert.equal(State.submitLesson(lesson).correct,false);metrics.submissions++;
 finish(c,m);assert.equal(State.submitLesson(lesson).correct,true);metrics.submissions++;
 assert.deepEqual(m.history.slice(0,oldHistory.length),oldHistory);
 assert.equal(JSON.stringify(lesson.cases[c.index].attempts[0]),first);
 assert.deepEqual(lesson.cases[c.index].attempts.map(a=>M.inspect(t,a.value).correct),[false,true,false,true,false,true]);
 assert.equal(lesson.cases[c.index].attempts[0].supported,false);assert.equal(lesson.cases[c.index].attempts[0].exposed,false);
 assert.ok(lesson.cases[c.index].attempts.slice(1).every(a=>a.supported&&a.exposed));
 assert.equal(State.lessonSummary(lesson).cases[c.index].independent,false);const p=accepts(c,m);
 assert.equal(p.firstPrediction.matchesExpected,false);assert.equal(p.currentRoundFirstPrediction.matchesExpected,true);
 State.addLessonNote(lesson,'保留错误预测，跟着真实余数重新判断。');lesson.draft='未提交的原因说明';
 const state=Core.fresh();state.lessons[c.id]=lesson;state.lessonContinuation=c.id;
 state.visited[c.nodeId]='2026-11-16T00:00:00.000Z';state.bookmarks=[c.nodeId];
 state.openedPacks[atlas.packs[0].id]='2026-11-16T00:00:00.000Z';
 const before=JSON.stringify(state),backup=Core.backup(state);assert.equal(backup.version,2);
 const restored=Core.parseBackup(JSON.stringify(backup),atlas);assert.deepEqual(restored,state);
 assert.equal(JSON.stringify(state),before);assert.deepEqual(Core.merge(Core.fresh(),restored),restored);
 assert.deepEqual(Core.merge(restored,restored),restored);
 assert.deepEqual(replay(t,restored.lessons[c.id].models[c.index]),p);
 const changed=cp(restored);changed.lessons[c.id].models[c.index].answer='pending correction';
 assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(changed)),atlas),changed);
 assert.equal(State.currentSubmission(changed.lessons[c.id]).status,'modified');
 assert.equal(thinkingFeedback(t,changed.lessons[c.id].models[c.index],changed.lessons[c.id].cases[c.index],c),null);
});

test('strict rejection does not rewrite or discard legacy original-valid hidden-field records',()=>{
 const c=at('fdpswitch',0),t=task(c),m=finish(c);m.factor='different old hidden input';
 originalOnly(c,m,'historical hidden factor');const lesson=State.freshLesson(c.id);lesson.index=c.index;lesson.models[c.index]=m;
 assert.equal(State.submitLesson(lesson).correct,true);assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);
 const state=Core.fresh();state.lessons[c.id]=lesson;const before=JSON.stringify(state);
 assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(state)),atlas),state);assert.equal(JSON.stringify(state),before);
});

test('full latest snapshot gates feedback; system representation and selected reason never imply independent proof or mastery',()=>{
 const c=at('decimalstops',5),t=task(c),m=finish(c),r=record(m),f=thinkingFeedback(t,m,r,c);
 assert.ok(f);assert.equal(f.method,null);const words=JSON.stringify(f);
 assert.match(words,/系统|工具/);assert.match(words,/推理|证明|解释/);assert.match(words,/掌握|理解/);
 assert.equal(latestSubmissionMatches(cp(m),r),true);
 for(const bad of [null,{}, {attempts:[]},{attempts:[{value:null}]},{attempts:[{value:cp(m)},{}]}])
  assert.equal(thinkingFeedback(t,m,bad,c),null);
 field(t,m,'answer','6 ');assert.equal(thinkingFeedback(t,m,r,c),null);
 field(t,m,'answer','6');assert.equal(latestSubmissionMatches(m,r),true,'original exact snapshot equality, no invented retry epoch');
 assert.ok(thinkingFeedback(t,m,r,c));
});

after(()=>console.log('DECIMALENGINE_INDEPENDENT_PROBES '+JSON.stringify(metrics)));
