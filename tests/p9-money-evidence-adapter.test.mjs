import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import fixture from './fixtures/p9-money-cases.cjs';
import browserPlan from './p9-money-adapter-browser.cjs';
import * as M from '../dist/learning/phase5/b33-model.js';
import * as V from '../dist/learning/phase5/b33-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {moneyBinding as binding,replayMoneyEvidence as replay} from '../dist/learning/money-evidence.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
const copy=structuredClone,context=c=>({sessionId:c.id,index:c.index}),at=(id,index=0)=>sessionTaskFor(id,index);
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=t=>digest(JSON.stringify(stable(t)));
const probes={visibleActions:0,visibleFieldEdits:0,originalStateSubmissions:0,oldAttemptPrefixes:0,sharedRetryHandlerReconstructions:0,integerSolutionsEnumerated:0};
after(()=>console.log('Issue179 author source control checks (not Chromium)',JSON.stringify(probes)));
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
function field(t,m,key,value){
 const html=V.render(t,m),tag=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(x=>x[0]).find(x=>attrs(x)['data-xfield']===key);
 assert(tag,'original renderer exposes '+key);assert.doesNotMatch(tag,/\bdisabled\b/);
 if(tag.startsWith('<select')){const block=html.slice(html.indexOf(tag),html.indexOf('</select>',html.indexOf(tag)));assert(block.includes('value="'+value+'"'),'original select option');}
 setField(m,key,String(value));M.field(t,m,key);probes.visibleFieldEdits++;return m;
}
function click(t,m,action,index){
 const buttons=[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>({tag:x[0],a:attrs(x[0])}));
 const found=buttons.find(b=>b.a['data-x']===action&&(index===undefined?b.a['data-index']===undefined:b.a['data-index']===String(index)));
 assert(found,'visible '+action+':'+index);assert.doesNotMatch(found.tag,/\bdisabled\b/);
 const n=m.history.length;M.act(t,m,action,index===undefined?{}:{index});assert.equal(M.valid(t,m),true);assert.equal(m.history.length,Math.min(1200,n+1));probes.visibleActions++;return m;
}
function answers(t,m,c){c.answers.forEach((v,i)=>field(t,m,'answers.'+i,v));return m;}
function solve(t,c,m=M.initial(t)){
 if(t.type==='x-m33-coins')for(const vec of c.plan){click(t,m,'m33-clear');vec.forEach((n,i)=>{for(let j=0;j<n;j++)click(t,m,'m33-add',i);});click(t,m,'m33-save');}
 else{for(const i of [...m.board.selected])if(!c.plan.includes(i))click(t,m,'m33-choose',i);for(const i of c.plan)if(!m.board.selected.includes(i))click(t,m,'m33-choose',i);}
 return answers(t,m,c);
}
const spec=(id,index=0)=>fixture.cases.find(c=>c.id===id&&c.index===index);
function accepts(t,m){assert.equal(M.inspect(t,m).correct,true);const before=JSON.stringify(m),proof=replay(t,m);assert(proof);assert.equal(JSON.stringify(m),before);assert.deepEqual(replay(t,JSON.parse(before)),proof);assert.deepEqual(JSON.parse(JSON.stringify(proof)),proof);return proof;}
const rejects=(t,m)=>{const before=JSON.stringify(m);assert.equal(replay(t,m),null);assert.equal(JSON.stringify(m),before);};
function submit(record,want){const before=copy(record.cases[record.index]?.attempts||[]);const result=State.submitLesson(record);assert.equal(result.correct,want);const attempts=record.cases[record.index].attempts;assert.deepEqual(attempts.slice(0,-1),before);assert.deepEqual(attempts.at(-1).value,record.models[record.index]);probes.oldAttemptPrefixes+=before.length;probes.originalStateSubmissions++;return result;}
function retry(record,t){const old=copy(record.cases);record.view='task';record.models[record.index]=M.initial(t);assert.deepEqual(record.cases,old);probes.sharedRetryHandlerReconstructions++;return record.models[record.index];}

