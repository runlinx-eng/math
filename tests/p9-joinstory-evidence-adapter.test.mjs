import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-joinstory-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionMeta} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b10-model.js';
import * as V from '../dist/learning/phase5/b10-view.js';
import {joinStoryBinding,replayJoinStoryEvidence} from '../dist/learning/joinstory-evidence.js';
import {joinStoryEvidenceExample,joinStorySolveSteps} from '../scripts/joinstory-evidence-fixture.mjs';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {freshLesson,submitLesson} from '../dist/learning/state.js';
import {studyActionFocus} from '../dist/learning/workspace-flow.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
const {cases,associated,sourceHashes}=fixture;
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const clone=structuredClone;
const original=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);};
const accepts=(t,m)=>{original(t,m);const p=replayJoinStoryEvidence(t,m);assert.ok(p);return p;};
const rejects=(t,m,label)=>assert.equal(replayJoinStoryEvidence(t,m),null,label);
const result=t=>t.a+(t.op==='+'?t.b:-t.b);
const expected=t=>t.hidden?t[t.hidden]:result(t);
const counters={paths:0,buttons:0,fields:0,verdicts:0};

// All positive construction helpers check the actual original view first.
// No direct board/model writes impersonate counter or demonstration actions.
function step(t,m,s){
 const html=V.controls(t,m);
 if(s.field){
  const found=[...html.matchAll(/<(input|select)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)].filter(x=>x[2]===s.field);
  assert.equal(found.length,1,s.field+' must be a real visible field');assert.doesNotMatch(found[0][0],/\bdisabled\b/);
  if(found[0][1]==='select')assert.ok(html.slice(found[0].index).split('</select>')[0].includes('value="'+s.value+'"'));
  m[s.field]=s.value;M.field(t,m,s.field);counters.fields++;
 }else{
  const found=[...html.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>x.includes('data-x="'+s.action+'"')&&
   Object.entries(s.data||{}).every(([k,v])=>x.includes('data-'+k+'="'+v+'"')));
  assert.equal(found.length,1,s.action+' must be a real visible button');assert.doesNotMatch(found[0],/\bdisabled\b/);
  M.act(t,m,s.action,s.data);counters.buttons++;
 }
 assert.equal(M.valid(t,m),true);return m;
}
const field=(t,m,key,value)=>step(t,m,{field:key,value:String(value)});
const act=(t,m,action,data)=>step(t,m,{action,data});
function parts(t,m,a,b){for(const[group,n]of[['left',a],['right',b]])while(m[group]!==n)act(t,m,'story-counter',{group,delta:n>m[group]?1:-1});}
function demo(t,m,a,b,op,guessValue){parts(t,m,a,b);field(t,m,'guess',guessValue);field(t,m,'op',op);act(t,m,'story-do');}
function finish(t,m,guessValue=String(expected(t))){
 demo(t,m,t.a,t.b,t.op,guessValue);
 field(t,m,'equation',t.balance?`${t.a}+${t.b}=${t.balance[0]}+${t.balance[1]}`:`${t.a}${t.op}${t.b}=${result(t)}`);
 if(t.swap){act(t,m,'story-swap');field(t,m,t.op==='+'?'otherEquation':'shortage',t.op==='+'?`${t.b}+${t.a}=${result(t)}`:'not-enough');}
 return m;
}

test('complete independent task/source fingerprints bind exactly 41 native positions and 19 source nodes',()=>{
 assert.equal(cases.length,41);assert.equal(new Set(cases.map(c=>c.nodeId)).size,19);assert.equal(associated.length,26);
 for(const[path,digest]of Object.entries(sourceHashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),digest,path);
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index];assert.deepEqual(t,c.task);assert.equal(hash(t),c.taskHash);assert.equal(sessionMeta(c.id).topicId,c.nodeId);
  const binding=joinStoryBinding(t,c);assert.equal(binding.nodeId,c.nodeId);assert.equal(binding.method,null);assert.ok(binding.question);
  for(const bad of [null,[],false,c.id,{}, {...c,index:String(c.index)},{...c,index:-1},{...c,index:999},
   {...c,sessionId:'__proto__'},{...c,sessionId:{toString:null}}])assert.equal(joinStoryBinding(t,bad),null);
  for(const changed of [{...t,a:t.a+1},{...t,prompt:t.prompt+' changed'},{...t,unreviewed:true},{...t,type:'x-splitbench'}])assert.equal(joinStoryBinding(changed,c),null);
 }
 const found=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{if(joinStoryBinding(t,{sessionId:id,index}))found.push(id+':'+index);});
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 const bridges=[];
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  assert.equal(joinStoryBinding(t,{sessionId:id,index}),null,id+':'+index);
  if(t.type==='x-joinstory')bridges.push(id+':'+index);
 });
 assert.deepEqual(bridges.sort(),associated.map(c=>c.id+':'+c.index).sort());
});

