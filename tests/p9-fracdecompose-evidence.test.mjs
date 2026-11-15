import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {PRACTICE} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b18-model.js';
import * as V from '../dist/learning/phase5/b18-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import {fracDecomposeBinding,replayFracDecomposeEvidence} from '../dist/learning/fracdecompose-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import fixture from './fixtures/p9-fracdecompose-cases.cjs';

// Independent source fixture, integer partitions and visible original controls.
// No production proof helper, original example or solveSteps supplies answers.
await ensureB39Ready();
const {cases,bridges,practices}=fixture,cp=x=>structuredClone(x);
const FIELDS=['guess','equation','answer','whole','part','factor','choice','low','high','inside','story','tile','count','simple','inverse','scaledA','scaledB','decimal','denom','unit','amount','result'];
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const taskFor=c=>sessionTaskFor(c.id,c.index),key=parts=>[...parts].sort((a,b)=>a-b).join(',');
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
const ratio=(n,d=1)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n<0n?-n:n,d);return[Number(n/g),Number(d/g)];};
const fmt=r=>r[1]===1?String(r[0]):r.join('/');
const expectedEquation=(t,parts)=>`${t.n}/${t.d}=${parts.map(n=>fmt(ratio(n,t.d))).join('+')}`;
const actualParts=(t,m)=>[0,...m.board.cuts,t.n].slice(1).map((end,i)=>end-[0,...m.board.cuts,t.n][i]);
const metrics={acceptedChecks:0,fields:0,buttons:0,canonicalPartitions:0,duplicatePartitions:0,minimalGoalSets:0,actualChromium:false};
const fill=(t,m,value)=>{
 assert.match(V.render(t,m),/data-xfield="equation"/,'equation is an actual visible field');
 m.equation=String(value);M.field(t,m,'equation');metrics.fields++;return m;
};
const rawAct=(t,m,action,data={})=>M.act(t,m,'b18-'+action,data);
const act=(t,m,action,data={})=>{
 const buttons=(V.render(t,m).match(/<button\b[^>]*>/g)||[]).filter(s=>s.includes(`data-x="b18-${action}"`)&&
  (action!=='cut'||s.includes(`data-index="${data.index}"`)));
 assert.equal(buttons.length,1,`${action} ${data.index??''} is a unique visible control`);
 assert.doesNotMatch(buttons[0],/\bdisabled\b/);metrics.buttons++;
 rawAct(t,m,action,data);assert.equal(M.valid(t,m),true);return m;
};
const draft=(c,m,parts,raw)=>{
 const t=taskFor(c);assert.equal(parts.reduce((a,b)=>a+b,0),t.n);
 act(t,m,'new-groups');let cut=0;for(const size of parts.slice(0,-1)){cut+=size;act(t,m,'cut',{index:cut});}
 fill(t,m,raw??expectedEquation(t,parts));assert.deepEqual(actualParts(t,m),parts);return m;
};
const save=(c,m,parts,raw)=>{draft(c,m,parts,raw);act(taskFor(c),m,'save');return m;};
const finish=(c,m)=>{
 for(const parts of c.expected.exampleParts)if(!m.board.saved.some(s=>key(s.parts)===key(parts)))save(c,m,parts);
 return m;
};
const build=c=>finish(c,M.initial(taskFor(c)));
const record=m=>({support:false,attempts:[{value:cp(m)}]});
const proof=(c,m)=>{
 const t=taskFor(c),before=JSON.stringify(m);
 assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
 const p=replayFracDecomposeEvidence(t,m);assert.ok(p,`${c.id}:${c.index} has strict saved-work evidence`);
 assert.equal(JSON.stringify(m),before,'proof reads without rewriting the model');
 assert.deepEqual(p.totalQuantity,c.expected.total);assert.deepEqual(p.unitValue,c.expected.unit);
 assert.equal(p.pieceCount,t.n);assert.deepEqual(p.referenceWhole,[1,1]);
 assert.equal(p.goal.minimumSaved,c.expected.minimumSaved);assert.equal(p.goal.completed,true);
 assert.equal(p.goal.distinctSaved,m.board.saved.length);
 assert.deepEqual(p.goal.requiredCanonicalParts,c.expected.requiredParts.map(p=>[...p].sort((a,b)=>a-b)));
 assert.deepEqual(p.savedDecompositions.map(s=>({parts:s.parts,equation:s.equation.raw})),m.board.saved);
 for(const saved of p.savedDecompositions){
  assert.equal(saved.parts.reduce((a,b)=>a+b,0),t.n);
  assert.deepEqual(saved.groupQuantities,saved.parts.map(n=>ratio(n,t.d)));
  assert.equal(saved.canonicalKey,key(saved.parts));assert.equal(saved.isSplit,true);assert.equal(saved.mathematicalMatch,true);
  assert.equal(saved.equation.valid,true);assert.deepEqual(saved.equation.sum,c.expected.total);
  assert.equal(key(saved.equation.terms.map(term=>term.pieces)),key(saved.parts));
  assert.equal(m.history[saved.historyIndex].a,'save');assert.equal(m.history[saved.historyIndex].f.equation,saved.equation.raw);
 }
 assert.deepEqual(p.currentDraft.parts,actualParts(t,m));assert.deepEqual(p.currentDraft.cuts,m.board.cuts);
 assert.equal(p.currentDraft.equation.raw,m.equation);assert.equal(p.issue,m.issue);
 assert.equal(p.events.length,m.history.length);assert.equal(p.eventCount,m.history.length);
 assert.deepEqual(p.events.map(e=>e.historyIndex),m.history.map((_,i)=>i));
 assert.deepEqual(p.events.map(e=>e.action),m.history.map(e=>e.a));
 assert.deepEqual(p.failedRequests,p.events.filter(e=>!e.accepted));
 assert.deepEqual(p.resets,p.events.filter(e=>e.action==='reset'));assert.deepEqual(p.newGroups,p.events.filter(e=>e.action==='new-groups'));
 assert.equal(p.firstAttempt.action,'save');assert.equal(p.firstAttempt.historyIndex,m.history.findIndex(e=>e.a==='save'));
 assert.deepEqual({parts:p.firstAttempt.decomposition.parts,equation:p.firstAttempt.fields.equation},m.board.first);
 assert.equal(p.currentRoundFirstAttempt.action,'save');
 assert.equal(p.assessmentLimits.recordingLimit,1200);assert.equal(p.assessmentLimits.method,null);
 for(const name of ['physicalActionAssessed','independentDrawingAssessed','openExplanationAssessed','authorshipAssessed',
  'generalMasteryAssessed','allLaterClicksRecorded','historyCompletenessAuthenticated','exactKeystrokeOrderKnown'])assert.equal(p.assessmentLimits[name],false);
 assert.equal(p.assessmentLimits.currentDraftSeparatelyAssessed,true);
 assert.deepEqual(p.systemGenerated,{initialUnitPieces:true,groupedDiagram:true,groupPieceCounts:true,savedEquationDisplay:true});
 metrics.acceptedChecks++;return p;
};
const rejected=(c,m,message)=>assert.equal(replayFracDecomposeEvidence(taskFor(c),m),null,message);
const originalOnly=(c,m,message)=>{
 assert.equal(M.valid(taskFor(c),m),true,message+' keeps original validation');
 assert.equal(M.inspect(taskFor(c),m).correct,true,message+' keeps original grading');rejected(c,m,message);
};