test('fixed source fingerprints cover 28 native/12 nodes,20 associated and10 old practice positions',()=>{
 for(const[p,h]of Object.entries(fixture.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+p,import.meta.url))),h,p);
 assert.equal(fixture.cases.length,28);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,12);
 assert.equal(fixture.associated.length,20);assert.equal(fixture.practice.length,10);
 for(const c of [...fixture.cases,...fixture.associated,...fixture.practice]){const t=at(c.id,c.index);assert.equal(hash(t),c.taskHash);assert.equal(t.currency,c.currency);assert.equal(t.estimate,undefined);}
 for(const c of fixture.cases){const b=binding(at(c.id,c.index),context(c));assert.equal(b.nodeId,c.nodeId);assert.equal(b.method,null);assert.match(b.question,/[？?]/);}
});
test('full catalogue isolation and malformed raw contexts fail closed',()=>{
 const all=[],associated=[],practice=[];
 for(const id of Object.keys(LESSONS)){sessionTasks(id).forEach((t,index)=>{if(binding(t,{sessionId:id,index}))all.push(id+':'+index);});const t=at(id,-1);if(t&&['x-m33-coins','x-m33-cart'].includes(t.type)){practice.push(id+':-1');assert.equal(binding(t,{sessionId:id,index:-1}),null);}}
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{assert.equal(binding(t,{sessionId:id,index}),null);if(['x-m33-coins','x-m33-cart'].includes(t.type))associated.push(id+':'+index);});
 assert.deepEqual(all.sort(),fixture.cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(associated.sort(),fixture.associated.map(c=>c.id+':'+c.index).sort());assert.deepEqual(practice.sort(),fixture.practice.map(c=>c.id+':'+c.index).sort());
 const t=at('poundnotation');for(const ctx of [null,[],0,'poundnotation',{}, {sessionId:{toString:null},index:0},{sessionId:['poundnotation'],index:0},{sessionId:'poundnotation',index:'0'},{sessionId:'poundnotation',index:null},{sessionId:'poundnotation',index:{toString:null}},{sessionId:'poundnotation',index:0.1},{sessionId:'poundnotation',index:-1},{sessionId:'poundnotation',index:99},{sessionId:'__proto__',index:0}])assert.equal(binding(t,ctx),null);
 for(const altered of [{...t,prompt:t.prompt+'改'},{...t,target:151},{...t,currency:'USD'},{...t,extra:true}])assert.equal(binding(altered,{sessionId:'poundnotation',index:0}),null);
});

