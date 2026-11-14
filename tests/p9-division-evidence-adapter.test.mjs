import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import reviewed from './fixtures/p9-division-cases.cjs';
import browserPlan from './p9-division-adapter-browser.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as F from '../dist/learning/phase5/b14-model.js';
import * as V from '../dist/learning/phase5/b14-view.js';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,supportLesson,validateLesson} from '../dist/learning/state.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {divisionBinding as binding,replayDivisionEvidence as replay} from '../dist/learning/division-evidence.js';

await ensureB39Ready();
const {cases,associated}=reviewed,copy=x=>structuredClone(x),context=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),taskHash=t=>digest(JSON.stringify(stable(t)));
const at=(id,index=0)=>sessionTasks(id)[index],probes={actions:0,fields:0,submissions:0};
after(()=>console.log('Issue153 actual source control probes',JSON.stringify(probes)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const buttons=(t,m)=>[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].map(m=>({tag:m[0],data:attrs(m[0])}));
function change(t,m,key,value){
 const html=V.render(t,m),tag=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(x=>x[0]).find(s=>attrs(s)['data-xfield']===key);
 assert.ok(tag,`actual V.render exposes field ${key}`);
 if(tag.startsWith('<select')){
  const block=html.slice(html.indexOf(tag),html.indexOf('</select>',html.indexOf(tag)));
  assert.ok(block.includes(`value="${value}"`),`actual select offers ${key}=${value}`);
 }
 m[key]=String(value);F.field(t,m,key);probes.fields++;return m;
}
function click(t,m,action,data={}){
 const button=buttons(t,m).find(b=>b.data['data-x']===action&&Object.entries(data).every(([k,v])=>b.data['data-'+k]===String(v)));
 assert.ok(button,`actual V.render exposes ${action} ${JSON.stringify(data)}`);assert.doesNotMatch(button.tag,/\bdisabled\b/);
 const length=m.history.length;F.act(t,m,action,data);probes.actions++;
 assert.equal(m.history.length,length+1);assert.equal(F.valid(t,m),true,'original replay accepts the complete intermediate state');return m;
}
function run(t,m,steps){for(const s of steps)if(s.field)change(t,m,s.field,s.value);else click(t,m,s.action,s.data);return m;}
const solve=(t,m=F.initial(t),options={})=>run(t,m,browserPlan.operationPlan(F,t,options));
const original=(t,m)=>{assert.equal(F.valid(t,m),true);assert.equal(F.inspect(t,m).correct,true);};
function accepts(t,m){
 original(t,m);const before=JSON.stringify(m),p=replay(t,m);assert.ok(p);assert.equal(JSON.stringify(m),before);
 assert.deepEqual(replay(t,JSON.parse(before)),p);assert.deepEqual(JSON.parse(JSON.stringify(p)),p);return p;
}
const rejects=(t,m)=>assert.equal(replay(t,m),null);
const submit=a=>{probes.submissions++;return submitLesson(a);};
function work(t,m){return run(t,m,browserPlan.operationPlan(F,t).filter(s=>s.stage==='method'||s.stage==='work'));}
function answers(t,m){return run(t,m,browserPlan.operationPlan(F,t).filter(s=>s.stage==='answer'));}
function roundTrip(t,m){
 if(['up','down'].includes(t.interpret)){click(t,m,'b14-container',{value:-1});click(t,m,'b14-container',{value:1});}
 else{click(t,m,'b14-reset');solve(t,m);}
 return m;
}
const task=(n,d,interpret='keep',extra={})=>({type:'x-divtable',n,d,prompt:'逐位记录并按真实角色检查。',interpret,places:0,...extra});

test('fixed complete source fingerprints cover exactly 21 native positions and nine source nodes',()=>{
 for(const [file,sha]of Object.entries(reviewed.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 assert.equal(cases.length,21);assert.equal(new Set(cases.map(c=>c.nodeId)).size,9);
 for(const c of cases){const t=at(c.id,c.index);assert.equal(taskHash(t),c.taskHash);assert.equal(LESSONS[c.id].topicId,c.nodeId);
  assert.deepEqual([t.n,t.d,t.interpret,t.places],[c.n,c.d,c.interpret,c.places]);
  const b=binding(t,context(c));assert.equal(b.nodeId,c.nodeId);assert.equal(b.method,null);assert.match(b.question,/[？?]/);
 }
});

test('native locations, full tasks, bridge isolation and raw JSON context types fail closed',()=>{
 const native=[],bridges=[];
 for(const [catalog,out]of [[LESSONS,native],[BRIDGES,bridges]])for(const id of Object.keys(catalog))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-divtable')out.push(id+':'+index);
  if(binding(t,{sessionId:id,index}))assert.ok(cases.some(c=>c.id===id&&c.index===index));
 });
 assert.deepEqual(native.sort(),cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(bridges.sort(),associated.map(c=>c.id+':'+c.index).sort());
 const t=at('shortdivide',1);
 for(const ctx of [null,[],0,'shortdivide',{}, {sessionId:{toString:null},index:1},{sessionId:['shortdivide'],index:1},
  {sessionId:'shortdivide',index:'1'},{sessionId:'shortdivide',index:null},{sessionId:'shortdivide',index:{toString:null}},{sessionId:'shortdivide',index:1.5},
  {sessionId:'shortdivide',index:-1},{sessionId:'shortdivide',index:99},{sessionId:'__proto__',index:1}])assert.equal(binding(t,ctx),null);
 for(const altered of [{...t,prompt:t.prompt+'改'},{...t,n:126},{...t,interpret:'down'},{...t,extra:true}])assert.equal(binding(altered,{sessionId:'shortdivide',index:1}),null);
});

for(const c of cases)test(`${c.id}:${c.index} actual controls preserve five complete original State submissions`,()=>{
 const t=at(c.id,c.index),a=freshLesson(c.id);a.index=c.index;supportLesson(a);const m=modelForLesson(a);solve(t,m);
 const p=accepts(t,m);assert.deepEqual([p.integerQuotient,p.remainingOriginal],[c.integerQuotient,c.remainingOriginal]);
 assert.equal(p.calculated.written,c.written);assert.equal(p.calculated.remainder,c.finalRemainder);assert.equal(p.answer.raw,c.answer);
 assert.equal(p.answer.role,c.interpret);assert.equal(p.events.length,m.history.length);assert.deepEqual(p.events.map(e=>e.index),m.history.map((_,i)=>i));
 assert.equal(p.method.origin,t.choose?'recorded-choice':'task-default');assert.equal(p.method.value,t.long||t.choose?'long':'short');
 assert.equal(p.choices.length,t.choose?1:0);assert.equal(p.independentExplanationAssessed,false);
 for(const [i,s]of p.steps.entries()){
  assert.equal(s.quotientDigit,p.calculated.quotientDigits[i]);assert.ok(s.quotientDigit>=0&&s.quotientDigit<=9);
  assert.equal(BigInt(s.current),BigInt(p.steps[i-1]?.remainder||0)*10n+BigInt(s.nextDigit));
  assert.equal(BigInt(s.used),BigInt(s.quotientDigit)*BigInt(t.d));assert.equal(s.used+s.remainder,s.current);assert.ok(s.remainder>=0&&s.remainder<t.d);
  assert.equal(BigInt(s.dividendPrefix),BigInt(s.quotientPrefix)*BigInt(t.d)+BigInt(s.remainder));
  assert.equal(s.power,String(t.n).length-1-i);assert.deepEqual(s.unit,s.power>=0?[10**s.power,1]:[1,10**-s.power]);
  assert.equal(p.events[s.bringIndex].action,'b14-bring');
 }
 change(t,m,'answer','999999');assert.equal(submit(a).correct,false);rejects(t,m);assert.equal(currentSubmission(a).status,'revise');
 answers(t,m);assert.equal(submit(a).correct,true);assert.equal(currentSubmission(a).status,'correct');
 change(t,m,'answer','999998');assert.equal(currentSubmission(a).status,'modified');assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);
 assert.equal(submit(a).correct,false);answers(t,m);assert.equal(submit(a).correct,true);
 const board=copy(m.board),old=copy(a.cases[c.index].attempts.at(-1).value);roundTrip(t,m);assert.deepEqual(m.board,board);
 assert.equal(currentSubmission(a).status,'modified');assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);
 assert.deepEqual(a.cases[c.index].attempts.at(-1).value,old);assert.equal(submit(a).correct,true);accepts(t,m);
 assert.equal(a.cases[c.index].attempts.length,5);assert.deepEqual(a.cases[c.index].attempts.map(x=>F.inspect(t,x.value).correct),[false,true,false,true,true]);
 assert.equal(a.cases[c.index].attempts.at(-1).supported,true);
 const loaded=validateLesson(JSON.parse(JSON.stringify(a)),c.id);assert.ok(loaded);assert.deepEqual(loaded.models[c.index],m);assert.deepEqual(loaded.cases[c.index].attempts,a.cases[c.index].attempts);
});

test('all 24 associated tasks use real controls but never acquire a native binding',()=>{
 assert.equal(associated.length,24);
 for(const c of associated){const t=at(c.id,c.index);assert.equal(taskHash(t),c.taskHash);accepts(t,solve(t));assert.equal(binding(t,context(c)),null);}
});

test('the actual original field, event and board shapes are required without mutating caller data',()=>{
 const t=at('shortdivide',1),m=solve(t),fieldKeys=Object.keys(F.initial(t)).filter(k=>!['history','board','issue'].includes(k));
 assert.equal(fieldKeys.length,33);assert.deepEqual(Object.keys(m.history[0].data.fields),fieldKeys);
 for(const mutate of [x=>x.extra=1,x=>x.history[0].extra=1,x=>x.history[0].data.extra=1,
  x=>delete x.history[0].data.fields.check,x=>x.history[0].data.fields.answer=null,x=>x.history[0].data.index=0,
  x=>x.history[0].data.side=0,x=>x.history[0].data.value=0,x=>x.board.steps[0].q=1,x=>x.board.ready=true,
  x=>x.issue='未解决',x=>x.history=[],x=>x.history[0].data.fields.sideA='1']){
  const bad=copy(m);mutate(bad);const before=JSON.stringify(bad);rejects(t,bad);assert.equal(JSON.stringify(bad),before);
 }
 for(const bad of [null,[],0,{}, {...m,history:null}])rejects(t,bad);
 for(const tBad of [{...t,n:0},{...t,n:1.5},{...t,d:0},{...t,d:100},{...t,places:1},{...t,long:'yes'},{...t,choose:true,long:true},{...t,dp:1},{...t,choosePrecision:true},{...t,extra:0}])rejects(tBad,m);
});

test('leading, internal and trailing zero quotient digits remain real steps with the correct units',()=>{
 for(const [n,d,written]of [[360,9,'040'],[4080,17,'0240'],[1005,5,'0201'],[101,1,'101'],[1,99,'0']]){
  const t=task(n,d),p=accepts(t,solve(t));assert.equal(p.calculated.written,written);
  assert.equal(p.steps.length,String(n).length);assert.equal(p.steps.filter(s=>s.quotientDigit===0).length,[...written].filter(x=>x==='0').length);
 }
});

test('decimal remainder units differ from the original integer remainder and exact value',()=>{
 const t=at('divide16',2),p=accepts(t,solve(t));
 assert.equal(p.integerQuotient,0);assert.equal(p.remainingOriginal,5);assert.deepEqual(p.answer.fractionalShare,[5,16]);
 assert.equal(p.calculated.remainder,0);assert.deepEqual(p.calculated.remainderUnit,[1,10000]);assert.equal(p.calculated.exactAfterSteps,true);
 assert.deepEqual(p.calculated.value,[5,16]);assert.deepEqual(p.steps.map(s=>s.unit),[[1,1],[1,10],[1,100],[1,1000],[1,10000]]);
 const round=at('roundanswers',0),q=accepts(round,solve(round));assert.equal(q.calculated.written,'03.68');assert.deepEqual(q.calculated.value,[92,25]);
 assert.deepEqual(q.calculated.unresolvedOriginal,[3,25]);assert.equal(q.calculated.remainder,12);assert.equal(q.calculated.exactAfterSteps,false);
 assert.deepEqual(q.rounding.exactValue,[59,16]);assert.equal(q.rounding.formatted,'3.7');
});

test('half-up is exact at ties, repeating decimals and a carry across the integer boundary',()=>{
 for(const [n,d,dp,places,answer,tie]of [[13,4,1,2,'3.3',true],[199,20,1,2,'10.0',true],[5,8,2,3,'0.63',true],
  [1,8,2,3,'0.13',true],[1,2,0,1,'1',true],[39,4,0,2,'10',false],[1,3,5,6,'0.33333',false],[59,16,1,2,'3.7',false]]){
  const t=task(n,d,'round',{dp,places}),m=solve(t),p=accepts(t,m);assert.equal(m.answer,answer);assert.equal(p.rounding.formatted,answer);assert.equal(p.rounding.tie,tie);
  assert.equal(p.rounding.rule,'half-up');assert.equal(p.rounding.precisionChosen,false);
  change(t,m,'answer',String(Number(answer)));if(answer!==m.answer)rejects(t,m);
 }
});

test('only the real choose action establishes a selected method; reset starts a new choice epoch',()=>{
 const t=at('divide16',0),m=solve(t,F.initial(t),{method:'short'});let p=accepts(t,m);assert.equal(p.method.value,'short');assert.equal(p.choices.length,1);
 const fields=Object.fromEntries(Object.keys(F.initial(t)).filter(k=>!['history','board','issue'].includes(k)).map(k=>[k,m[k]]));
 click(t,m,'b14-reset');for(const [k,v]of Object.entries(fields))assert.equal(m[k],v);
 solve(t,m,{method:'long'});p=accepts(t,m);assert.equal(p.method.value,'long');assert.equal(p.choices.length,2);assert.equal(p.resets.length,1);
 assert.equal(p.currentEpoch,1);assert.equal(p.method.choiceIndex,p.choices[1].index);assert.ok(p.steps.every(s=>s.epoch===1));
 assert.equal(p.epochs[0].endExclusive,p.resets[0].index);assert.equal(p.epochs[1].startIndex,p.resets[0].index+1);
});

test('empty reset is a legal reset with no mathematical effect; preserved hidden values are not cleared',()=>{
 const t=at('roundanswers',1),m=F.initial(t);click(t,m,'b14-reset');solve(t,m);let p=accepts(t,m);assert.equal(p.events[0].effect,false);
 const old=copy(m);click(t,m,'b14-reset');assert.equal(m.answer,old.answer);assert.equal(m.check,old.check);assert.equal(m.precision,old.precision);
 solve(t,m);p=accepts(t,m);assert.equal(p.resets.length,2);assert.equal(p.currentEpoch,2);assert.equal(p.events.length,m.history.length);
});

test('real rejected digits remain failed requests after a visible correction or reset',()=>{
 const t=at('shortdivide',1);
 for(const [key,value]of [['q',''],['q','bad'],['q','10'],['q','0.000001'],['q','0.0000000'],['q','1'],['used','1'],['rest','8'],['rest','0'],['rest','-1']])for(const reset of [false,true]){
  const m=F.initial(t);click(t,m,'b14-bring');for(const [k,v]of [['q','0'],['used','0'],['rest','1']])change(t,m,k,v);
  const board=copy(m.board);
  change(t,m,key,value);click(t,m,'b14-div-step');assert.ok(m.issue,`${key}=${value} is rejected by the actual original tool`);
  const rejected=copy(m),failureIndex=m.history.length-1;
  assert.deepEqual(m.board,board);assert.equal(m.board.ready,true);assert.equal(m.board.steps.length,0);
  if(reset){click(t,m,'b14-reset');solve(t,m);}
  else{
   for(const [k,v]of [['q','0'],['used','0'],['rest','1']])change(t,m,k,v);click(t,m,'b14-div-step');
   run(t,m,browserPlan.operationPlan(F,t).filter(s=>s.position===undefined||s.position>=1));
  }
  const p=accepts(t,m),failed=p.failedRequests[0];assert.equal(p.failedRequests.length,1);
  assert.deepEqual(m.history.slice(0,rejected.history.length),rejected.history);assert.equal(p.events.length,m.history.length);
  assert.equal(failed.index,failureIndex);assert.equal(failed.accepted,false);assert.equal(failed.effect,false);
  assert.equal(failed.failure,'digit-not-accepted');assert.equal(failed.issue,rejected.issue);
  assert.deepEqual(failed.fields,rejected.history.at(-1).data.fields);assert.equal(failed.fields[key],value);
  assert.deepEqual(failed.before,board);assert.deepEqual(failed.after,board);assert.equal(p.steps.length,3);
  assert.equal(p.currentEpoch,Number(reset));assert.equal(p.issue,'');
  const forged=copy(m);forged.history[failureIndex].data.fields.sideA='1';rejects(t,forged);
  const hidden=copy(m);F.act(t,hidden,'b14-div-step');original(t,hidden);rejects(t,hidden);
 }
});

test('every native task keeps failed complete attempts and real digit corrections in both reset paths',()=>{
 for(const c of cases)for(const reset of [false,true]){
  const t=at(c.id,c.index),a=freshLesson(c.id);a.index=c.index;const m=modelForLesson(a);
  const plan=browserPlan.operationPlan(F,t);run(t,m,plan.filter(s=>s.stage==='method'));
  click(t,m,'b14-bring');for(const key of ['q','used','rest'])change(t,m,key,'');click(t,m,'b14-div-step');
  const rejected=copy(m);assert.ok(m.issue);assert.equal(submit(a).correct,false);const old=copy(a.cases[c.index].attempts);
  if(reset){click(t,m,'b14-reset');solve(t,m);}
  else run(t,m,plan.filter(s=>s.stage!=='method'&&!(s.action==='b14-bring'&&s.position===0)));
  const p=accepts(t,m);assert.equal(p.failedRequests.length,1);assert.deepEqual(p.failedRequests[0].fields,rejected.history.at(-1).data.fields);
  assert.deepEqual(m.history.slice(0,rejected.history.length),rejected.history);assert.equal(submit(a).correct,true);
  assert.deepEqual(a.cases[c.index].attempts.slice(0,old.length),old);
  assert.deepEqual(a.cases[c.index].attempts.map(x=>F.inspect(t,x.value).correct),[false,true]);
  assert.deepEqual(validateLesson(JSON.parse(JSON.stringify(a)),c.id),a);
  const words=JSON.stringify(thinkingFeedback(t,m,a.cases[c.index],context(c)));
  assert.match(words,/保留了 1 次尚未对上的逐位请求.*原填写和提示仍在/);assert.match(words,/没有增加已完成位数/);
 }
});

test('an empty visible notation request is preserved without inventing a selected method',()=>{
 const t=at('divide16',0),m=F.initial(t);click(t,m,'b14-method');const rejected=copy(m);
 assert.equal(m.issue,'');assert.equal(m.board.method,null);assert.deepEqual(m.board,F.initial(t).board);
 solve(t,m,{method:'short'});const p=accepts(t,m),failed=p.failedRequests[0];
 assert.equal(p.failedRequests.length,1);assert.equal(failed.failure,'empty-method');assert.equal(failed.issue,'');
 assert.equal(failed.effect,false);assert.equal(failed.accepted,false);assert.deepEqual(failed.before,rejected.board);assert.deepEqual(failed.after,rejected.board);
 assert.deepEqual(failed.fields,rejected.history[0].data.fields);assert.equal(p.choices.length,1);assert.equal(p.method.choiceIndex,1);
 assert.equal(p.method.value,'short');assert.deepEqual(m.history[0],rejected.history[0]);
 click(t,m,'b14-reset');change(t,m,'method','');click(t,m,'b14-method');solve(t,m,{method:'long'});
 const after=accepts(t,m);assert.equal(after.failedRequests.length,2);assert.equal(after.choices.length,2);assert.equal(after.currentEpoch,1);
 const feedback=thinkingFeedback(t,m,{attempts:[{value:copy(m)}]},{sessionId:'divide16',index:0});assert.match(JSON.stringify(feedback),/尚未选择记法的请求.*没有把空选择当作一种记法/);
 const forged=copy(m);forged.history[0].data.fields.method='unsupported';rejects(t,forged);
});

test('finite decimal integer inputs that the original tool accepts preserve exact mathematics',()=>{
 const t=at('shortdivide',1),m=F.initial(t);
 const plan=browserPlan.operationPlan(F,t).map(s=>['q','used','rest'].includes(s.field)?{...s,value:'0'+s.value+'.000000'}:s);
 run(t,m,plan);accepts(t,m);
 for(const value of ['15.000000000','15e0','+15','1 5','15.000001']){const bad=copy(m);change(t,bad,'answer',value);rejects(t,bad);}
});

test('inverse arithmetic retains operand roles, reversed equations and ordinary operator whitespace',()=>{
 const t=at('shortdivide',1),m=solve(t);
 for(const check of ['15 × 8 + 5 = 125','125=8*15+5','015.000 × 08.0 + 05 = 0125.00']){change(t,m,'check',check);const p=accepts(t,m);assert.deepEqual([p.inverse.quotient,p.inverse.divisor,p.inverse.remainder,p.inverse.dividend],[15,8,5,125]);}
 const exact=at('writtenstart',1),em=solve(exact);for(const check of ['12*8=96','96=8×12','12×8+0=96']){change(exact,em,'check',check);accepts(exact,em);}
 for(const check of ['15×8=125','10×12+5=125','125=15+8+102','(15×8)+5=125','15×8+5=125=125']){change(t,m,'check',check);rejects(t,m);}
});

test('digit concatenation and nearby decimal inverse tokens keep original grades but have no strict proof',()=>{
 const t=at('shortdivide',1),a=freshLesson('shortdivide');a.index=1;const m=modelForLesson(a);solve(t,m);
 for(const check of ['1 5×8+5=125','15×8+5=1\t25','15.00000000000000001×8+5=125','15×8+5.00000000000000001=125','15×8+5=125.00000000000000001']){
  change(t,m,'check',check);original(t,m);assert.equal(submit(a).correct,true);assert.equal(currentSubmission(a).status,'correct');rejects(t,m);
 }
 change(t,m,'check','15 × 8 + 5 = 125');assert.equal(currentSubmission(a).status,'modified');assert.equal(submit(a).correct,true);accepts(t,m);
});

test('fraction and decimal names must be exact and inside the original unreduced input bounds',()=>{
 const t=at('shortdivide',3),m=solve(t);
 for(const answer of ['15 5/8','125/8','250/16','15.625','14 13/8']){change(t,m,'answer',answer);const p=accepts(t,m);assert.deepEqual(p.answer.exactValue,[125,8]);assert.deepEqual(p.answer.fractionalShare,[5,8]);assert.equal(p.answer.remainingOriginal,5);}
 for(const answer of ['15 5/0','125/0','15.62500000','15.6250001','125000000/8000000','15 5 / 8','15 6/8','5/8']){change(t,m,'answer',answer);rejects(t,m);}
 const decimal=at('divide16',2),dm=solve(decimal);for(const answer of ['0.3125','0.3125000']){change(decimal,dm,'answer',answer);accepts(decimal,dm);}
 for(const answer of ['5/16','0.31250000','0.3125001','.3125']){change(decimal,dm,'answer',answer);rejects(decimal,dm);}
});

test('complete-only fields cannot be edited early or changed while hidden after a reset',()=>{
 const t=at('shortdivide',1);
 for(const key of ['answer','check','base','method','precision','reason','sideA']){
  const m=F.initial(t);m[key]=key==='sideA'?'1':'17';F.field(t,m,key);solve(t,m);original(t,m);rejects(t,m);
 }
 const m=solve(t);click(t,m,'b14-reset');m.answer='14';F.field(t,m,'answer');solve(t,m);original(t,m);rejects(t,m);
 const current=solve(t);current.q='8';F.field(t,current,'q');original(t,current);rejects(t,current);
});

test('select fields retain their actual finite options even when original number parsing accepts more forms',()=>{
 const t=at('roundanswers',1),m=solve(t);m.precision='2.0';F.field(t,m,'precision');original(t,m);rejects(t,m);
 for(const precision of ['','0','1']){const bad=solve(t);change(t,bad,'precision',precision);rejects(t,bad);}
 const correct=solve(t);accepts(t,correct);
});

test('hidden method changes, repeated bring and unrelated action API calls cannot invent real controls',()=>{
 const t=at('shortdivide',1);
 for(const setup of [
  m=>{m.method='long';F.field(t,m,'method');F.act(t,m,'b14-method');},
  m=>{F.act(t,m,'b14-div-step');},
  m=>{F.act(t,m,'b14-bring');F.act(t,m,'b14-bring');F.act(t,m,'b14-reset');},
  m=>{F.act(t,m,'b14-container',{value:1});},
  m=>{F.act(t,m,'b14-cut');}
 ]){const m=F.initial(t);setup(m);solve(t,m);original(t,m);rejects(t,m);}
 const m=solve(t);for(const action of ['b14-bring','b14-div-step','b14-method']){const bad=copy(m);assert.ok(!buttons(t,bad).some(b=>b.data['data-x']===action));F.act(t,bad,action);original(t,bad);rejects(t,bad);}
 const ct=at('divide16',0),cm=F.initial(ct);change(ct,cm,'method','short');click(ct,cm,'b14-method');
 assert.ok(!buttons(ct,cm).some(b=>b.data['data-x']==='b14-method'));F.act(ct,cm,'b14-method');click(ct,cm,'b14-reset');solve(ct,cm);original(ct,cm);rejects(ct,cm);
});

test('up permits adding then removing an extra container while describing automatic diagrams honestly',()=>{
 const t=at('shortdivide',2),m=solve(t);click(t,m,'b14-container',{value:1});click(t,m,'b14-container',{value:-1});const p=accepts(t,m);
 assert.equal(p.containers.count,16);assert.equal(p.containers.events.length,18);assert.equal(p.containers.capacity,128);
 assert.equal(p.containers.adjacentCapacity,120);assert.equal(p.containers.minimumSufficient,true);assert.equal(p.containers.independentObjectDistributionAssessed,false);
 const extra=p.containers.events.at(-2);assert.equal(extra.to,17);assert.equal(extra.shownAllocated,125);assert.equal(extra.unusedCapacity,11);assert.equal(extra.toolFillsDiagram,true);
});

test('down overfill and removal preserve quantities without claiming a versionless historical caption',()=>{
 const t=at('remainders',2),m=solve(t);click(t,m,'b14-container',{value:1});assert.match(V.render(t,m),/要把这些份都装满还差 2/);
 const over=copy(m);click(t,m,'b14-container',{value:-1});let p=accepts(t,m),extra=p.containers.events.at(-2);
 assert.equal(extra.to,6);assert.equal(extra.capacity,54);assert.equal(extra.shownAllocated,52);assert.equal(extra.unusedCapacity,2);
 assert.equal(extra.allSelectedCanBeFull,false);assert.equal(extra.historicalCaptionKnown,false);assert.deepEqual(m.history.slice(0,over.history.length),over.history);
 assert.equal(p.containers.count,5);assert.equal(p.containers.fullContainersOnly,true);
 const words=JSON.stringify(thinkingFeedback(t,m,{attempts:[{value:copy(m)}]},{sessionId:'remainders',index:2}));
 assert.match(words,/中间状态不作为所有份都已装满的证据/);assert.match(words,/不据此还原当时的说明文字/);
 const before=copy(m.history);click(t,m,'b14-reset');solve(t,m);p=accepts(t,m);
 assert.deepEqual(m.history.slice(0,before.length),before);assert.equal(p.currentEpoch,1);
 assert.ok(p.events.some(e=>e.action==='b14-container'&&e.to===6&&!e.allSelectedCanBeFull&&!e.historicalCaptionKnown));
 assert.ok(p.containers.events.every(e=>e.epoch===1&&e.allSelectedCanBeFull&&!e.historicalCaptionKnown));
 const valid=solve(t);click(t,valid,'b14-container',{value:-1});click(t,valid,'b14-container',{value:1});p=accepts(t,valid);
 assert.equal(p.containers.count,5);assert.equal(p.containers.adjacentCapacity,54);assert.equal(p.containers.fullContainersOnly,true);assert.equal(p.remainingOriginal,7);
});

test('container actions require the completed visible panel, exact ±1 and an enabled nonempty removal',()=>{
 const t=at('remainders',1),m=F.initial(t);F.act(t,m,'b14-container',{value:1});solve(t,m);click(t,m,'b14-container',{value:-1});original(t,m);rejects(t,m);
 const empty=F.initial(t);work(t,empty);const remove=buttons(t,empty).find(b=>b.data['data-x']==='b14-container'&&b.data['data-value']==='-1');assert.match(remove.tag,/\bdisabled\b/);
 for(const value of [-1,0,2,'plus']){const bad=copy(empty);F.act(t,bad,'b14-container',{value});run(t,bad,browserPlan.operationPlan(F,t).filter(s=>['containers','answer'].includes(s.stage)));original(t,bad);rejects(t,bad);}
});

test('the visible add request at the original 200-container ceiling is retained as a no-op',()=>{
 const t=task(1,1,'up'),m=F.initial(t);work(t,m);for(let i=0;i<201;i++)click(t,m,'b14-container',{value:1});
 assert.equal(m.board.containers,200);const ceiling=copy(m);for(let i=0;i<199;i++)click(t,m,'b14-container',{value:-1});answers(t,m);
 const p=accepts(t,m),failed=p.failedRequests[0];assert.equal(p.failedRequests.length,1);assert.equal(failed.failure,'container-limit');
 assert.deepEqual([failed.from,failed.to,failed.requestedCount],[200,200,201]);assert.equal(failed.effect,false);assert.equal(failed.accepted,false);
 assert.equal(failed.issue,'');assert.deepEqual(failed.fields,ceiling.history.at(-1).data.fields);assert.deepEqual(failed.before,ceiling.board);assert.deepEqual(failed.after,ceiling.board);
 assert.equal(p.containers.events.length,399);assert.equal(p.events.filter(e=>e.action==='b14-container').length,400);
 assert.equal(p.containers.count,1);assert.deepEqual(m.history.slice(0,ceiling.history.length),ceiling.history);
 const forged=copy(m);forged.history[failed.index].data.value=0;rejects(t,forged);
});

test('the same integer quotient and remainder produce distinct keep, up, down and fraction answers',()=>{
 for(const [role,answer]of [['keep','5'],['up','6'],['down','5'],['fraction','5 7/9']]){
  const t=task(52,9,role),m=solve(t),p=accepts(t,m);assert.equal(m.answer,answer);assert.equal(p.answer.role,role);
  assert.equal(p.integerQuotient,5);assert.equal(p.remainingOriginal,7);
  if(role==='keep')assert.equal(p.answer.rawRemainder,'7');if(role==='fraction')assert.deepEqual(p.answer.fractionalShare,[7,9]);
 }
});

test('browser negative and exploration plans use original visible controls and retain their actual State outcomes',()=>{
 const counts={paths:0,submissions:0};
 for(const variant of ['wrong-step-reset','long-decimal-reset','wrong-step-corrected','down-overfill','inverse-digit-join','inverse-nearby-token']){
  const id=variant==='down-overfill'?'remainders':'shortdivide',index=variant==='down-overfill'?2:1,t=at(id,index),a=freshLesson(id);a.index=index;const m=modelForLesson(a);
  if(['wrong-step-reset','long-decimal-reset','wrong-step-corrected'].includes(variant)){
   click(t,m,'b14-bring');change(t,m,'q',variant==='long-decimal-reset'?'0.0000000':'0');
   change(t,m,'used',variant==='wrong-step-corrected'?'1':'0');change(t,m,'rest',variant==='wrong-step-reset'?'8':'1');click(t,m,'b14-div-step');assert.ok(m.issue);
   assert.equal(submit(a).correct,false);counts.submissions++;
   if(variant==='wrong-step-corrected'){
    for(const [k,v]of [['q','0'],['used','0'],['rest','1']])change(t,m,k,v);click(t,m,'b14-div-step');
    run(t,m,browserPlan.operationPlan(F,t).filter(s=>s.position===undefined||s.position>=1));
   }else{click(t,m,'b14-reset');solve(t,m);}
  }else{
   solve(t,m);if(variant==='down-overfill'){
    click(t,m,'b14-container',{value:1});assert.match(V.render(t,m),/要把这些份都装满还差 2/);
    assert.equal(submit(a).correct,false);counts.submissions++;click(t,m,'b14-container',{value:-1});
   }
   else change(t,m,'check',variant==='inverse-digit-join'?'1 5×8+5=125':'15.00000000000000001×8+5=125');
  }
  assert.equal(submit(a).correct,true);counts.submissions++;assert.ok(validateLesson(JSON.parse(JSON.stringify(a)),id));
  if(variant.startsWith('inverse-'))rejects(t,m);
  else{
   const p=accepts(t,m);assert.equal(p.events.length,m.history.length);
   if(variant==='down-overfill')assert.ok(p.containers.events.some(e=>e.to===6&&!e.allSelectedCanBeFull&&!e.historicalCaptionKnown));
   else{assert.equal(p.failedRequests.length,1);assert.equal(p.failedRequests[0].effect,false);assert.equal(p.failedRequests[0].fields.q,variant==='long-decimal-reset'?'0.0000000':'0');}
  }
  if(variant.startsWith('inverse-')){change(t,m,'check','15 × 8 + 5 = 125');assert.equal(currentSubmission(a).status,'modified');assert.equal(submit(a).correct,true);counts.submissions++;accepts(t,m);}
  counts.paths++;
 }
 for(const variant of ['up-extra-room','choose-alternate','empty-reset','precision-edit','empty-method','container-ceiling']){
  const [id,index]=variant==='up-extra-room'?['shortdivide',2]:['choose-alternate','empty-method'].includes(variant)?['divide16',0]:
   variant==='empty-reset'?['writtenstart',1]:variant==='container-ceiling'?['remainders',1]:['roundanswers',1];
  const t=at(id,index),a=freshLesson(id);a.index=index;const m=modelForLesson(a);
  if(variant==='empty-reset')click(t,m,'b14-reset');
  if(variant==='empty-method')click(t,m,'b14-method');
  if(variant==='container-ceiling'){
   work(t,m);for(let i=0;i<201;i++)click(t,m,'b14-container',{value:1});
   for(let i=200;i>6;i--)click(t,m,'b14-container',{value:-1});answers(t,m);
  }else solve(t,m,{method:variant==='choose-alternate'?'short':'long'});
  const history=copy(m.history);
  if(variant==='up-extra-room'){click(t,m,'b14-container',{value:1});click(t,m,'b14-container',{value:-1});}
  if(variant==='choose-alternate'){click(t,m,'b14-reset');solve(t,m,{method:'long'});}
  if(variant==='precision-edit'){
   assert.equal(submit(a).correct,true);counts.submissions++;change(t,m,'precision','1');assert.equal(currentSubmission(a).status,'modified');
   assert.equal(submit(a).correct,false);counts.submissions++;change(t,m,'precision','2');assert.equal(currentSubmission(a).status,'modified');
  }
  assert.equal(submit(a).correct,true);counts.submissions++;const p=accepts(t,m);
  if(variant==='empty-method'){assert.equal(p.failedRequests[0].failure,'empty-method');assert.equal(p.method.choiceIndex,1);}
  if(variant==='container-ceiling'){
   assert.equal(p.failedRequests[0].failure,'container-limit');assert.equal(p.containers.events.length,394);
   assert.equal(p.events.filter(e=>e.action==='b14-container').length,395);
   assert.match(JSON.stringify(thinkingFeedback(t,m,a.cases[index],{sessionId:id,index})),/不计作一次容器增加/);
  }
  assert.deepEqual(m.history.slice(0,history.length),history);assert.ok(validateLesson(JSON.parse(JSON.stringify(a)),id));counts.paths++;
 }
 assert.deepEqual(counts,{paths:12,submissions:20});
});

test('planned native and associated browser operations are independently reachable in original V.render',()=>{
 const before={...probes};for(const c of [...cases,...associated]){const t=at(c.id,c.index);accepts(t,solve(t,F.initial(t),{method:'short'}));}
 assert.ok(probes.actions-before.actions>300);assert.ok(probes.fields-before.fields>400);
});

test('shared direct, guide and registry bindings reject malformed JSON source identities before coercion',()=>{
 const c=cases.find(c=>c.id==='shortdivide'&&c.index===1),t=at(c.id,c.index),m=solve(t),record={attempts:[{value:copy(m)}]},adapter=EVIDENCE_ADAPTERS.find(a=>a.id==='division');
 assert.ok(adapter);assert.ok(thinkingGuide(t,context(c)));assert.ok(thinkingFeedback(t,m,record,context(c)));
 for(const raw of [null,[],0,'shortdivide',{}, {sessionId:{toString:null},index:1},{sessionId:'shortdivide',index:{toString:null}},
  {sessionId:[],index:1},{sessionId:'shortdivide',index:[]},{sessionId:'shortdivide',index:'1'},{sessionId:'shortdivide',index:-1}]){
  const ctx=JSON.parse(JSON.stringify(raw));assert.equal(binding(t,ctx),null);assert.equal(adapter.binding(t,ctx),null);
  assert.equal(thinkingGuide(t,ctx),null);assert.equal(thinkingFeedback(t,m,record,ctx),null);
 }
});

test('all native feedback follows the latest complete State submission and keeps default notation distinct from choice',()=>{
 for(const c of cases){
  const t=at(c.id,c.index),a=freshLesson(c.id);a.index=c.index;const m=modelForLesson(a);solve(t,m);
  assert.equal(thinkingFeedback(t,m,a.cases[c.index],context(c)),null);assert.equal(submit(a).correct,true);
  const feedback=thinkingFeedback(t,m,a.cases[c.index],context(c)),words=JSON.stringify(feedback);assert.ok(feedback);assert.equal(feedback.method,null);
  assert.ok(words.includes(c.written));assert.match(words,/工具显示/);assert.doesNotMatch(words,/亲手.*逐个|逐个分放|MP\.\d|已经掌握/);
  if(t.choose)assert.match(words,/选择了.*记法/);else{assert.match(words,/题目给定.*记法/);assert.doesNotMatch(words,/你.*选择了.*记法/);}
  change(t,m,'answer','999999');assert.equal(thinkingFeedback(t,m,a.cases[c.index],context(c)),null);assert.equal(submit(a).correct,false);
  answers(t,m);assert.equal(thinkingFeedback(t,m,a.cases[c.index],context(c)),null);assert.equal(submit(a).correct,true);
  assert.ok(thinkingFeedback(t,m,a.cases[c.index],context(c)));
 }
 for(const c of associated){const t=at(c.id,c.index),m=solve(t);assert.equal(thinkingGuide(t,context(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:copy(m)}]},context(c)),null);}
});

