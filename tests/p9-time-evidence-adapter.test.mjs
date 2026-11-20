import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-time-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b32-model.js';
import * as V from '../dist/learning/phase5/b32-view.js';
import {freshLesson,submitLesson,currentSubmission,validateLesson} from '../dist/learning/state.js';
import {studyActionFocus} from '../dist/learning/workspace-flow.js';
import {timeBinding,replayTimeEvidence as replay} from '../dist/learning/time-evidence.js';
import {timeCompareBinding,replayTimeCompareEvidence} from '../dist/learning/timecompare-evidence.js';
import {clockSettingBinding,replayClockSettingEvidence} from '../dist/learning/clock-setting-evidence.js';
import {calendarIntervalBinding,replayCalendarIntervalEvidence} from '../dist/learning/calendar-interval-evidence.js';
import {calendarDateReadingBinding,replayCalendarDateReadingEvidence} from '../dist/learning/calendar-date-reading-evidence.js';
import {timeUnitPartsBinding,replayTimeUnitPartsEvidence} from '../dist/learning/time-unit-parts-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {applyTimeFixtureStep as apply,timeEvidenceExample as example} from '../scripts/time-evidence-fixture.mjs';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

await ensureB39Ready();
const cp=structuredClone,{cases,excludedCases,associatedCases}=fixture;
const task=c=>sessionTasks(c.id)[c.index],key=c=>c.id+':'+c.index;
const act=(t,m,a,index)=>apply(t,m,{action:'t32-'+a,...(index===undefined?{}:{data:{index}})});
const field=(t,m,k,v)=>apply(t,m,{field:k,value:String(v)});
const answers=(c,m)=>c.answers.forEach((v,i)=>field(task(c),m,'answers.'+i,v));
const saved=m=>({support:false,attempts:[{value:cp(m)}]});
const accepted=(t,m)=>{assert.ok(M.valid(t,m));assert.ok(M.inspect(t,m).correct);const p=replay(t,m);assert.ok(p);return p;};
const rejected=(t,m)=>assert.equal(replay(t,m),null);
const find=(id,index=0)=>cases.find(c=>c.id===id&&c.index===index);
// #273: these six independently source-reviewed native comparison positions
// gain a different strict adapter. The old 20 time constructions keep their
// exact type and all other answer-only/bridge locations remain excluded.
const reviewedCompare=new Set(['timecompare:0','timecompare:1','timecompare:2',
 'durationorder:1','durationwork:1','minuteclock:2']);
// #306: these three setting tasks have their own source and mathematical replay,
// without expanding the earlier 20 strict time-construction positions.
const reviewedClock=new Set(['hourclock:2','fiveclock:2','quarterclock:1']);
const reviewedCalendar=new Set(['calendaruse:2','calendaruse:3']);
// #329: date identification is a different Gregorian contract from the old day interval.
const reviewedDateReading=new Set(['calendaruse:0','calendaruse:1']);
const reviewedUnitParts=new Set(['durationunit:2','hoursday:0','hoursday:1','hoursday:2',
 'timeconvert:0','timeconvert:1','calendarfacts:0']);

function repair(c,m){
 const t=task(c),kind=c.type.slice(6);
 if(['roman','order','steps'].includes(kind))act(t,m,'clear');
 if(kind==='parts')for(const i of [...m.board.selected])act(t,m,'part',i);
 if(kind==='stopwatch'){
  if(!m.board.stopped){
   act(t,m,'start');
   while(m.board.elapsed<c.expected.durationSeconds){const remaining=c.expected.durationSeconds-m.board.elapsed;act(t,m,'tick',remaining>=30?30:10);}
   act(t,m,'stop');
  }
  answers(c,m);return m;
 }
 for(const step of c.actions)apply(t,m,step);return m;
}
function wrong(c,m){
 const t=task(c),kind=c.type.slice(6);
 if(kind==='roman'){act(t,m,'pick',4);act(t,m,'place',5);}
 if(kind==='order')for(const i of [...c.expected.orderedIdentities].reverse())act(t,m,'order',i);
 if(kind==='parts'){if(t.requiredParts)act(t,m,'part',1);else{act(t,m,'part',0);act(t,m,'part',1);}}
 if(kind==='stopwatch'){act(t,m,'start');act(t,m,'tick',10);act(t,m,'stop');}
 if(kind==='steps'){field(t,m,'jump','-0 1/2');act(t,m,'move');}
 answers(c,m);assert.equal(M.inspect(t,m).correct,false);return m;
}
function wrongCurrentAnswer(c,m){
 const t=task(c);
 if(!t.questions.length){act(t,m,'clear');return;}
 const q=t.questions[0];field(t,m,'answers.0',q.options?q.options.find(([v])=>v!==c.answers[0])[0]:q.kind==='time24'?'00:00':String(Number(c.answers[0])+1));
}
function recordFor(c,m){const a=freshLesson(c.id);a.index=c.index;a.models[c.index]=m;return a;}
function submit(a,correct){
 const before=cp(a.cases[a.index]?.attempts??[]),m=cp(a.models[a.index]);
 assert.equal(submitLesson(a).correct,correct);
 assert.deepEqual(a.cases[a.index].attempts.slice(0,-1),before);
 assert.deepEqual(a.cases[a.index].attempts.at(-1).value,m);
 assert.deepEqual(a.models[a.index],m);
 return a.cases[a.index];
}