for(const c of fixture.cases)test(c.id+':'+c.index+' visible construction,correction,clear,retry and immutable full submissions',()=>{
 const t=at(c.id,c.index),record=State.freshLesson(c.id);record.index=c.index;let m=State.modelForLesson(record);
 if(t.type==='x-m33-coins')click(t,m,'m33-save');else click(t,m,'m33-choose',c.plan[0]);
 if(t.questions.length){const q=t.questions[0],wrong=q.options?q.options.find(([v])=>v!==c.answers[0])[0]:'999999';field(t,m,'answers.0',wrong);}
 submit(record,false);rejects(t,m);State.supportLesson(record);field(t,m,'prose','保留原来的尝试，再按面值和数量核对。');solve(t,c,m);submit(record,true);
 const p=accepts(t,m);assert.equal(p.currency,c.currency);assert.equal(p.eventCount,m.history.length);assert.deepEqual(p.events.map(e=>e.event),m.history);assert.deepEqual(p.events.map(e=>e.historyIndex),m.history.map((_,i)=>i));
 assert.equal(p.displayTotalsOrigin,'tool');assert.equal(p.independentArithmeticAssessed,false);assert.equal(p.independentExplanationAssessed,false);assert.equal(p.physicalMoneyAssessed,false);assert.equal(p.generalMasteryAssessed,false);assert.equal(p.answerEditTimingKnown,false);
 assert.deepEqual(p.answers.map(a=>a.value),c.math.derivedQuestionValues);assert(p.answers.every(a=>a.submissionOnly));
 for(const e of p.events)assert.equal(BigInt(e.after.totalMinorUnits)-BigInt(e.before.totalMinorUnits),BigInt(e.deltaMinorUnits));
 if(t.type==='x-m33-coins'){
  assert(p.bad);assert.equal(p.first.build.total,0);assert.equal(p.construction.targetMinorUnits,c.math.targetMinorUnits);assert.equal(p.construction.distinctAccepted,c.math.requiredDistinct);
  for(const saved of p.construction.saves){assert.equal(saved.totalMinorUnits,saved.counts.reduce((n,x,i)=>n+x*t.denoms[i].cents,0));assert.equal(saved.coinCount,saved.counts.reduce((a,b)=>a+b,0));assert.equal(saved.terms.reduce((n,x)=>n+x.productMinorUnits,0),saved.totalMinorUnits);}
 }else{assert.deepEqual(p.construction.selected,c.plan);assert.equal(p.construction.totalMinorUnits,c.math.selectionMath[0].totalMinorUnits);}
 submit(record,true);assert(latestSubmissionMatches(m,record.cases[c.index]));
 field(t,m,'prose','这是检查之后编辑的原话。');assert.equal(State.currentSubmission(record).status,'modified');assert.equal(latestSubmissionMatches(m,record.cases[c.index]),false);submit(record,true);
 const before=copy(m),old=copy(record.cases[c.index]);click(t,m,'m33-clear');assert.equal(State.currentSubmission(record).status,'modified');assert.deepEqual(record.cases[c.index],old);
 if(t.type==='x-m33-coins'){assert.deepEqual(m.board.saved,before.board.saved);assert.deepEqual(m.board.first,before.board.first);assert.equal(m.board.bad,before.board.bad);submit(record,true);const q=accepts(t,m);assert.equal(q.construction.current.totalMinorUnits,0);assert(q.construction.acceptedSavedIndices.length);}
 else{submit(record,false);rejects(t,m);}
 m=retry(record,t);assert.equal(m.prose,'');assert.equal(m.history.length,0);assert.equal(m.board.bad,false);submit(record,false);solve(t,c,m);submit(record,true);accepts(t,m);
 assert.deepEqual(State.validateLesson(record,c.id),record);assert.equal(record.cases[c.index].support,true);assert.equal(record.cases[c.index].attempts[0].supported,false);assert(record.cases[c.index].attempts.slice(1).every(a=>a.supported&&a.exposed));
});