test('reviewed fingerprints enumerate all three native, five associated and one practice position',()=>{
 assert.deepEqual(Object.keys(M.fields),FIELDS);assert.equal(cases.length,3);
 for(const[path,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+path,import.meta.url))),expected,path);
 for(const c of [...cases,...bridges,...practices]){
  const t=taskFor(c);assert.deepEqual(t,c.task);assert.equal(hash(t),c.taskHash);
  assert.equal((LESSONS[c.id]||BRIDGES[c.id]).topicId,c.nodeId);
  assert.deepEqual(ratio(t.n,t.d),c.expected.total);assert.deepEqual(ratio(1,t.d),c.expected.unit);
 }
 const native=[],bound=[],associated=[],practice=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-fracdecompose')native.push(id+':'+index);
  if(fracDecomposeBinding(t,{sessionId:id,index}))bound.push(id+':'+index);
 });
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  assert.equal(fracDecomposeBinding(t,{sessionId:id,index}),null);
  if(t.type==='x-fracdecompose')associated.push(id+':'+index);
 });
 for(const[id,t]of Object.entries(PRACTICE)){
  assert.equal(fracDecomposeBinding(t,{sessionId:id,index:-1}),null);
  if(t.type==='x-fracdecompose')practice.push(id+':-1');
 }
 assert.deepEqual(native.sort(),cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(bound.sort(),native);
 assert.deepEqual(associated.sort(),bridges.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(practice.sort(),practices.map(c=>c.id+':-1').sort());
});