for(const c of cases)test(`${c.id}:${c.index} proves recorded displays and submitted relations through actual controls`,()=>{
 const t=sessionTasks(c.id)[c.index],m=M.initial(t);counters.paths++;
 for(const s of joinStorySolveSteps(t))step(t,m,s);
 const before=JSON.stringify(m),p=accepts(t,m);counters.verdicts++;
 assert.deepEqual(m,joinStoryEvidenceExample(t));assert.equal(JSON.stringify(m),before);
 assert.equal(p.evidenceScope,'recorded-demonstrations-and-swaps');assert.equal(p.demonstrations.length,1);
 assert.deepEqual(p.latest,{a:t.a,b:t.b,op:t.op,result:result(t),display:p.demonstrations[0].display,guess:String(expected(t))});
 assert.equal(p.firstPrediction.role,t.hidden||'result');assert.equal(p.firstPrediction.expected,expected(t));assert.equal(p.firstPrediction.correct,true);
 assert.equal(p.demonstrations[0].matchesTask,true);assert.equal(p.demonstrations[0].sameAsPreviousRecordedDisplay,false);
 assert.equal(p.swaps.length,t.swap?1:0);assert.equal(p.submitted.equation.value,result(t));
 if(t.balance)assert.deepEqual(p.reference,{parts:t.balance,total:result(t),providedBy:'tool'});else assert.equal(p.reference,null);
 if(t.compare){assert.equal(p.currentDisplay.kind,'comparison');assert.equal(p.currentDisplay.paired,t.b);assert.equal(p.currentDisplay.leftUnpaired,t.a-t.b);}
 if(t.b===0)assert.equal(p.latest.display.zeroChange,true);
 if(t.swap&&t.op==='-')assert.deepEqual(p.currentDisplay,{kind:'insufficient',available:t.b,requested:t.a,shownRemoved:t.b,remaining:0,missing:t.a-t.b,physicalResult:null});
 const record={attempts:[{correct:true,value:clone(m)}]};assert.equal(latestSubmissionMatches(m,record),true);
 const changed=clone(m);changed.guess=String(expected(t)+1);assert.equal(latestSubmissionMatches(changed,record),false);rejects(t,changed);
 record.attempts.push({correct:true,value:clone(changed)});assert.equal(latestSubmissionMatches(m,record),false);
 assert.deepEqual(replayJoinStoryEvidence(t,JSON.parse(before)),p);
});

test('every associated copy is actually solvable yet remains isolated from native binding',()=>{
 for(const c of associated){
  const t=sessionTasks(c.id)[c.index],m=M.initial(t);counters.paths++;
  assert.equal(hash(t),c.taskHash);assert.equal(sessionMeta(c.id).topicId,c.nodeId);
  assert.equal(BRIDGES[c.id].from,c.from);assert.equal(BRIDGES[c.id].to,c.to);
  for(const s of joinStorySolveSteps(t))step(t,m,s);
  original(t,m);assert.ok(replayJoinStoryEvidence(t,m));counters.verdicts++;
  assert.equal(joinStoryBinding(t,c),null);
 }
});

test('wrong first guesses preserve a or b roles and never become a correct sum guess for a hidden quantity',()=>{
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t,{guess:'-1'}),p=accepts(t,m);
  assert.deepEqual(p.firstPrediction,{role:t.hidden||'result',scope:'task-question',expected:expected(t),raw:'-1',value:-1,correct:false});
  assert.equal(p.latest.guess,'-1');
  if(t.hidden){const sourceExample=M.example(t);assert.equal(sourceExample.first,String(result(t)));assert.equal(accepts(t,sourceExample).firstPrediction.correct,false);}
  field(t,m,'guess',String(expected(t)));assert.equal(M.inspect(t,m).correct,true);rejects(t,m,'unrecorded changed guess is not the recorded one');
  act(t,m,'story-do');if(t.swap)act(t,m,'story-swap');
  const corrected=accepts(t,m);assert.equal(corrected.firstPrediction.raw,'-1');assert.equal(corrected.firstPrediction.correct,false);
  assert.equal(corrected.demonstrations.at(-1).guess.correct,true);assert.equal(corrected.demonstrations.at(-1).sameAsPreviousRecordedDisplay,!t.swap);
 }
});