test('independent bounded integer enumeration checks every visible coin solution and source restrictions',()=>{
 for(const c of fixture.cases.filter(c=>c.type==='x-m33-coins')){
  const t=at(c.id,c.index),visible=t.visibleIndices||t.denoms.map((_,i)=>i),solutions=[],v=Array(t.denoms.length).fill(0);
  const visit=(i,left)=>{if(i===v.length){if(left===0)solutions.push([...v]);return;}for(let n=0;n<=(visible.includes(i)?Math.min(50,Math.floor(left/t.denoms[i].cents)):0);n++){v[i]=n;visit(i+1,left-n*t.denoms[i].cents);}};visit(0,t.target);
  const count=v=>v.reduce((a,b)=>a+b,0),sort=(a,b)=>count(a)-count(b)||a.reduce((r,x,i)=>r||x-b[i],0);solutions.sort(sort);
  const min=Math.min(...solutions.map(count)),valid=solutions.filter(v=>(!t.minCoins||count(v)===min)&&(!t.mustCounts||t.mustCounts.every(([i,n])=>v[i]===n)));
  assert.equal(solutions.length,c.math.allVisibleBoundedSolutions);assert.equal(digest(JSON.stringify(solutions)),c.math.allSolutionsSha256);assert.equal(valid.length,c.math.sourceCompatibleSolutions);assert.equal(digest(JSON.stringify(valid)),c.math.compatibleSolutionsSha256);assert.equal(min,c.math.fewestCoins);
  const proof=accepts(t,solve(t,c));if(t.minCoins){assert.equal(proof.construction.minimum.coins,min);assert.equal(proof.construction.minimum.childOptimalityProofRecorded,false);}
  probes.integerSolutionsEnumerated+=solutions.length;
 }
 assert.equal(probes.integerSolutionsEnumerated,27821);
});
test('all associated and old practice clones remain mathematically separate from native qualification',()=>{
 for(const c of [...fixture.associated,...fixture.practice]){const t=at(c.id,c.index),m=solve(t,c);accepts(t,m);assert.equal(binding(t,context(c)),null);}
});
test('duplicate saved count vectors do not become distinct combinations',()=>{
 const c=spec('coincombo'),t=at(c.id),m=M.initial(t);answers(t,m,c);c.plan[0].forEach((n,i)=>{for(let j=0;j<n;j++)click(t,m,'m33-add',i);});for(let j=0;j<3;j++)click(t,m,'m33-save');assert.equal(M.inspect(t,m).correct,false);rejects(t,m);solve(t,c,m);const p=accepts(t,m);assert.equal(p.construction.distinctAccepted,3);assert.equal(p.construction.saves.length,6);
});
test('right total with wrong mustCounts or nonminimum coin count stays a genuine unsatisfied constraint',()=>{
 for(const[id,index,counts]of[['poundnotation',1,[0,0,0,15,0,0,0]],['austrans',2,[0,0,0,0,0,17,0]],['auscoins',1,[0,7,0,0,0,0,0]]]){
  const c=spec(id,index),t=at(id,index),m=M.initial(t);counts.forEach((n,i)=>{for(let j=0;j<n;j++)click(t,m,'m33-add',i);});click(t,m,'m33-save');answers(t,m,c);assert.equal(m.issue,'');assert.equal(m.board.bad,false);assert.equal(M.inspect(t,m).correct,false);rejects(t,m);solve(t,c,m);const p=accepts(t,m);assert.equal(p.construction.saves[0].amountMatches,true);assert.equal(p.construction.saves[0].qualifies,false);
 }
});
test('the thirteenth visible save cannot replace twelve wrong saved entries; shared retry preserves attempts',()=>{
 const c=spec('poundnotation'),t=at(c.id),r=State.freshLesson(c.id);let m=State.modelForLesson(r);for(let i=0;i<12;i++)click(t,m,'m33-save');answers(t,m,c);submit(r,false);solve(t,c,m);assert.equal(m.board.saved.length,12);assert(m.board.saved.every(x=>x.total===0));assert.equal(m.history.at(-1).a,'save');submit(r,false);rejects(t,m);click(t,m,'m33-clear');assert.equal(m.board.saved.length,12);const old=copy(r.cases);m=retry(r,t);solve(t,c,m);submit(r,true);accepts(t,m);assert.deepEqual(r.cases[0].attempts.slice(0,2),old[0].attempts);assert.deepEqual(State.validateLesson(r,c.id),r);
});
test('terminal wrong save preserves strict prior saved construction and exact failure issue',()=>{
 const c=spec('poundnotation'),t=at(c.id),m=solve(t,c);click(t,m,'m33-clear');click(t,m,'m33-save');const p=accepts(t,m);assert(p.issue);assert.equal(p.events.at(-1).accepted,false);assert.equal(p.events.at(-1).save.totalMinorUnits,0);assert.equal(p.construction.current.totalMinorUnits,0);assert.deepEqual(p.construction.acceptedSavedIndices,[0]);const bad=copy(m);bad.issue='';assert(M.valid(t,bad));rejects(t,bad);
});
test('fifty-first add remains a recorded visible no-op; zero remove cannot acquire strict evidence',()=>{
 const c=spec('poundnotation'),t=at(c.id),m=M.initial(t);for(let i=0;i<51;i++)click(t,m,'m33-add',0);assert.equal(m.board.counts[0],50);assert.equal(m.history.length,51);for(let i=0;i<50;i++)click(t,m,'m33-remove',0);solve(t,c,m);const p=accepts(t,m);assert.equal(p.events[50].accepted,false);assert.equal(p.events[50].reason,'per-denomination-capacity');assert.equal(p.events[50].effect,false);assert.equal(p.events[50].deltaMinorUnits,0);const bad=copy(m);M.act(t,bad,'m33-clear');M.act(t,bad,'m33-remove',{index:0});assert(M.valid(t,bad));rejects(t,bad);
});
test('1200-event cap produces no synthetic operation and no changed current model',()=>{
 const c=spec('poundnotation'),t=at(c.id),m=solve(t,c);while(m.history.length<1200)click(t,m,'m33-clear');const before=copy(m),p=accepts(t,m);click(t,m,'m33-add',0);assert.deepEqual(m,before);assert.deepEqual(accepts(t,m),p);assert.equal(p.eventCount,1200);assert.equal(p.construction.current.totalMinorUnits,0);
});
test('every budget subset is checked exactly, including over-budget withdrawal and restoration',()=>{
 const c=spec('budgetchoices'),t=at(c.id),m=M.initial(t);let valid=0,invalid=0;
 for(let mask=0;mask<1<<t.items.length;mask++){
  const selected=t.items.flatMap((_,i)=>mask&(1<<i)?[i]:[]);for(const i of [...m.board.selected])if(!selected.includes(i))click(t,m,'m33-choose',i);for(const i of selected)if(!m.board.selected.includes(i))click(t,m,'m33-choose',i);
  const total=selected.reduce((n,i)=>n+BigInt(t.items[i].cents),0n),ok=selected.length>=2&&total<=6000n;assert.equal(M.inspect(t,m).correct,ok);
  if(ok){const p=accepts(t,m);assert.equal(p.construction.totalMinorUnits,Number(total));assert.equal(p.construction.budget.remainingMinorUnits,Number(6000n-total));valid++;}else{rejects(t,m);invalid++;}
 }
 assert.deepEqual([valid,invalid],[24,8]);
});
test('legacy reveal history stays valid original data but cannot prove its visible origin; retry restores eligibility',()=>{
 const c=spec('pennyshop'),t=at(c.id),r=State.freshLesson(c.id);let m=State.modelForLesson(r);m.board.revealed=false;assert(M.valid(t,m));click(t,m,'m33-reveal');solve(t,c,m);submit(r,true);assert(M.inspect(t,m).correct);rejects(t,m);
 const indistinguishable=M.initial(t);M.act(t,indistinguishable,'m33-reveal');solve(t,c,indistinguishable);assert.deepEqual(indistinguishable,m);rejects(t,indistinguishable);
 click(t,m,'m33-clear');solve(t,c,m);submit(r,true);rejects(t,m);const old=copy(r.cases);m=retry(r,t);solve(t,c,m);submit(r,true);accepts(t,m);assert.deepEqual(r.cases[0].attempts.slice(0,2),old[0].attempts);assert.deepEqual(State.validateLesson(r,c.id),r);
 const state=Core.fresh();state.lessons[c.id]=r;const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url))),text=JSON.stringify(Core.backup(state)),packed=Storage.packText(text,0);assert.equal(Storage.unpackText(packed),text);assert.deepEqual(Core.parseBackup(text,atlas),state);
});
test('currency, exact money input grammar and canonical visible select values are respected',()=>{
 const c=spec('poundnotation'),t=at(c.id),m=solve(t,c);for(const[i,value]of[[0,'150c'],[0,'1.50'],[1,'$1.50'],[1,'1.500']]){answers(t,m,c);field(t,m,'answers.'+i,value);assert.equal(M.inspect(t,m).correct,false);rejects(t,m);}field(t,m,'answers.0',' 150 p ');field(t,m,'answers.1',' £ 1 . 5 0 ');const p=accepts(t,m);assert.deepEqual(p.answers.map(x=>x.value),[150,150]);
 const s=spec('coincombo',2),u=at(s.id,s.index),n=solve(u,s);n.answers[0]=' same ';assert(M.inspect(u,n).correct);rejects(u,n);
 const q=spec('austrans',2),v=at(q.id,q.index),a=solve(v,q);for(const value of ['4','4.00000000','8/2','4 0/1']){field(v,a,'answers.0',value);assert.equal(accepts(v,a).answers[0].value,4);}for(const value of ['4.00000001','4.000000001','4e0','-4']){field(v,a,'answers.0',value);rejects(v,a);}
});
test('malformed roots,unused fields,noncanonical events,hidden actions and inconsistent states fail closed',()=>{
 const c=spec('poundnotation'),t=at(c.id),good=solve(t,c);
 for(const mutate of [m=>m.extra=1,m=>m.formula='1+1',m=>m.estimate='5',m=>m.issue='invented',m=>m.history[0].extra=1,m=>m.history[0].i='0',m=>m.history[0].v='extra',m=>m.history.push({a:'method',i:'bar',v:''}),m=>m.history.splice(m.history.findIndex(e=>e.a==='add'),1),m=>m.board.saved[0].total++,m=>m.board.first.build.total++,m=>m.answers.push('150'),m=>m.history=[],m=>m.history[1].i='00',m=>m.history[1].i='0.0',m=>m.history[1].i=0,m=>m.board.counts[0]++]){const bad=copy(good);mutate(bad);rejects(t,bad);}
 for(const bad of [null,[],0,{}, {...good,history:null},{...good,board:null},{...good,answers:null}])rejects(t,bad);
 const s=spec('coincombo'),u=at(s.id),m=solve(u,s);M.act(u,m,'m33-add',{index:4});M.act(u,m,'m33-remove',{index:4});assert(M.valid(u,m));assert(M.inspect(u,m).correct);rejects(u,m);
 const basket=spec('pennyshop'),v=at(basket.id),a=solve(v,basket);a.estimate='100';M.act(v,a,'m33-estimate');assert(M.valid(v,a));rejects(v,a);
});
test('other B33 types and estimate lock remain original behavior outside this adapter',()=>{
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{if(t.type.startsWith('x-m33-')&&!['x-m33-coins','x-m33-cart'].includes(t.type)){assert.equal(binding(t,{sessionId:id,index}),null);rejects(t,M.initial(t));}});
 const t=at('moneycalc'),m=M.initial(t);field(t,m,'estimate','100');click(t,m,'m33-estimate');assert.equal(m.board.estimate,'100');assert(!V.render(t,m).includes('data-xfield="estimate"'));field(t,m,'formula','4.85+12.30+7.95');click(t,m,'m33-run');field(t,m,'answers.0','25.10');assert(M.inspect(t,m).correct);assert.equal(m.board.last.result,485+1230+795);assert.equal(m.board.first.estimate,'100');rejects(t,m);
});