test('binding requires an exact native position, complete original task and typed context',()=>{
 for(const c of cases){
  const t=taskFor(c),s=fracDecomposeBinding(t,c);assert.equal(s.nodeId,c.nodeId);assert.equal(s.method,null);assert.ok(thinkingGuide(t,c));
  for(const context of [null,{},[],{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},
   {sessionId:c.id,index:99},{sessionId:c.id,index:NaN},{sessionId:'__proto__',index:0}])assert.equal(fracDecomposeBinding(t,context),null);
  for(const patch of [{n:t.n+1},{d:t.d+1},{prompt:t.prompt+' '},{count:99},{extra:true}]){
   assert.equal(fracDecomposeBinding({...t,...patch},c),null);
   assert.equal(replayFracDecomposeEvidence({...t,...patch},build(c)),null);
  }
  const extra={...t,extra:true};assert.equal(replayFracDecomposeEvidence(extra,build(c)),null);
 }
});

for(const c of cases)test(`${c.id}:${c.index} verifies visible cuts and each exact saved group quantity`,()=>{
 const m=build(c),p=proof(c,m);
 assert.equal(p.currentDraft.savedSnapshotMatches,true);assert.equal(p.currentDraft.unsaved,false);
 assert.equal(p.currentDraft.mathematicalMatch,true);assert.equal(p.failedRequests.length,0);
 assert.equal(p.firstAttempt.accepted,true);assert.deepEqual(p.firstAttempt,p.currentRoundFirstAttempt);
 assert.ok(thinkingFeedback(taskFor(c),m,record(m),c));
});

const partitions=(n,minimum=1)=>{
 const out=[];for(let first=minimum;first<=n;first++){
  if(first===n)out.push([first]);else for(const tail of partitions(n-first,first))out.push([first,...tail]);
 }return out;
};
test('all 304 unordered multipart partitions can be saved, and reversing each never adds a distinct solution',()=>{
 for(const c of cases){
  const t=taskFor(c),sets=partitions(t.n).filter(p=>p.length>1);assert.equal(sets.length,c.expected.distinctPartitions);
  for(const parts of sets){
   const m=M.initial(t);save(c,m,parts);assert.equal(m.board.saved.length,1);assert.equal(m.issue,'');
   finish(c,m);let p=proof(c,m);assert.equal(p.savedDecompositions[0].canonicalKey,key(parts));metrics.canonicalPartitions++;
   const before=cp(m.board.saved);save(c,m,[...parts].reverse());
   assert.deepEqual(m.board.saved,before);assert.match(m.issue,/同一组拆法/);p=proof(c,m);
   assert.equal(p.events.at(-1).failureReason,'duplicate');assert.equal(p.currentDraft.canSaveAsNew,false);metrics.duplicatePartitions++;
  }
 }
 assert.equal(metrics.canonicalPartitions,304);assert.equal(metrics.duplicatePartitions,304);
});

test('all fifteen pairs of the six 5/6 partitions satisfy the two-distinct-forms goal',()=>{
 const c=cases[1],t=taskFor(c),sets=partitions(5).filter(p=>p.length>1);let pairs=0;
 for(let a=0;a<sets.length;a++)for(let b=a+1;b<sets.length;b++){
  const m=M.initial(t);save(c,m,sets[a]);assert.equal(M.inspect(t,m).correct,false);rejected(c,m);
  save(c,m,sets[b]);const p=proof(c,m);assert.equal(p.savedDecompositions.length,2);pairs++;metrics.minimalGoalSets++;
 }
 assert.equal(pairs,15);for(const c of [cases[0],cases[2]]){proof(c,build(c));metrics.minimalGoalSets++;}
 assert.equal(metrics.minimalGoalSets,17);
});