test('faithful alternative experiments can be corrected without pretending all earlier choices matched the question',()=>{
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index],m=M.initial(t);counters.paths++;
  const a=t.rep==='fingers'?3:5,b=1,op=t.compare?'-':t.rep==='fingers'?'+':t.op==='+'?'-':'+';
  demo(t,m,a,b,op,'-2');assert.equal(m.history.length,1);finish(t,m);
  const p=accepts(t,m);counters.verdicts++;
  assert.equal(p.demonstrations.length,2);assert.equal(p.demonstrations[0].matchesTask,false);assert.equal(p.demonstrations[1].matchesTask,true);
  assert.equal(p.firstPrediction.raw,'-2');assert.equal(p.firstPrediction.correct,false);
 }
});

test('a guess can match an exploratory display while differing from the original question',()=>{
 const t=sessionTasks('jointhings')[0],m=M.initial(t);demo(t,m,2,1,'+','3');finish(t,m);
 const p=accepts(t,m),g=p.demonstrations[0].guess;
 assert.equal(g.scope,'task-question');assert.equal(g.expected,5);assert.equal(g.correct,false);
 assert.equal(g.displayExpected,3);assert.equal(g.matchesDisplay,true);
 assert.equal(p.firstPrediction.scope,'task-question');assert.equal(p.firstPrediction.correct,false);
});

test('unrecorded failed clicks and counter edits are explicitly outside the evidence scope',()=>{
 const t=sessionTasks('jointhings')[0],m=M.initial(t);parts(t,m,3,2);
 assert.deepEqual(m.history,[]);act(t,m,'story-do');assert.deepEqual(m.history,[]);assert.ok(m.issue);
 finish(t,m);const p=accepts(t,m);
 assert.equal(p.demonstrations.length,1);assert.equal(p.firstPrediction.raw,'5');
 assert.deepEqual(p.unrecorded,['individual-counter-edits','operator-edits','guess-edits','unsuccessful-clicks','equation-edit-order','shortage-choice-edits']);
});

test('repeated demonstrations are explicit display requests, not additional construction or movement',()=>{
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t);act(t,m,'story-do');
  if(t.swap)act(t,m,'story-swap');const p=accepts(t,m);
  assert.equal(p.demonstrations.length,2);assert.equal(p.demonstrations[1].sameAsPreviousRecordedDisplay,!t.swap);
  assert.deepEqual(p.demonstrations[0].display,p.demonstrations[1].display);
 }
});

test('exchange parity and the most recent demonstration determine the actual display',()=>{
 for(const c of cases.filter(c=>c.task.swap)){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t),originalDone=clone(m.done);
  act(t,m,'story-swap');assert.equal(M.inspect(t,m).correct,false);rejects(t,m);
  act(t,m,'story-swap');const p=accepts(t,m);
  assert.deepEqual(p.swaps.map(s=>s.swapped),[true,false,true]);assert.deepEqual(m.done,originalDone);
  if(t.op==='-'){assert.equal(m.done.result,2);assert.equal(p.currentDisplay.physicalResult,null);assert.equal(p.currentDisplay.missing,2);}
  act(t,m,'story-do');assert.equal(m.swapped,false);rejects(t,m);act(t,m,'story-swap');
  const returned=accepts(t,m);assert.equal(returned.demonstrations.at(-1).sameAsPreviousRecordedDisplay,false,
   'the new record differs from the previously recorded exchanged display');
 }
});

test('a matching prior record never proves that unrecorded counter edits left the live display unchanged',()=>{
 const t=sessionTasks('jointhings')[0],m=joinStoryEvidenceExample(t),history=clone(m.history);
 act(t,m,'story-counter',{group:'left',delta:1});act(t,m,'story-counter',{group:'left',delta:-1});
 assert.deepEqual(m.history,history);assert.equal(m.done,null);assert.match(V.visual(t,m),/b10-trays/);
 act(t,m,'story-do');const p=accepts(t,m);
 assert.equal(p.demonstrations[1].sameAsPreviousRecordedDisplay,true);
 assert.ok(p.unrecorded.includes('individual-counter-edits'));
});