test('20 time constructions and 40 existing tasks stay isolated except three dials, two calendar intervals, two date readings and seven unit cards',()=>{
 assert.equal(cases.length,20);assert.equal(new Set(cases.map(c=>c.nodeId)).size,10);
 assert.equal(excludedCases.length,40);assert.equal(associatedCases.length,63);
 assert.deepEqual(Object.fromEntries(['order','parts','roman','stopwatch','steps'].map(k=>[k,cases.filter(c=>c.type==='x-t32-'+k).length])),{order:5,parts:5,roman:1,stopwatch:3,steps:6});
 const native=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).map((t,index)=>({id,index,t}))).filter(x=>M.TYPES.has(x.t.type));
 const associated=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).map((t,index)=>({id,index,t}))).filter(x=>M.TYPES.has(x.t.type));
 assert.deepEqual(native.map(key).sort(),[...cases,...excludedCases].map(key).sort());
 assert.deepEqual(associated.map(key).sort(),associatedCases.map(key).sort());
 for(const c of [...cases,...excludedCases,...associatedCases]){
  const t=task(c),m=example(t);
  assert.equal(taskFingerprint(t),c.taskHash,key(c));assert.ok(M.valid(t,m));assert.ok(M.inspect(t,m).correct);
  assert.deepEqual(m.answers,c.answers);
  const previousFamily=cases.includes(c),newComparison=reviewedCompare.has(key(c)),newClock=reviewedClock.has(key(c)),newCalendar=reviewedCalendar.has(key(c)),newDateReading=reviewedDateReading.has(key(c)),newUnitParts=reviewedUnitParts.has(key(c));
  // Old fixture compatibility accepts its own id/index shape. The new adapter
  // deliberately uses the canonical native context rather than coercing id.
  const nativeContext={sessionId:c.id,index:c.index};
  const visibleContext=(newComparison||newClock||newCalendar||newDateReading||newUnitParts)?nativeContext:c;
  assert.equal(!!timeBinding(t,c),previousFamily,
   key(c)+' old 20 constructions must remain independently source-bound');
  assert.equal(!!timeCompareBinding(t,nativeContext),newComparison,
   key(c)+' only the six reviewed compare positions get another adapter');
  assert.equal(!!replayTimeCompareEvidence(t,m,nativeContext),newComparison,
   key(c)+' only real original comparison events may replay');
  assert.equal(!!clockSettingBinding(t,nativeContext),newClock,
   key(c)+' only the three separately reviewed original dial tasks may bind');
  assert.equal(!!replayClockSettingEvidence(t,m,nativeContext),newClock,
   key(c)+' only real original dial-setting actions may replay');
   assert.equal(!!calendarIntervalBinding(t,nativeContext),newCalendar,
    key(c)+' only the two reviewed day-interval originals may bind');
   assert.equal(!!replayCalendarIntervalEvidence(t,m,nativeContext),newCalendar,
    key(c)+' only the two reviewed day-interval originals may replay');
   assert.equal(!!calendarDateReadingBinding(t,nativeContext),newDateReading,
    key(c)+' only the two reviewed date-identification originals may bind');
   assert.equal(!!replayCalendarDateReadingEvidence(t,m,nativeContext),newDateReading,
    key(c)+' only source-bound original date-identification clicks may replay');
  assert.equal(!!timeUnitPartsBinding(t,nativeContext),newUnitParts,
   key(c)+' only seven independently reviewed time-unit tasks can bind');
  assert.equal(!!replayTimeUnitPartsEvidence(t,m,nativeContext),newUnitParts,
   key(c)+' only original unit-card clicks can replay');
  assert.equal(!!thinkingGuide(t,visibleContext),previousFamily||newComparison||newClock||newCalendar||newDateReading||newUnitParts,
   key(c)+' source-scoped thinking guide');
  assert.equal(!!thinkingFeedback(t,m,saved(m),visibleContext),previousFamily||newComparison||newClock||newCalendar||newDateReading||newUnitParts,
   key(c)+' source-scoped checked feedback');
  if(!c.id.startsWith('link-')&&!previousFamily)rejected(t,m);
 }
 for(const [path,wanted] of Object.entries(fixture.sourceFiles))
  assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),wanted,path+' retains the original model/view');
});