test('17/8 permits extra legal decompositions but requires two whole groups and one eighth',()=>{
 const c=cases[2],t=taskFor(c),m=M.initial(t);save(c,m,[9,8],'17/8=9/8+1');
 assert.equal(m.board.saved.length,1);assert.equal(M.inspect(t,m).correct,false);rejected(c,m);
 save(c,m,[8,8,1],'17/8=1+1+1/8');let p=proof(c,m);assert.deepEqual(p.goal.matchedSavedIndices,[1]);
 for(const parts of [[8,1,8],[1,8,8]]){
  save(c,m,parts);p=proof(c,m);assert.equal(p.savedDecompositions.length,2);assert.equal(p.events.at(-1).failureReason,'duplicate');
 }
 draft(c,m,[8,8,1],'17/8=2 1/8');act(t,m,'save');p=proof(c,m);
 assert.equal(p.currentDraft.equation.matchesTotal,true);assert.equal(p.currentDraft.equation.matchesGroups,false);
 assert.equal(p.events.at(-1).failureReason,'equation-mismatch');
});

test('the first save can fail before any cut and remains first after correction and reset',()=>{
 for(const c of cases){
  const t=taskFor(c),m=M.initial(t);fill(t,m,'wrong');act(t,m,'save');const first=cp(m.board.first);
  assert.equal(M.inspect(t,m).correct,false);finish(c,m);let p=proof(c,m);
  assert.equal(p.firstAttempt.accepted,false);assert.equal(p.firstAttempt.failureReason,'not-split');
  assert.deepEqual(p.firstAttempt.decomposition.parts,[t.n]);assert.equal(p.firstAttempt.fields.equation,'wrong');
  const preserved=JSON.stringify(m.history);act(t,m,'reset');assert.equal(m.equation,p.currentDraft.equation.raw);
  assert.deepEqual(m.board.first,first);assert.equal(m.board.saved.length,0);assert.equal(M.inspect(t,m).correct,false);
  assert.equal(JSON.stringify(m.history.slice(0,-1)),preserved);fill(t,m,'new error');act(t,m,'save');finish(c,m);p=proof(c,m);
  assert.equal(p.resets.length,1);assert.equal(p.firstAttempt.fields.equation,'wrong');
  assert.equal(p.currentRoundFirstAttempt.fields.equation,'new error');assert.equal(p.currentRoundFirstAttempt.accepted,false);
  assert.ok(p.currentRoundFirstAttempt.historyIndex>p.firstAttempt.historyIndex);
 }
});

test('accepted notation retains B16 left-side and B17 right-side grammar with independent exact sums',()=>{
 const c=cases[0],t=taskFor(c);
 for(const raw of ['3/8=1/8+1/4','0.375=0.125+0.25','+0.375=12.5%+25%',
  '6/16=2/16+4/16',' 3/8 = 25% + 1/8 ','3/8=1/4+1/8']){
  const m=M.initial(t);save(c,m,[1,2],raw);assert.equal(m.issue,'',raw);finish(c,m);
  const p=proof(c,m),eq=p.savedDecompositions[0].equation;assert.equal(eq.raw,raw);assert.deepEqual(eq.sum,[3,8]);
  assert.equal(eq.leftMatchesTotal,true);assert.equal(eq.matchesGroups,true);
 }
});

test('same total alone, wrong term counts and source-rejected notation remain failed saves before correction',()=>{
 const c=cases[0],t=taskFor(c);
 const wrong=['3/8=1/16+5/16','3/8=1/8+1/8+1/8','3/8=3/8','3/8=0/8+3/8',
  '3/8=-1/8+1/2','1/2=1/8+1/4','37.5%=12.5%+25%',
  '.375=0.125+0.25','3/8=.125+0.25','3/8=1e-1+0.275','3/8=0x1+0.25',
  '3/8=+0.125+0.25','3/8=1/8+1/4=3/8','3/8=1/8+','3/8=1/0+1/4'];
 for(const raw of wrong){
  const m=M.initial(t);save(c,m,[1,2],raw);assert.equal(m.board.saved.length,0,raw);assert.match(m.issue,/每组有几小份/,raw);
  finish(c,m);const p=proof(c,m);assert.equal(p.firstAttempt.fields.equation,raw);assert.equal(p.firstAttempt.accepted,false);
  assert.equal(p.firstAttempt.failureReason,'equation-mismatch');
 }
});