test('two actual zero-change tasks require recorded actions and report zero objects added or removed',()=>{
 for(const index of [2,3]){
  const t=sessionTasks('basicadd')[index],m=joinStoryEvidenceExample(t),p=accepts(t,m);
  assert.equal(p.latest.result,t.a);assert.equal(p.latest.display.zeroChange,true);
  assert.equal(p.latest.display.kind,t.op==='+'?'join':'take');
  const empty=clone(m);empty.history=[];original(t,empty);rejects(t,empty);
 }
});

test('the balance reference is tool-provided and both submitted expressions must identify the actual parts',()=>{
 const t=sessionTasks('signsfirst')[2],m=joinStoryEvidenceExample(t);
 field(t,m,'equation','3 ＋ 2 ＝ 4 + 1');const p=accepts(t,m);assert.equal(p.reference.providedBy,'tool');
 assert.deepEqual(p.submitted.equation.left,[3,'+',2]);assert.deepEqual(p.submitted.equation.right,[4,'+',1]);
 for(const bad of ['5=5','2+3=4+1','3+2=1+4','4+1=2+2']){const n=clone(m);n.equation=bad;rejects(t,n);}
});

test('exact equations allow reversed equalities and additive order, with unicode separators but no digit concatenation',()=>{
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t);
  if(!t.balance){field(t,m,'equation',`${result(t)} ＝ ${t.a} ${t.op==='+'?'＋':'−'} ${t.b}`);accepts(t,m);
   if(t.op==='+'){field(t,m,'equation',`${t.b} + ${t.a} = ${result(t)}`);accepts(t,m);}}
  for(const raw of ['','5=5=5','2**3=8','1e1+2=12','3/1+2=5','NaN=NaN','3+2=05']){const n=clone(m);n.equation=raw;rejects(t,n);}
 }
 for(const c of cases.filter(c=>c.task.a>=10)){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t);m.equation=`${String(t.a).split('').join(' ')}${t.op}${t.b}=${result(t)}`;
  original(t,m);rejects(t,m,'the original whitespace cleaner must not manufacture a multi-digit number');
 }
});

test('guess integers preserve raw spelling while expressions, fractional precision and split digits are rejected',()=>{
 const t=sessionTasks('jointhings')[0];
 for(const raw of [' 0005 ','-0','-9999']){const m=joinStoryEvidenceExample(t,{guess:raw});const p=accepts(t,m);assert.equal(p.firstPrediction.raw,raw);assert.equal(p.firstPrediction.value,Number(raw)||0);}
 for(const raw of ['5.0','+5','5e0','5/1','1 2','10000','--1','Infinity']){
  const m=joinStoryEvidenceExample(t);m.history[0].guess=raw;m.first=raw;m.guess=raw;original(t,m);rejects(t,m);
 }
});

test('inaccurate hand and pairing displays cannot be laundered by a later correct demonstration',()=>{
 const runs=[['showactions',1,6,2,'+'],['showactions',1,5,2,'-'],['takethings',2,7,4,'+'],['takethings',2,3,5,'-'],['takethings',0,2,5,'-']];
 for(const[id,index,a,b,op]of runs){
  const t=sessionTasks(id)[index],m=M.initial(t);demo(t,m,a,b,op,'0');const badVisual=V.visual(t,m);
  if(t.rep==='fingers'&&a===6)assert.equal((badVisual.match(/class="up"/g)||[]).length,7,'source really caps a six-finger part at five');
  if(t.rep==='fingers'&&op==='-')assert.equal((badVisual.match(/class="up"/g)||[]).length,5,'source does not cross out fingers');
  if(t.compare)assert.match(badVisual,/同列配成一对/);
  finish(t,m);original(t,m);rejects(t,m,id+':'+index+' retains the unsuitable historical display');
 }
});

test('taking zero in a hand exploration needs no crossed fingers and remains a faithful unchanged quantity',()=>{
 const t=sessionTasks('showactions')[1],m=M.initial(t);demo(t,m,3,0,'-','3');finish(t,m);
 const p=accepts(t,m);assert.deepEqual(p.demonstrations[0].display,{kind:'take',whole:3,taken:0,remaining:3,zeroChange:true});
 assert.equal(p.demonstrations[0].guess.matchesDisplay,true);assert.equal(p.demonstrations[0].guess.correct,false);
});