test('every native feedback requires the complete latest submission and attributes tool totals accurately',()=>{
 for(const c of fixture.cases){
  const t=at(c.id,c.index),r=State.freshLesson(c.id);r.index=c.index;const m=State.modelForLesson(r),ctx=context(c);
  const adapters=EVIDENCE_ADAPTERS.filter(a=>a.binding(t,ctx));assert.equal(adapters.length,1);assert.equal(adapters[0].id,c.type==='x-m33-coins'?'money-coins':'money-cart');
  const guide=thinkingGuide(t,ctx);assert(guide);assert.match(guide.question,/[？?]/);
  solve(t,c,m);assert.equal(thinkingFeedback(t,m,r.cases[c.index],ctx),null);submit(r,true);
  const record=r.cases[c.index],proof=accepts(t,m),feedback=thinkingFeedback(t,m,record,ctx),words=JSON.stringify(feedback);
  assert(feedback);assert.equal(feedback.method,null);assert.match(words,/合计和余款由工具显示/);assert.match(words,/不据此评价独立心算/);assert.doesNotMatch(words,/MP\.\d|已经掌握|你算出/);
  if(proof.kind==='coins')assert.match(words,new RegExp('每种合计 '+c.math.targetMinorUnits));
  else assert.match(words,new RegExp('工具合计 '+proof.construction.totalMinorUnits));
  const prior=copy(record),edited=copy(m);field(t,m,'prose','现在换一种解释');assert.equal(thinkingFeedback(t,m,record,ctx),null);assert.deepEqual(record,prior);
  Object.assign(m,edited);submit(r,true);assert(thinkingFeedback(t,m,record,ctx));assert.deepEqual(record.attempts.slice(0,-1),prior.attempts);
  if(proof.kind==='coins'){click(t,m,'m33-clear');assert.equal(thinkingFeedback(t,m,record,ctx),null);submit(r,true);const clearWords=JSON.stringify(thinkingFeedback(t,m,record,ctx));assert.match(clearWords,/当前桌面是 0/);assert.match(clearWords,/按当时保存/);}
  else{click(t,m,'m33-clear');assert.equal(thinkingFeedback(t,m,record,ctx),null);submit(r,false);assert.equal(thinkingFeedback(t,m,record,ctx),null);solve(t,c,m);submit(r,true);assert(thinkingFeedback(t,m,record,ctx));}
  for(const malformed of [null,{},[],{...ctx,index:String(c.index)},{...ctx,index:-1}]){assert.equal(thinkingGuide(t,malformed),null);assert.equal(thinkingFeedback(t,m,record,malformed),null);}
 }
});
test('choice feedback uses all four original visible labels without changing proof or records',()=>{
 const expected=[
  ['coincombo',2,0,'两组摆法的总额','same','一样'],
  ['modmoney',1,2,'£1.50表示','change','找回的钱'],
  ['auscoins',2,1,'$10够吗','yes','够'],
  ['lifemath38',2,2,'£1.50表示','change','找回的钱']
 ];
 const actual=fixture.cases.flatMap(c=>at(c.id,c.index).questions.flatMap((q,index)=>q.kind==='choice'?[[c.id,c.index,index,q.label,q.value,q.options.find(([value])=>value===q.value)[1]]]:[]));
 assert.deepEqual(actual,expected);
 for(const[id,index,question,label,raw,visible]of expected){
  const c=spec(id,index),t=at(id,index),r=State.freshLesson(id);r.index=index;const m=State.modelForLesson(r);solve(t,c,m);submit(r,true);
  const before=copy(r),proof=accepts(t,m),feedback=thinkingFeedback(t,m,r.cases[index],context(c));
  assert.equal(proof.answers[question].raw,raw);assert(feedback.detail.some(line=>line.includes(`本次提交的“${label}”是“${visible}”`)));
  assert(!feedback.detail.some(line=>line.includes(`本次提交的“${label}”是“${raw}”`)));
  assert.deepEqual(replay(t,m),proof);assert.deepEqual(r,before);
 }
});
test('numeric feedback preserves submitted currency and spacing verbatim',()=>{
 const c=spec('poundnotation'),t=at(c.id),r=State.freshLesson(c.id),m=State.modelForLesson(r);solve(t,c,m);
 const raw=[' 150 p ',' £ 1 . 5 0 '];raw.forEach((value,index)=>field(t,m,'answers.'+index,value));submit(r,true);
 const before=copy(r),proof=accepts(t,m),feedback=thinkingFeedback(t,m,r.cases[0],context(c));
 assert.deepEqual(proof.answers.map(answer=>answer.raw),raw);
 for(const answer of proof.answers)assert(feedback.detail.some(line=>line.includes(`本次提交的“${answer.label}”是“${answer.raw}”`)));
 assert.deepEqual(replay(t,m),proof);assert.deepEqual(r,before);
});
test('saved success, terminal failed save, optimum and budget feedback do not invent independent work',()=>{
 const c=spec('poundnotation'),t=at(c.id),r=State.freshLesson(c.id),m=State.modelForLesson(r);solve(t,c,m);click(t,m,'m33-clear');click(t,m,'m33-save');submit(r,true);
 const words=JSON.stringify(thinkingFeedback(t,m,r.cases[0],context(c)));assert.match(words,/保存了 1 种/);assert.match(words,/当前桌面是 0/);assert.match(words,/当前保存提示仍在/);assert.match(words,/1 次金额尚未对上/);assert.match(words,/1 × 50 \+ 1 × 100 = 150/);
 const q=spec('austrans',2),u=at(q.id,q.index),a=solve(u,q),text=JSON.stringify(thinkingFeedback(u,a,{attempts:[{value:copy(a)}]},context(q)));assert.match(text,/核对器用整数面值检验了最少枚数/);assert.match(text,/不表示记录里包含你独立证明/);
 const b=spec('budgetchoices'),v=at(b.id),n=solve(v,b),budget=JSON.stringify(thinkingFeedback(v,n,{attempts:[{value:copy(n)}]},context(b)));assert.equal(v.questions.length,0);assert.match(budget,/这条显示不作为一次独立的余款作答/);assert.doesNotMatch(budget,/本次提交的/);
});
test('associated, old practice and ambiguous legacy reveal cannot inherit native UI qualification',()=>{
 for(const c of [...fixture.associated,...fixture.practice]){const t=at(c.id,c.index),m=solve(t,c),r={attempts:[{value:copy(m)}]};assert.equal(thinkingGuide(t,context(c)),null);assert.equal(thinkingFeedback(t,m,r,context(c)),null);}
 const c=spec('pennyshop'),t=at(c.id),r=State.freshLesson(c.id);let m=State.modelForLesson(r);m.board.revealed=false;click(t,m,'m33-reveal');solve(t,c,m);submit(r,true);const saved=copy(r.cases);
 assert.equal(thinkingFeedback(t,m,r.cases[0],context(c)),null);assert.equal(State.currentSubmission(r).status,'correct');m=retry(r,t);solve(t,c,m);submit(r,true);assert(thinkingFeedback(t,m,r.cases[0],context(c)));assert.deepEqual(r.cases[0].attempts.slice(0,1),saved[0].attempts);
});

test('the browser plan uses only original visible controls for every fixed native and associated task',()=>{
 for(const c of [...fixture.cases,...fixture.associated]){
  const t=at(c.id,c.index),m=M.initial(t);
  // Start from a genuine wrong attempt so cart toggles must account for the
  // actual prior selection instead of always assuming a blank basket.
  if(t.type==='x-m33-cart')click(t,m,'m33-choose',c.plan[0]);else click(t,m,'m33-save');
  for(const step of browserPlan.operationPlan(c,m))if(step.field)field(t,m,step.field,step.value);else click(t,m,step.action,step.index);
  accepts(t,m);
 }
 const source=readFileSync(new URL('./p9-money-adapter-browser.cjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/force:\s*true|\.dispatchEvent\(|\.setAttribute\(['"](?:open|disabled)/);
 assert.doesNotMatch(source,/\.setInputFiles\(/);
 assert.match(source,/waitForEvent\('filechooser'\)/);assert.match(source,/chooser\.setFiles\(/);
 assert.match(source,/ancestor::details\[not\(@open\) and not\(ancestor::details\[not\(@open\)\]\)\]/);
});