test('a huge erroneous sum is preserved exactly rather than rounded or deleting its later correction',()=>{
 const c=cases[0],t=taskFor(c),m=M.initial(t),a=999999999999n,b=99999989n,d=99999931n;
 save(c,m,[1,2],`3/8=${a}/${b}+${a}/${d}`);assert.equal(m.board.saved.length,0);finish(c,m);
 const p=proof(c,m),e=p.firstAttempt.decomposition.equation,g=gcd(a*d+a*b,b*d);
 assert.equal(e.sum,null);assert.deepEqual(e.sumExact,[String((a*d+a*b)/g),String(b*d/g)]);
 assert.equal(p.firstAttempt.accepted,false);assert.equal(e.matchesTotal,false);
});

test('saved goals survive a wrong current draft, but stale feedback expires until the full new snapshot is checked',()=>{
 for(const c of cases){
  const t=taskFor(c),m=build(c),r=record(m),saved=cp(m.board.saved);assert.ok(thinkingFeedback(t,m,r,c));
  fill(t,m,'this draft is wrong');assert.equal(M.inspect(t,m).correct,true);let p=proof(c,m);
  assert.equal(p.currentDraft.unsaved,true);assert.equal(p.currentDraft.equationStatus,'invalid-syntax');
  assert.equal(thinkingFeedback(t,m,r,c),null);assert.equal(latestSubmissionMatches(m,r),false);
  act(t,m,'save');assert.deepEqual(m.board.saved,saved);assert.equal(M.inspect(t,m).correct,true);p=proof(c,m);
  assert.equal(p.events.at(-1).accepted,false);assert.match(p.issue,/每组有几小份/);
  r.attempts.push({value:cp(m)});const f=thinkingFeedback(t,m,r,c);assert.ok(f);
  assert.match(f.observation,/已经保存/);assert.match(f.observation,/当前草稿.*还没有.*对上/);
  assert.ok(f.detail.some(x=>x.includes('最后一次保存未成功')));assert.equal(f.method,null);
 }
});

test('new-groups clears only cuts and never turns the preserved equation into a saved unsplit solution',()=>{
 const c=cases[0],t=taskFor(c),m=build(c),saved=cp(m.board.saved),first=cp(m.board.first),equation=m.equation;
 act(t,m,'new-groups');assert.deepEqual(m.board.cuts,[]);assert.deepEqual(m.board.saved,saved);assert.deepEqual(m.board.first,first);
 assert.equal(m.equation,equation);let p=proof(c,m);assert.equal(p.currentDraft.isSplit,false);assert.equal(p.currentDraft.unsaved,true);
 assert.match(thinkingFeedback(t,m,record(m),c).observation,/当前草稿还没有拆成两组/);
 act(t,m,'save');p=proof(c,m);assert.equal(p.events.at(-1).failureReason,'not-split');
 act(t,m,'new-groups');p=proof(c,m);assert.equal(p.issue,'');assert.equal(p.events.at(-1).constructionChanged,false);
 assert.equal(p.events.at(-1).accepted,true);assert.equal(p.failedRequests.length,1);
});

test('equivalent notation, reversed groups and a new valid draft are described without inventing a save',()=>{
 const c=cases[1],t=taskFor(c),m=build(c),count=m.board.saved.length;
 draft(c,m,[3,2],'5/6=2/6+3/6');let p=proof(c,m);assert.equal(p.currentDraft.mathematicalMatch,true);
 assert.equal(p.currentDraft.savedSnapshotMatches,false);assert.equal(p.currentDraft.sameDecompositionSavedIndices.length,1);
 assert.match(thinkingFeedback(t,m,record(m),c).observation,/顺序或写法变化/);
 act(t,m,'save');p=proof(c,m);assert.equal(p.savedDecompositions.length,count);assert.equal(p.events.at(-1).failureReason,'duplicate');
 draft(c,m,[1,1,3]);p=proof(c,m);assert.equal(p.currentDraft.canSaveAsNew,true);
 assert.match(thinkingFeedback(t,m,record(m),c).observation,/还没有保存成新的作品/);
 act(t,m,'save');p=proof(c,m);assert.equal(p.savedDecompositions.length,count+1);assert.equal(p.currentDraft.savedSnapshotMatches,true);
});