test('the mathematical model can accept invisible fields, but strict evidence requires the real UI contract',()=>{
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t);
  const hidden=!t.swap?['otherEquation','shortage']:t.op==='+'?['shortage']:['otherEquation'];
  for(const key of hidden){const n=clone(m);assert.doesNotMatch(V.controls(t,n),new RegExp('data-xfield="'+key+'"'));n[key]=key==='shortage'?'not-enough':'3+2=5';original(t,n);rejects(t,n);}
  if(t.swap){const originalExample=M.example(t);original(t,originalExample);rejects(t,originalExample,'the old example fills a hidden unused field');}
 }
 const t=sessionTasks('jointhings')[0],m=joinStoryEvidenceExample(t);
 assert.doesNotMatch(V.controls(t,m),/data-x="story-swap"/);M.act(t,m,'story-swap');original(t,m);rejects(t,m,'a model action not exposed by this task is not UI evidence');
});

test('all recorded event keys, arithmetic, first guess, final snapshot and current fields are cross-checked',()=>{
 const t=sessionTasks('jointhings')[0],base=joinStoryEvidenceExample(t);
 const mutations={
  empty:m=>m.history=[],unknown:m=>m.history.push({action:'reset'}),extra:m=>m.extra=true,
  extraEvent:m=>m.history[0].extra=true,missingEventField:m=>delete m.history[0].guess,
  noninteger:m=>m.history[0].a=3.5,overflow:m=>m.history[0].a=41,negative:m=>m.history[0].b=-1,
  falseResult:m=>m.history[0].result=6,wrongOperator:m=>m.history[0].op='*',
  changedFirst:m=>m.first='6',changedLastGuess:m=>m.guess='6',missingFirst:m=>m.first=null,
  finalPart:m=>m.done.a=4,extraDone:m=>m.done.unseen=true,currentPart:m=>m.left=4,
  currentOperator:m=>m.op='-',unfinished:m=>m.done=null,issue:m=>m.issue='unresolved',
  swapBefore:m=>m.history.unshift({action:'swap',swapped:true}),forgedCounter:m=>m.history.unshift({action:'story-counter',group:'left',delta:1})
 };
 for(const[label,mutate]of Object.entries(mutations)){const m=clone(base);mutate(m);rejects(t,m,label);}
 for(const model of [null,[],false,'model',{},Object.assign(clone(base),{history:new Array(1501).fill(base.history[0])})])rejects(t,model);
 const swapTask=sessionTasks('swapadd')[0],swapped=joinStoryEvidenceExample(swapTask);
 for(const change of [m=>m.history[1].swapped=false,m=>m.history[1].extra=1,m=>m.history[1].swapped='true',m=>m.history.pop(),m=>m.swapped=false]){const m=clone(swapped);change(m);rejects(swapTask,m);}
});

test('unsupported task structure and cross-type histories fail closed without changing originals',()=>{
 const t=sessionTasks('jointhings')[0],m=joinStoryEvidenceExample(t),before=JSON.stringify([t,m]);
 for(const changed of [{...t,extra:1},{...t,a:41},{...t,a:3.1},{...t,rep:'unknown'},{...t,hidden:'c',target:5},
  {...t,target:5},{...t,hidden:'a',target:4},{...t,compare:true},{...t,swap:false},{...t,balance:[2,4]},
  {...t,rep:'fingers',a:6},{...t,type:'x-countsteps'}])rejects(changed,m);
 const cross=clone(m);cross.history.push({action:'b11-hop',from:0,to:5});rejects(t,cross);
 assert.equal(JSON.stringify([t,m]),before);
});