test('all positive constructions match independent literal identities, quantities and time coordinates',()=>{
 for(const c of cases){
  const t=task(c),m=example(t),p=accepted(t,m),x=p.construction,e=c.expected;
  assert.equal(p.history.events.length,m.history.length);
  assert.deepEqual(p.answers.map(a=>a.raw),c.answers);
  if(p.kind==='roman'){
   assert.deepEqual(x.positions,e.slots.map(({position,numeral,value})=>({position,label:numeral,value})));
   assert.equal(x.four,4);
  }else if(p.kind==='order'){
   assert.deepEqual(x.identities,e.orderedIdentities);assert.deepEqual(x.labels,e.orderedLabels);
   assert.deepEqual(x.values,e.orderedIdentities.map(i=>String(e.values[i]*(x.reference==='time-of-day'?60:1))));
  }else if(p.kind==='parts'){
   assert.equal(x.whole,e.whole);assert.equal(x.equalParts,e.equalParts);assert.equal(x.unitPart,e.unitPartAmount);assert.equal(x.amount,e.selectedAmount);
   assert.equal(x.count,e.selectedCount);assert.equal(x.partitionByTool,true);
  }else if(p.kind==='stopwatch'){
   assert.equal(x.elapsed,e.durationSeconds);assert.deepEqual(x.ticks,e.exampleSimulatedTicks);assert.equal(x.minutes,e.totalMinutes);assert.equal(x.simulated,true);
   assert.ok(p.history.acceptedTicks.every(t=>t.requested===t.advanced&&[10,30].includes(t.advanced)));
  }else{
   assert.deepEqual(x.segments.map(s=>s.step),e.exampleChosenSegments);
   assert.deepEqual([x.segments[0].from,...x.segments.map(s=>s.to)],e.balances);
   assert.deepEqual([x.startClock,...x.segments.map(s=>s.toClock)],e.displayedClocks);
   assert.equal(x.duration,e.durationMinutes);assert.equal(x.coordinatesByTool,true);
  }
 }
});

test('20 real wrong constructions can be corrected, locally cleared where available, and checked five times without deleting attempts',()=>{
 for(const c of cases){
  const t=task(c),m=wrong(c,M.initial(t)),a=recordFor(c,m),history=cp(m.history),first=cp(m.board.first);
  assert.equal(studyActionFocus({task:t,model:m}).readyToCheck,true,'B32 follows the existing check path');
  submit(a,false);rejected(t,m);
  repair(c,m);assert.deepEqual(m.history.slice(0,history.length),history);
  for(const [k,v] of Object.entries(first))assert.deepEqual(m.board.first[k],v);
  const p=accepted(t,m);submit(a,true);submit(a,true);
  wrongCurrentAnswer(c,m);assert.equal(currentSubmission(a).status,'modified');
  assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);submit(a,false);
  repair(c,m);submit(a,true);accepted(t,m);
  assert.equal(a.cases[c.index].attempts.length,5);
  assert.deepEqual(validateLesson(cp(a),c.id).cases,a.cases);
  assert.ok(thinkingFeedback(t,m,a.cases[c.index],c));
  assert.deepEqual(p.first,first,'the first actual recorded construction is not renamed as a fresh prediction');
 }
});