test('feedback separates entered decimal digits, original-unit remainders, exact fractions and system-checked rounding',()=>{
 const words=(id,index,edit)=>{const t=at(id,index),m=solve(t);if(edit)edit(t,m);const p=accepts(t,m);return{p,words:JSON.stringify(thinkingFeedback(t,m,{attempts:[{value:copy(m)}]},{sessionId:id,index}))};};
 const rounded=words('roundanswers',0);assert.match(rounded.words,/只到 03\.68.*12 个百分之一/);assert.match(rounded.words,/近似结果是 3\.7/);
 assert.match(rounded.words,/精确分数 59\/16/);assert.doesNotMatch(rounded.words,/3\.6875|精确结果是 3\.7/);assert.equal(rounded.p.calculated.exactAfterSteps,false);
 const fraction=words('longdivide',0);assert.match(fraction.words,/余 7 个原来的单位/);assert.match(fraction.words,/每份.*7\/13/);assert.equal(fraction.p.calculated.places,0);
 const decimal=words('divide16',2);assert.match(decimal.words,/小数 0\.3125.*精确相等/);assert.match(decimal.words,/记录到万分之一/);
 const up=words('remainders',1,(t,m)=>{click(t,m,'b14-container',{value:1});click(t,m,'b14-container',{value:-1});});
 assert.match(up.words,/可放 54.*少一份只能放 45/);assert.match(up.words,/8 次容器增减.*最后份数是 6/);assert.match(up.words,/示意由工具.*自动填充/);
 const down=words('remainders',2);assert.match(down.words,/5 份都是完整的 9.*用去 45.*剩 7/);assert.match(down.words,/再加一整份需要 54/);
});