test('both browser submission paths preserve all five real state snapshots for every native position',()=>{
 for(const swappedRequests of [1,3])for(const c of cases){
  const t=sessionTasks(c.id)[c.index],a=freshLesson(c.id),m=M.initial(t),snapshots=[];a.index=c.index;a.models[c.index]=m;counters.paths++;
  const check=(correct,strict)=>{
   assert.equal(studyActionFocus({task:t,model:m}).readyToCheck,true);
   const before=clone(m),older=clone(a.cases[c.index]?.attempts||[]),result=submitLesson(a);
   assert.equal(result.correct,correct);assert.equal(!!replayJoinStoryEvidence(t,m),strict);
   assert.deepEqual(m,before);assert.deepEqual(a.cases[c.index].attempts.slice(0,-1),older);
   assert.deepEqual(a.cases[c.index].attempts.at(-1).value,before);snapshots.push(clone(a.cases[c.index].attempts.at(-1)));counters.verdicts++;
  };
  check(false,false);finish(t,m,'-1');field(t,m,'equation',`${t.a}${t.op}${t.b}=${result(t)+1}`);check(false,false);
  field(t,m,'equation',t.balance?`${t.a}+${t.b}=${t.balance[0]}+${t.balance[1]}`:`${t.a}${t.op}${t.b}=${result(t)}`);check(true,true);
  field(t,m,'guess','0');assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);check(true,false);
  act(t,m,'story-do');if(t.swap)for(let i=0;i<swappedRequests;i++)act(t,m,'story-swap');check(true,true);
  assert.equal(a.cases[c.index].attempts.length,5);assert.deepEqual(a.cases[c.index].attempts,snapshots);
  assert.deepEqual(JSON.parse(JSON.stringify(a)).cases[c.index].attempts,snapshots);
 }
});

test('original rendering exposes the counted quantities, matched pairs and faithful zero displays',()=>{
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t),html=V.visual(t,m),p=accepts(t,m);
  if(t.rep==='fingers')assert.equal((html.match(/class="up"/g)||[]).length,t.a+t.b);
  else if(t.compare){assert.equal((html.match(/<i class=/g)||[]).length,t.a+t.b);assert.equal((html.match(/ cross"/g)||[]).length,2*t.b);}
  else if(t.swap&&t.op==='-'){assert.match(html,/这堆已经拿空，仍然不够/);assert.equal((html.match(/<i class=/g)||[]).length,t.b);}
  else if(!t.balance){assert.equal((html.match(/<i class=/g)||[]).length,t.op==='+'?t.a+t.b:t.a);if(t.op==='-')assert.equal((html.match(/ cross"/g)||[]).length,t.b);}
  assert.equal(p.latest.result,result(t));
 }
 console.log('joinstory original view/control probe '+JSON.stringify(counters));
});

const savedRecord=value=>({support:false,attempts:[{value:clone(value)}]});
const words=feedback=>[feedback.observation,...feedback.detail].join('\n');

test('shared feedback requires all three source, replay and latest full submission gates',()=>{
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t),record=savedRecord(m),before=JSON.stringify([m,record]);
  const guide=thinkingGuide(t,c);assert.match(guide.summary,/想一想/);assert.equal(guide.question,joinStoryBinding(t,c).question);
  const feedback=thinkingFeedback(t,m,record,c);assert.ok(feedback);assert.equal(feedback.method,null);
  const text=words(feedback);assert.match(text,/演示/);assert.match(text,/系统/);assert.match(text,/当前提交/);assert.match(text,/没有记录逐颗操作或每一次尝试/);
  assert.doesNotMatch(text,/你(?:逐颗|逐个|亲手)(?:数|搬|配|划)/);assert.doesNotMatch(text,/已掌握|独立完成|MP\.\d/);
  assert.match(text,/自由解释/);assert.match(text,/长期掌握/);
  for(const invalid of [null,{attempts:[]},{attempts:[{value:M.initial(t)}]},{attempts:[{value:clone(m)},{value:M.initial(t)}]}])assert.equal(thinkingFeedback(t,m,invalid,c),null);
  const edited=clone(m);edited.guess='-2';assert.equal(thinkingFeedback(t,edited,record,c),null);assert.equal(thinkingFeedback(t,edited,savedRecord(edited),c),null);
  assert.equal(thinkingFeedback(t,m,record,{}),null);assert.equal(thinkingFeedback({...t,prompt:t.prompt+' changed'},m,record,c),null);
  assert.equal(JSON.stringify([m,record]),before);
 }
 for(const c of associated){const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t);assert.equal(thinkingGuide(t,c),null);assert.equal(thinkingFeedback(t,m,savedRecord(m),c),null);}
});

test('feedback distinguishes the original question from a mathematically correct exploratory guess',()=>{
 const c=cases.find(c=>c.id==='jointhings'&&c.index===0),t=sessionTasks(c.id)[c.index],m=M.initial(t);
 demo(t,m,2,1,'+','3');finish(t,m);const text=words(thinkingFeedback(t,m,savedRecord(m),c));
 assert.match(text,/本题要找的是.*当前作品核对得到 5，与这个猜想不同/);
 assert.match(text,/探索记录的是 2 \+ 1 = 3/);assert.match(text,/对应猜想框的量是 3，与当时猜想相同/);
 assert.doesNotMatch(text,/猜错|算错/);
 for(const c of cases.filter(c=>c.task.hidden)){
  const t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t,{guess:String(result(t))}),text=words(thinkingFeedback(t,m,savedRecord(m),c));
  assert.ok(text.includes('当前作品核对得到 '+t[t.hidden]));assert.match(text,/与这个猜想不同/);
  assert.ok(text.includes(t.hidden==='a'?'原来的一堆':t.op==='+'?'另一部分':'要取走的数量'));
 }
});

test('feedback distinguishes zero, system pairing and the tool-provided equality reference',()=>{
 for(const index of [2,3]){
  const c=cases.find(c=>c.id==='basicadd'&&c.index===index),t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t),text=words(thinkingFeedback(t,m,savedRecord(m),c));
  assert.match(text,index===2?/增加0个，数量保持不变/:/取走0个，数量保持不变/);assert.match(text,/1 次演示请求/);
 }
 const c=cases.find(c=>c.id==='takethings'&&c.index===2),t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t),text=words(thinkingFeedback(t,m,savedRecord(m),c));
 assert.match(text,/系统配对显示 4 对，第一排还多 3 个/);assert.match(text,/这是数量比较/);assert.doesNotMatch(text,/你.*拿走/);
 const balanced=cases.find(c=>c.id==='signsfirst'&&c.index===2),bt=sessionTasks(balanced.id)[balanced.index],bm=joinStoryEvidenceExample(bt);
 const balanceText=words(thinkingFeedback(bt,bm,savedRecord(bm),balanced));assert.match(balanceText,/3 与 2 是工具给定的参照，共 5/);assert.doesNotMatch(balanceText,/你.*构造.*两边/);
});