test('cut identity, toggle order and actual joins remain in history while groups use sorted cut positions',()=>{
 const c=cases[2],t=taskFor(c),m=M.initial(t);act(t,m,'cut',{index:16});act(t,m,'cut',{index:8});
 act(t,m,'cut',{index:8});act(t,m,'cut',{index:8});fill(t,m,'17/8=1+1+1/8');act(t,m,'save');
 const p=proof(c,m);assert.deepEqual(p.events.filter(e=>e.action==='cut').map(e=>[e.index,e.change]),[[16,'split'],[8,'split'],[8,'join'],[8,'split']]);
 assert.deepEqual(p.savedDecompositions[0].cuts,[8,16]);assert.deepEqual(p.savedDecompositions[0].parts,[8,8,1]);
});

test('noncanonical and out-of-range cut events cannot become visible-operation evidence',()=>{
 const c=cases[0],t=taskFor(c);
 for(const index of ['0x1','1e0','01','+1',' 1','1.0','',0,-1,3,99]){
  const m=M.initial(t);rawAct(t,m,'cut',{index});finish(c,m);originalOnly(c,m,'cut '+JSON.stringify(index));
 }
 const m=M.initial(t);rawAct(t,m,'new-groups',{index:1});finish(c,m);originalOnly(c,m,'extraneous action payload');
});

test('hidden fields and unrelated B18 actions do not inherit strict evidence from the saved goal',()=>{
 const c=cases[0],t=taskFor(c);
 for(const field of FIELDS.filter(f=>f!=='equation')){
  const m=M.initial(t);m[field]='unseen';finish(c,m);originalOnly(c,m,'hidden historical '+field);
  const current=build(c);current[field]='unseen';originalOnly(c,current,'hidden current '+field);
 }
 for(const action of ['start','split','merge','all-pieces','take-whole','take-part','person','give','piece','commit','normalize']){
  const m=M.initial(t);rawAct(t,m,action);finish(c,m);originalOnly(c,m,'unrelated '+action);
 }
 const restored=build(c);restored.answer='unseen';rawAct(t,restored,'new-groups');restored.answer='';
 originalOnly(c,restored,'transient hidden field restored later');
});

test('tampered saved equations, first attempts, current issue and event shapes are refused',()=>{
 const c=cases[0],good=build(c);
 for(const mutate of [m=>m.extra=true,m=>m.board.extra=true,m=>m.board.saved[0].equation='invented',
  m=>m.board.saved[0].parts=[3],m=>m.board.first.equation='invented',m=>m.board.cuts=[2],
  m=>m.issue='invented issue',m=>m.history[0].extra=true,m=>m.history[0].f.extra='',
  m=>m.history[0].f.equation=1,m=>m.history[1].d.extra='1',m=>m.history[1].a='unknown',
  m=>m.history.splice(m.history.findIndex(e=>e.a==='save'),1),m=>m.history.reverse()]){
  const changed=cp(good);mutate(changed);rejected(c,changed,'fabricated evidence');
 }
 for(const m of [null,{},[],true,{...good,history:null},{...good,history:[null]},
  {...good,board:null},{...good,equation:0},{...good,history:[{a:'save',d:null,f:{}}]}])assert.doesNotThrow(()=>rejected(c,m));
});

test('1000-character fields and 1200 original recorded events remain exact without claiming later clicks',()=>{
 const c=cases[2],t=taskFor(c),m=M.initial(t),raw='17/8=1+1+1/8';
 save(c,m,[8,8,1],' '.repeat(1000-raw.length)+raw);assert.equal(m.equation.length,1000);proof(c,m);
 const tooLong=cp(m);tooLong.equation+=' ';assert.equal(M.valid(t,tooLong),false);rejected(c,tooLong);
 const full=M.initial(t);for(let i=0;i<1196;i++)act(t,full,'reset');
 act(t,full,'cut',{index:8});act(t,full,'cut',{index:16});fill(t,full,raw);act(t,full,'save');act(t,full,'new-groups');
 assert.equal(full.history.length,1200);let p=proof(c,full);assert.equal(p.resets.length,1196);assert.equal(p.currentDraft.isSplit,false);
 const before=JSON.stringify(full);act(t,full,'reset');assert.equal(JSON.stringify(full),before);
 assert.equal(p.assessmentLimits.allLaterClicksRecorded,false);fill(t,full,'later visible draft');p=proof(c,full);
 assert.equal(p.currentDraft.equation.raw,'later visible draft');assert.equal(p.eventCount,1200);
 const overflow=cp(full);overflow.history.push(cp(full.history[0]));assert.equal(M.valid(t,overflow),false);rejected(c,overflow);
});