test('shared retry keeps checked attempts, replaces only the current model, and preserves the original identical-snapshot contract',()=>{
 for(const c of cases){
  const t=task(c),a=recordFor(c,wrong(c,M.initial(t)));submit(a,false);repair(c,a.models[c.index]);submit(a,true);
  const old=cp(a.cases);a.view='task';a.models[c.index]=M.initial(t);
  assert.deepEqual(a.cases,old);assert.equal(currentSubmission(a).status,'modified');
  assert.equal(thinkingFeedback(t,a.models[c.index],a.cases[c.index],c),null);
  for(const s of c.actions)apply(t,a.models[c.index],s);
  assert.deepEqual(a.cases,old);assert.equal(currentSubmission(a).status,'modified');
  assert.equal(thinkingFeedback(t,a.models[c.index],a.cases[c.index],c),null);submit(a,true);
  assert.ok(thinkingFeedback(t,a.models[c.index],a.cases[c.index],c));
  const same=recordFor(c,example(t));submit(same,true);same.models[c.index]=M.initial(t);
  for(const s of c.actions)apply(t,same.models[c.index],s);
  assert.equal(currentSubmission(same).status,'correct');
  assert.ok(thinkingFeedback(t,same.models[c.index],same.cases[c.index],c),'byte-identical reconstruction follows original complete snapshot equality');
 }
});

test('visible no-ops and repeated requests remain while impossible cross-widget requests fail closed',()=>{
 for(const c of cases){
  const t=task(c),m=example(t),kind=c.type.slice(6),before=cp(m.history);
  if(kind==='roman'){act(t,m,'place',0);act(t,m,'place',0);}
  if(kind==='order'){act(t,m,'order',m.board.order[0]);act(t,m,'order',m.board.order[0]);}
  if(kind==='parts'){const i=m.board.selected[0];act(t,m,'part',i);act(t,m,'part',i);}
  if(kind==='stopwatch'){act(t,m,'start');act(t,m,'tick',10);act(t,m,'stop');}
  if(kind==='steps'){field(t,m,'jump','0');act(t,m,'move');field(t,m,'jump','0');act(t,m,'move');}
  const proof=accepted(t,m);assert.deepEqual(m.history.slice(0,before.length),before);
  if(kind==='steps'){assert.equal(proof.history.failedRequests.length,2);assert.match(proof.issue,/每一步/);}
  else if(kind!=='parts')assert.ok(proof.history.noops.length>=2);
  const hidden=cp(m);M.act(t,hidden,'t32-unit',{index:0});assert.ok(M.valid(t,hidden));rejected(t,hidden);
 }
});

test('each stopwatch preserves zero/early stops, whole rejected overshoots and subsequent correction',()=>{
 for(const c of cases.filter(c=>c.type==='x-t32-stopwatch'))for(const firstTick of [0,10]){
  const t=task(c),m=M.initial(t);act(t,m,'tick',10);act(t,m,'stop');
  act(t,m,'start');if(firstTick)act(t,m,'tick',firstTick);act(t,m,'stop');
  assert.equal(m.board.first.stop,firstTick);assert.equal(m.board.bad,true);
  act(t,m,'start');while(m.board.elapsed<c.expected.durationSeconds){const left=c.expected.durationSeconds-m.board.elapsed;act(t,m,'tick',left>=30?30:10);}
  const elapsed=m.board.elapsed;act(t,m,'tick',30);assert.equal(m.board.elapsed,elapsed);assert.match(m.issue,/超过/);
  act(t,m,'stop');answers(c,m);const p=accepted(t,m);
  assert.equal(p.first.stop,firstTick);assert.equal(p.history.failedRequests.length,2);
  assert.equal(p.history.acceptedTicks.reduce((n,t)=>n+t.advanced,0),c.expected.durationSeconds);
  const fake=cp(m);fake.issue='forged';assert.ok(M.valid(t,fake));rejected(t,fake);
 }
});

test('unrendered 1-second and 60-second ticks cannot become evidence although the original model accepts them',()=>{
 for(const size of [1,60]){
  const c=find('durationunit'),t=task(c),m=M.initial(t);M.act(t,m,'t32-start');
  for(let n=0;n<60;n+=size)M.act(t,m,'t32-tick',{index:size});M.act(t,m,'t32-stop');answers(c,m);
  assert.ok(M.valid(t,m));assert.ok(M.inspect(t,m).correct);rejected(t,m);
  assert.doesNotMatch(V.controls(t,m),new RegExp(`data-x="t32-tick"[^>]*data-index="${size}"`));
 }
});