test('feedback describes exchanged insufficiency without negative objects or an invented unchanged live screen',()=>{
 const c=cases.find(c=>c.id==='swapadd'&&c.index===2),t=sessionTasks(c.id)[c.index],m=joinStoryEvidenceExample(t);
 act(t,m,'story-do');act(t,m,'story-swap');const feedback=thinkingFeedback(t,m,savedRecord(m),c),text=words(feedback);
 assert.match(feedback.observation,/从 5 个中表示取走 3 个.*还剩 2 个/);
 assert.match(text,/当前显示从 3 个中尝试取走 5 个/);assert.match(text,/最多划去已有的 3 个，仍少 2 个，实物不够/);
 assert.doesNotMatch(text,/-2 个|−2 个|负.*物品|画面没有改变/);
 assert.doesNotMatch(text,/又请求过相同数量和动作的演示/);
 const j=cases[0],jt=sessionTasks(j.id)[j.index],jm=joinStoryEvidenceExample(jt);
 act(jt,jm,'story-counter',{group:'left',delta:1});act(jt,jm,'story-counter',{group:'left',delta:-1});act(jt,jm,'story-do');
 const re=words(thinkingFeedback(jt,jm,savedRecord(jm),j));assert.match(re,/又请求过相同数量和动作的演示/);assert.doesNotMatch(re,/画面没有改变|你逐颗|你逐个/);
});

test('correct-looking models with unsuitable history or invisible fields receive no shared strict feedback',()=>{
 for(const c of cases.filter(c=>c.task.swap)){
  const t=sessionTasks(c.id)[c.index],m=M.example(t);original(t,m);assert.equal(thinkingFeedback(t,m,savedRecord(m),c),null);
 }
 for(const[id,index,a,b,op]of [['showactions',1,6,2,'+'],['showactions',1,5,2,'-'],['takethings',2,7,4,'+'],['takethings',0,2,5,'-']]){
  const c=cases.find(c=>c.id===id&&c.index===index),t=sessionTasks(id)[index],m=M.initial(t);demo(t,m,a,b,op,'0');finish(t,m);original(t,m);
  assert.equal(thinkingFeedback(t,m,savedRecord(m),c),null);
 }
});