test('associated and practice tasks keep their original mathematics and receive no native guide or feedback',()=>{
 for(const c of [...bridges,...practices]){
  const t=taskFor(c),m=build(c);proof(c,m);assert.equal(fracDecomposeBinding(t,c),null);
  assert.equal(thinkingGuide(t,c),null);assert.equal(thinkingFeedback(t,m,record(m),c),null);
 }
});

for(const c of cases)test(`${c.id}:${c.index} preserves failed first save, five actual submissions, current draft and complete v2 state`,()=>{
 const t=taskFor(c),lesson=State.freshLesson(c.id);lesson.index=c.index;lesson.models[c.index]=M.initial(t);
 const m=lesson.models[c.index];fill(t,m,'wrong first');act(t,m,'save');assert.equal(State.submitLesson(lesson).correct,false);
 const first=JSON.stringify(lesson.cases[c.index].attempts[0]);State.supportLesson(lesson);finish(c,m);
 assert.equal(State.submitLesson(lesson).correct,true);assert.ok(thinkingFeedback(t,m,lesson.cases[c.index],c));
 fill(t,m,'wrong current draft');assert.equal(State.currentSubmission(lesson).status,'modified');
 assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);act(t,m,'save');
 assert.equal(State.submitLesson(lesson).correct,true,'original grader evaluates saved goal, not the newer wrong draft');
 assert.match(thinkingFeedback(t,m,lesson.cases[c.index],c).observation,/当前草稿.*还没有/);
 act(t,m,'reset');assert.equal(State.submitLesson(lesson).correct,false);finish(c,m);assert.equal(State.submitLesson(lesson).correct,true);
 assert.equal(JSON.stringify(lesson.cases[c.index].attempts[0]),first);
 assert.deepEqual(lesson.cases[c.index].attempts.map(a=>M.inspect(t,a.value).correct),[false,true,true,false,true]);
 assert.equal(lesson.cases[c.index].attempts[0].supported,false);assert.equal(lesson.cases[c.index].attempts[0].exposed,false);
 assert.ok(lesson.cases[c.index].attempts.slice(1).every(a=>a.supported&&a.exposed));
 assert.equal(State.lessonSummary(lesson).cases[c.index].independent,false);const p=proof(c,m);
 assert.equal(p.firstAttempt.fields.equation,'wrong first');assert.equal(p.resets.length,1);
 State.addLessonNote(lesson,'我保留原来的错误，再核对每一组。');lesson.draft='未提交的说明';
 const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url))),state=Core.fresh();
 state.lessons[c.id]=lesson;state.lessonContinuation=c.id;state.visited[c.nodeId]='2026-11-15T00:00:00.000Z';
 state.bookmarks=[c.nodeId];state.openedPacks[atlas.packs[0].id]='2026-11-15T00:00:00.000Z';
 const before=JSON.stringify(state),restored=Core.parseBackup(JSON.stringify(Core.backup(state)),atlas);
 assert.deepEqual(restored,state);assert.equal(JSON.stringify(state),before);
 assert.deepEqual(Core.merge(Core.fresh(),restored),restored);assert.deepEqual(Core.merge(restored,restored),restored);
 assert.deepEqual(replayFracDecomposeEvidence(t,restored.lessons[c.id].models[c.index]),p);
});

test('full-snapshot gating retains existing equality semantics and feedback limits for tool-generated diagrams',()=>{
 const c=cases[0],t=taskFor(c),m=build(c),r=record(m);fill(t,m,'0.375=0.125+0.25');proof(c,m);
 assert.equal(thinkingFeedback(t,m,r,c),null);r.attempts.push({value:cp(m)});const f=thinkingFeedback(t,m,r,c);assert.ok(f);
 assert.match(JSON.stringify(f),/工具/);assert.match(JSON.stringify(f),/第一次保存请求/);
 assert.match(JSON.stringify(f),/独立作图.*自由解释.*长期掌握/);assert.equal(f.method,null);
 assert.equal(latestSubmissionMatches(cp(m),r),true,'no new retry epoch is invented');
 for(const bad of [null,{}, {attempts:[]},{attempts:[{value:null}]},{attempts:[{value:cp(m)},{}]}])
  assert.equal(thinkingFeedback(t,m,bad,c),null);
});

after(()=>console.log('FRACDECOMPOSE_INDEPENDENT_PROBES '+JSON.stringify(metrics)));