test('all six time paths require two retained segments without changing original one-hop completion',()=>{
 for(const c of cases.filter(c=>c.type==='x-t32-steps')){
  const t=task(c),m=M.initial(t);field(t,m,'jump',c.expected.durationMinutes);act(t,m,'move');answers(c,m);
  assert.ok(M.inspect(t,m).correct);rejected(t,m);assert.equal(thinkingFeedback(t,m,saved(m),c),null);
  repair(c,m);accepted(t,m);
  const first=cp(m.board.first);act(t,m,'clear');field(t,m,'jump',c.expected.durationMinutes);act(t,m,'move');
  assert.ok(M.inspect(t,m).correct);assert.deepEqual(m.board.first,first);rejected(t,m);
  repair(c,m);const proof=accepted(t,m),last=proof.construction.segments.at(-1);
  act(t,m,'undo');rejected(t,m);field(t,m,'jump',String(last.step));act(t,m,'move');accepted(t,m);
  const pending=cp(m);field(t,pending,'jump','999');assert.ok(M.inspect(t,pending).correct);
  const p=accepted(t,pending);assert.deepEqual(p.construction,replay(t,m).construction);
  assert.deepEqual(p.jumpInput,{current:'999',lastRequested:String(last.step),pending:true});
 }
});

test('all six paths retain executed segments when a visible unapplied jump is edited and then the complete work is checked again',()=>{
 for(const c of cases.filter(c=>c.type==='x-t32-steps'))for(const raw of ['7','','-0 1/2','1e1']){
  const t=task(c),m=example(t),a=recordFor(c,m),proof=accepted(t,m);submit(a,true);
  const old=cp(a.cases),history=cp(m.history),board=cp(m.board);
  field(t,m,'jump',raw);assert.deepEqual(m.history,history);assert.deepEqual(m.board,board);
  assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);
  assert.deepEqual(a.cases,old);submit(a,true);assert.equal(currentSubmission(a).status,'correct');
  const after=accepted(t,m);assert.deepEqual(after.construction,proof.construction);
  assert.deepEqual(after.history,proof.history);
  assert.deepEqual(after.jumpInput,{current:raw,lastRequested:proof.jumpInput.lastRequested,pending:true});
  assert.match(JSON.stringify(thinkingFeedback(t,m,a.cases[c.index],c)),/待应用/);
  assert.deepEqual(a.cases[c.index].attempts[0],old[c.index].attempts[0]);
  assert.deepEqual(validateLesson(cp(a),c.id).cases,a.cases);
 }
});

test('exact rational spellings follow real rejection/correction paths, including bounded precision and negative mixed numbers',()=>{
 const spellings=['','0','-1','-0 1/2','−0 1/2','–0 1/2','-0 0/1','1/0','1 2/2','1\t1/2','1 \t1/2','1.0000000000000000001','NaN','Infinity','0x10','1e1','1/2','1.25','+1','1.00000000','2/2','0001'];
 for(const c of cases.filter(c=>c.type==='x-t32-steps'))for(const raw of spellings){
  const t=task(c),m=M.initial(t);field(t,m,'jump',raw);act(t,m,'move');
  const before=cp(m.history),first=cp(m.board.first),originalBoard=cp(m.board);
  repair(c,m);const p=accepted(t,m);
  assert.deepEqual(m.history.slice(0,before.length),before);assert.deepEqual(p.first,first);
  assert.deepEqual(p.history.events[0].after,originalBoard,'independent replay agrees with actual accepted or rejected request '+raw);
 }
 for(const c of cases.filter(c=>c.answers.length&&task(c).questions[0].kind==='number')){
  const t=task(c),normal=example(t);
  for(const value of [c.answers[0]+'/1','+'+c.answers[0],c.answers[0]+'.00000000']){
   const m=cp(normal);field(t,m,'answers.0',value);accepted(t,m);
  }
  const over=cp(normal);field(t,over,'answers.0',c.answers[0]+'.0000000001');
  assert.equal(M.inspect(t,over).correct,false,'the original bounded parser already rejects overprecision');rejected(t,over);
 }
});

test('parts preserve selected identities, permit all unspecified equal parts, and require the earlier half when specified',()=>{
 for(const c of cases.filter(c=>c.type==='x-t32-parts')){
  const t=task(c);
  for(let i=0;i<t.parts;i++){
   const m=M.initial(t);act(t,m,'part',i);answers(c,m);
   if(t.requiredParts&&i!==0){assert.equal(M.inspect(t,m).correct,false);rejected(t,m);act(t,m,'part',i);act(t,m,'part',0);}
   const p=accepted(t,m);assert.equal(p.construction.amount,c.expected.selectedAmount);
  }
 }
});

test('roman replacement moves unique identities and preserves first misplaced symbol through clear',()=>{
 const c=find('romanclock',1),t=task(c),m=M.initial(t);
 act(t,m,'pick',4);act(t,m,'place',5);act(t,m,'pick',3);act(t,m,'place',5);
 assert.equal(m.board.placed[5],3);assert.equal(m.board.placed.includes(4),false);
 act(t,m,'pick',3);act(t,m,'place',3);assert.equal(m.board.placed[5],null);
 const history=cp(m.history);repair(c,m);const p=accepted(t,m);
 assert.deepEqual(m.history.slice(0,history.length),history);assert.deepEqual(p.first.place,{numeral:4,position:5});
 assert.equal(p.bad,true);assert.equal(p.construction.positions.length,12);
});

test('complete model, event, issue and source corruption fail closed without touching valid work',()=>{
 for(const c of cases){
  const t=task(c),m=example(t),before=JSON.stringify({t,m});
  const mutations=[x=>x.extra=true,x=>x.hour='1',x=>x.minute='1',x=>x.issue='fabricated',x=>x.board.extra=true,
   x=>x.board.first.extra=true,x=>x.history[0].extra=true,x=>x.history[0].v='unrecorded',
   x=>x.history.push({a:'unit',i:'0',v:''}),x=>x.history[0].i=Number(x.history[0].i),
   x=>x.history=[],x=>x.history=Array(1201).fill(x.history[0]),x=>x.answers.push('invented')];
  if(c.type!=='x-t32-steps')mutations.push(x=>x.jump='hidden');
  for(const mutate of mutations){const changed=cp(m);mutate(changed);rejected(t,changed);assert.equal(thinkingFeedback(t,changed,saved(changed),c),null);}
  for(const changed of [null,{},[],{...t,type:'x-t32-clock'},{...t,prompt:null},{...t,extra:true}])rejected(changed,m);
  assert.equal(timeBinding({...t,prompt:t.prompt+' changed'},c),null);
  assert.equal(thinkingFeedback(t,m,{attempts:[]},c),null);
  const edited=cp(m);edited.prose='自由文字不是自动评分';assert.equal(thinkingFeedback(t,edited,saved(m),c),null);
  assert.equal(JSON.stringify({t,m}),before);
 }
 const c=find('romanclock',1),t=task(c),m=example(t);m.history.find(e=>e.a==='pick'&&e.i==='4').i='04';assert.ok(M.valid(t,m));rejected(t,m);
});

test('feedback states the limits of each actual construction without solver output, invented method labels or automatic free-text grading',()=>{
 for(const c of cases){
  const t=task(c),m=repair(c,wrong(c,M.initial(t))),feedback=thinkingFeedback(t,m,saved(m),c),guide=thinkingGuide(t,c);
  assert.ok(feedback);assert.ok(guide);assert.equal(feedback.method,null);
  const words=JSON.stringify(feedback);assert.match(words,/自由解释/);assert.match(words,/长期掌握/);assert.doesNotMatch(words,/MP\.\d|已掌握/);
  if(c.type==='x-t32-stopwatch'){assert.match(words,/模拟/);assert.match(words,/没有据此评价真实活动计时/);}
  if(c.type==='x-t32-parts'){assert.match(words,/等分来自工具/);assert.match(words,/实际选中/);}
  if(c.type==='x-t32-order'){assert.match(words,/逐张放入/);assert.match(words,/没有记录每次比较的理由/);}
  if(c.type==='x-t32-steps'){assert.match(words,/当前保留下来的分段/);assert.match(words,/时间坐标由工具显示/);}
  if(c.type==='x-t32-roman'){assert.match(words,/第一次实际摆放/);assert.match(words,/不称作事先预测/);}
 }
});
