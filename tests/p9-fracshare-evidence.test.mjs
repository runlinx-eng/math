import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-fracshare-cases.cjs';
import * as M from '../dist/learning/phase5/b18-model.js';
import * as V from '../dist/learning/phase5/b18-view.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {PRACTICE} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {fracShareBinding,replayFracShareEvidence} from '../dist/learning/fracshare-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {freshLesson,modelForLesson,submitLesson,supportLesson,currentSubmission,validateLesson,addLessonNote} from '../dist/learning/state.js';
import {fresh,backup,parseBackup} from '../dist/exploration-core.js';

// Independent source fixtures and elementary integer arithmetic are the oracle.
// Neither original.solveSteps/example nor the new production fixture solver is
// used to construct expected results. Renderer checks below are Node checks,
// not claims that Chromium or children have completed these operations.
await ensureB39Ready();
const {cases,bridges,practices,sourceHashes}=fixture;
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const cp=value=>structuredClone(value);
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>createHash('sha256').update(value).digest('hex');
const hash=value=>digest(JSON.stringify(stable(value)));
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const fraction=(n,d=1)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n,d);return[Number(n/g),Number(d/g)];};
const share=t=>fraction(t.n,BigInt(t.d)*BigInt(t.people));
const text=r=>r[1]===1?String(r[0]):r.join('/');
const equal=(a,b)=>BigInt(a[0])*BigInt(b[1])===BigInt(b[0])*BigInt(a[1]);
const legalFactors=t=>Array.from({length:40},(_,i)=>i+1).filter(k=>BigInt(t.d)*BigInt(k)<=120n&&BigInt(t.n)*BigInt(k)%BigInt(t.people)===0n);
const taskAt=c=>sessionTaskFor(c.id,c.index);
const fieldKeys=Object.keys(M.fields);
const metrics={models:0,visibleFields:0,visibleButtons:0,legalFactorPaths:0};
function field(t,m,key,value){
 const html=V.render(t,m),tags=html.match(/<(?:input|textarea|select)\b[^>]*>/g)||[];
 const found=tags.filter(tag=>tag.includes('data-xfield="'+key+'"'));
 assert.equal(found.length,1,'exactly one visible input '+key);
 assert.doesNotMatch(found[0],/\bdisabled\b/);
 const limit=found[0].match(/\bmaxlength="(\d+)"/);
 if(limit)assert.ok(String(value).length<=Number(limit[1]),key+' respects the actual input limit');
 m[key]=String(value);M.field(t,m,key);metrics.visibleFields++;
}
function click(t,m,action,index){
 const tags=V.render(t,m).match(/<button\b[^>]*>/g)||[];
 const found=tags.filter(tag=>tag.includes('data-x="b18-'+action+'"')&&
  (index===undefined?!/\bdata-index=/.test(tag):tag.includes('data-index="'+String(index)+'"')));
 assert.equal(found.length,1,'exactly one visible '+action+' '+String(index));
 assert.doesNotMatch(found[0],/\bdisabled\b/);
 const old=cp(m.history),length=old.length;
 M.act(t,m,'b18-'+action,index===undefined?{}:{index:String(index)});
 assert.deepEqual(m.history.slice(0,length),old,'actions preserve the prior history');
 assert.equal(m.history.length,Math.min(1200,length+1));
 metrics.visibleButtons++;return m.history.length>length;
}
function start(t,m,guess=text(share(t))){
 field(t,m,'guess',guess);
 if(t.story)field(t,m,'story',m.story||'这段故事原文保存，含义不由工具评分。');
 click(t,m,'start');return m;
}
function cut(t,m,k=t.people){field(t,m,'factor',k);click(t,m,'cut');return m;}
function distribute(t,m,{reverse=false,offset=0}={}){
 const ids=Array.from({length:m.board.owners.length},(_,i)=>i);if(reverse)ids.reverse();
 for(const id of ids){
  const owner=(id+offset)%t.people;
  click(t,m,'person',owner);
  // Giving a piece already held by the selected person withdraws it.
  if(m.board.owners[id]!==owner)click(t,m,'give',id);
 }
 return m;
}
function written(t,m,{answer=text(share(t)),equation=text(share(t))+'×'+t.people+'='+text(fraction(t.n,t.d)),story}={}){
 field(t,m,'answer',answer);field(t,m,'equation',equation);
 if(t.story&&story!==undefined)field(t,m,'story',story);
 return m;
}
function finish(t,m,{guess=text(share(t)),factor=t.people,reverse=false,offset=0,...options}={}){
 if(!m.board.started)start(t,m,guess);
 cut(t,m,factor);distribute(t,m,{reverse,offset});written(t,m,options);return m;
}
const build=(t,options={})=>finish(t,M.initial(t),options);
function accepted(t,m){
 assert.equal(M.valid(t,m),true,'original stored model remains valid');
 assert.equal(M.inspect(t,m).correct,true,'original mathematical grading agrees');
 const saved=JSON.stringify(m),p=replayFracShareEvidence(t,m);
 assert.ok(p,'independent evidence replay accepts this current construction');
 assert.equal(JSON.stringify(m),saved,'evidence never changes the workpiece');
 metrics.models++;
 assert.deepEqual(p.originalQuantity,fraction(t.n,t.d));assert.deepEqual(p.referenceWhole,[1,1]);
 assert.deepEqual(p.result,share(t));assert.equal(p.people,t.people);assert.equal(p.unit,t.unit||'');
 assert.equal(p.factor,m.board.factor);assert.equal(p.factorInput.raw,m.factor);
 assert.equal(p.factorInput.normalized,Number(m.factor));assert.equal(p.factorInput.toolNormalized,true);
 assert.equal(p.wholeParts,t.d*m.board.factor);assert.equal(p.totalPieces,t.n*m.board.factor);
 assert.deepEqual(p.pieceValue,fraction(1,t.d*m.board.factor));assert.deepEqual(p.owners,m.board.owners);
 assert.equal(p.selectedRecipient,m.board.selected);
 assert.equal(p.recipients.length,t.people);
 const all=[];
 for(const recipient of p.recipients){
  const ids=m.board.owners.flatMap((owner,index)=>owner===recipient.person?[index]:[]);
  assert.deepEqual(recipient.pieceIds,ids);assert.equal(recipient.count,ids.length);
  assert.equal(ids.length*t.people,t.n*m.board.factor);
  assert.deepEqual(recipient.amount,fraction(ids.length,t.d*m.board.factor));
  assert.ok(equal(recipient.amount,share(t)));all.push(...ids);
 }
 assert.deepEqual(all.sort((a,b)=>a-b),Array.from({length:t.n*m.board.factor},(_,i)=>i));
 assert.deepEqual(p.answer.value,share(t));assert.equal(p.answer.raw,m.answer);assert.equal(p.answer.submissionOnly,true);
 assert.equal(p.inverse.raw,m.equation);assert.equal(p.inverse.submissionOnly,true);
 assert.deepEqual(p.inverse.product,fraction(t.n,t.d));assert.deepEqual(p.inverse.total.value,fraction(t.n,t.d));
 assert.deepEqual(p.inverse.factors.map(x=>x.role).sort(),['people','per-person']);
 assert.equal(p.firstGuess.raw,m.board.first);assert.equal(p.eventCount,m.history.length);
 assert.equal(p.events.length,m.history.length);assert.equal(p.issue,m.issue);
 assert.deepEqual(p.events.map(e=>e.historyIndex),m.history.map((_,i)=>i));
 for(const e of p.events)assert.deepEqual(e.fields,Object.fromEntries(['guess','factor','answer','equation','story'].map(k=>[k,m.history[e.historyIndex].f[k]])));
 assert.deepEqual(p.failedRequests,p.events.filter(e=>!e.accepted));
 assert.deepEqual(p.resets,p.events.filter(e=>e.action==='reset'));
 assert.deepEqual(p.cutRequests,p.events.filter(e=>e.action==='cut'));
 assert.deepEqual(p.assignments,p.events.filter(e=>e.action==='give'));
 assert.deepEqual(p.recipientSelections,p.events.filter(e=>e.action==='person'));
 assert.equal(p.story.required,!!t.story);assert.equal(p.story.raw,m.story);
 assert.equal(p.story.meaningAssessed,false);assert.equal(p.story.authorshipAssessed,false);
 assert.equal(p.assessmentLimits.generalMasteryAssessed,false);assert.equal(p.assessmentLimits.method,null);
 assert.equal(p.assessmentLimits.exactKeystrokeOrderKnown,false);assert.equal(p.assessmentLimits.recordingLimit,1200);
 assert.equal(p.systemGenerated.referenceWholeBar,true);assert.equal(p.systemGenerated.equalSubdivision,true);
 return p;
}
function rejected(t,m,label){
 const saved=JSON.stringify(m);assert.equal(replayFracShareEvidence(t,m),null,label);
 assert.equal(JSON.stringify(m),saved,'rejection preserves the original record');
}
const record=m=>({support:false,attempts:[{value:cp(m)}]});

test('pinned five native, seven associated and two practice positions preserve complete source fingerprints',()=>{
 assert.equal(cases.length,5);assert.equal(bridges.length,7);assert.equal(practices.length,2);
 assert.equal(new Set(cases.map(c=>c.nodeId)).size,2);assert.equal(fieldKeys.length,22);
 assert.equal(Object.keys(sourceHashes).length,5);
 for(const [path,expected]of Object.entries(sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+path,import.meta.url))),expected,path);
 const native=[],associated=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{if(t.type==='x-fracshare')native.push(id+':'+index);});
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{if(t.type==='x-fracshare')associated.push(id+':'+index);});
 assert.deepEqual(native.sort(),cases.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(associated.sort(),bridges.map(c=>c.id+':'+c.index).sort());
 for(const c of cases){
  const t=taskAt(c);assert.equal(hash(t),c.taskHash);assert.deepEqual(t,c.task);
  assert.equal(LESSONS[c.id].topicId,c.nodeId);assert.deepEqual(share(t),c.expected.perPerson);
  assert.deepEqual(fraction(t.n,t.d),c.expected.original);assert.deepEqual(legalFactors(t),c.expected.legalFactors);
  const binding=fracShareBinding(t,c);assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);
 }
 for(const c of [...bridges,...practices]){assert.equal(hash(taskAt(c)),c.taskHash);assert.deepEqual(taskAt(c),c.task);}
 assert.equal(cases.reduce((n,c)=>n+legalFactors(taskAt(c)).length,0),59);
 assert.deepEqual(practices.map(c=>c.id).sort(),Object.keys(PRACTICE).filter(id=>PRACTICE[id]?.type==='x-fracshare').sort());
});

for(const c of cases){
 const label=c.id+':'+c.index;
 test(label+' accepts every independently enumerated equal-share subdivision and reachable piece order',()=>{
  const t=taskAt(c);
  for(const [i,k]of legalFactors(t).entries()){
   const m=build(t,{factor:k,reverse:i%2===1,offset:i%t.people}),p=accepted(t,m);metrics.legalFactorPaths++;
   assert.equal(p.factor,k);assert.equal(p.firstGuess.matchesResult,true);assert.equal(p.currentGuess.matchesResult,true);
   assert.equal(p.cutRequests.length,1);assert.equal(p.cutRequests[0].accepted,true);
   assert.equal(p.totalPieces/t.people,t.n*k/t.people);assert.deepEqual(p.result,c.expected.perPerson);
  }
 });
 test(label+' rejects unassigned and unequal pieces, and preserves direct corrections and withdrawals',()=>{
  const t=taskAt(c),m=M.initial(t);start(t,m,'999');cut(t,m);written(t,m);
  assert.equal(M.inspect(t,m).correct,false);rejected(t,m);
  const firstGive=m.history.length;for(let i=0;i<m.board.owners.length;i++)click(t,m,'give',i);
  assert.equal(M.inspect(t,m).correct,false);rejected(t,m);
  const before=cp(m.history);distribute(t,m);const p=accepted(t,m);
  assert.deepEqual(m.history.slice(0,before.length),before);assert.equal(p.firstGuess.matchesResult,false);
  assert.equal(p.assignments[0].historyIndex,firstGive);assert.equal(p.assignments[0].recipientSelectionOrigin,'tool-default');
  assert.equal(p.assignments[0].recipientSelectionHistoryIndex,null);
  assert.ok(p.assignments.some(e=>e.change==='transfer'));
  const person=m.board.owners[0];click(t,m,'person',person);click(t,m,'give',0);rejected(t,m);
  assert.equal(m.board.owners[0],-1);click(t,m,'give',0);accepted(t,m);
 });
 test(label+' keeps failed recuts and restores the old construction by correcting only visible factor text',()=>{
  const t=taskAt(c),m=build(t),initial=cp(m.board),cutIndex=accepted(t,m).currentCutHistoryIndex;
  const bad=[...Array.from({length:43},(_,i)=>i).filter(k=>!legalFactors(t).includes(k)),-1,'1.5','','NaN','Infinity'];
  for(const k of bad){
   field(t,m,'factor',k);click(t,m,'cut');assert.deepEqual(m.board,initial);assert.ok(m.issue.length);
   rejected(t,m);const length=m.history.length;field(t,m,'factor',t.people);
   const p=accepted(t,m);assert.equal(m.history.length,length);assert.equal(p.currentCutHistoryIndex,cutIndex);
   assert.equal(p.issue,m.issue);const e=p.failedRequests.at(-1);assert.equal(e.action,'cut');
   assert.deepEqual(e.before,e.after);assert.equal(e.constructionChanged,false);
  }
  assert.equal(accepted(t,m).failedRequests.length,bad.length);
 });
 test(label+' preserves wrong-correct-wrong-correct-redone attempts, current snapshot, support and complete v2 backup',()=>{
  const t=taskAt(c),lesson=freshLesson(c.id);lesson.index=c.index;
  let m=modelForLesson(lesson);finish(t,m,{guess:'999',answer:'2/99'});
  assert.equal(submitLesson(lesson).correct,false);assert.equal(currentSubmission(lesson).status,'revise');
  const first=cp(lesson.cases[c.index].attempts[0]);rejected(t,m);
  written(t,m);assert.equal(currentSubmission(lesson).status,'modified');
  assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);
  assert.equal(submitLesson(lesson).correct,true);assert.ok(thinkingFeedback(t,m,lesson.cases[c.index],c));
  supportLesson(lesson);const previous=cp(lesson.cases[c.index].attempts);
  m=build(t,{guess:'0',reverse:true,answer:'3/99'});lesson.models[c.index]=m;
  assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);assert.equal(submitLesson(lesson).correct,false);
  written(t,m);assert.equal(submitLesson(lesson).correct,true);accepted(t,m);
  const fieldsBefore=Object.fromEntries(fieldKeys.map(k=>[k,m[k]])),historyBefore=cp(m.history),firstGuess=m.board.first;
  click(t,m,'reset');assert.equal(m.board.first,firstGuess);
  assert.deepEqual(Object.fromEntries(fieldKeys.map(k=>[k,m[k]])),fieldsBefore);
  assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);
  finish(t,m,{guess:'-1',factor:t.people*2});assert.deepEqual(m.history.slice(0,historyBefore.length),historyBefore);
  assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);
  assert.equal(submitLesson(lesson).correct,true);const p=accepted(t,m);
  assert.equal(p.firstGuess.raw,'0');assert.equal(p.currentGuess.raw,'-1');assert.equal(p.resets.length,1);
  assert.equal(lesson.cases[c.index].attempts.length,5);
  assert.deepEqual(lesson.cases[c.index].attempts[0],first);
  assert.deepEqual(lesson.cases[c.index].attempts.slice(0,previous.length),previous);
  assert.deepEqual(lesson.cases[c.index].attempts.map(a=>M.inspect(t,a.value).correct),[false,true,false,true,true]);
  assert.deepEqual(lesson.cases[c.index].attempts.map(a=>a.supported),[false,false,true,true,true]);
  addLessonNote(lesson,'首猜和失败保留；这段说明没有被自动评定。');
  assert.deepEqual(validateLesson(lesson,c.id),lesson);
  const old=freshLesson('share');modelForLesson(old);addLessonNote(old,'原有未完成记录');
  const state=fresh();state.lessons[c.id]=cp(lesson);state.lessons.share=cp(old);
  state.lessonContinuation=c.id;
  const saved=JSON.stringify(state),restored=parseBackup(JSON.stringify(backup(state)),atlas);
  assert.equal(JSON.stringify(state),saved);assert.deepEqual(restored,state);
  assert.deepEqual(restored.lessons.share,old);
  assert.ok(thinkingFeedback(t,restored.lessons[c.id].models[c.index],restored.lessons[c.id].cases[c.index],c));
 });
}

test('recipient selection, repeated no-effect choice, assignment, withdrawal and direct transfer retain real identities',()=>{
 const t=taskAt(cases[0]),m=M.initial(t);start(t,m,'0');cut(t,m,8);
 click(t,m,'person',0);click(t,m,'person',0);click(t,m,'give',0);click(t,m,'give',0);click(t,m,'give',0);
 click(t,m,'person',1);click(t,m,'give',0);distribute(t,m,{offset:1});written(t,m);
 const p=accepted(t,m);assert.equal(p.recipientSelections[1].constructionChanged,false);
 assert.deepEqual(p.assignments.slice(0,4).map(e=>[e.fromOwner,e.toOwner,e.change]),[[-1,0,'assign'],[0,-1,'withdraw'],[-1,0,'assign'],[0,1,'transfer']]);
 assert.equal(p.assignments[3].recipientSelectionOrigin,'recorded-person-selection');
 assert.equal(p.assignments[3].recipientSelectionHistoryIndex,p.recipientSelections[2].historyIndex);
});

test('successful recutting clears piece owners but retains the selected person, first guess, fields and older allocation',()=>{
 const t=taskAt(cases[0]),m=build(t,{guess:'9'}),before=cp(m.history),fields=Object.fromEntries(fieldKeys.map(k=>[k,m[k]]));
 click(t,m,'person',3);const oldOwners=cp(m.board.owners);cut(t,m,8);
 assert.equal(m.board.selected,3);assert.equal(m.board.first,'9');assert.deepEqual(m.board.owners,Array(8).fill(-1));
 for(const k of fieldKeys.filter(k=>k!=='factor'))assert.equal(m[k],fields[k]);
 distribute(t,m,{reverse:true});written(t,m);const p=accepted(t,m),cutEvent=p.cutRequests.at(-1);
 assert.deepEqual(m.history.slice(0,before.length),before);assert.deepEqual(cutEvent.discardedOwners,oldOwners);
 assert.ok(p.assignments.filter(e=>e.historyIndex>cutEvent.historyIndex).every(e=>e.cutHistoryIndex===cutEvent.historyIndex));
 assert.equal(p.currentCutHistoryIndex,cutEvent.historyIndex);assert.equal(p.firstGuess.raw,'9');
});

test('invalid visible starts are preserved without invented hints, while zero, negative and percentage guesses remain source-compatible',()=>{
 const t=taskAt(cases[0]),m=M.initial(t),invalid=['','not a number','.25','1e-2','0x4','1/0'];
 for(const raw of invalid){field(t,m,'guess',raw);click(t,m,'start');assert.equal(m.board.started,false);assert.equal(m.issue,'');}
 start(t,m,'25%');finish(t,m);const p=accepted(t,m);
 assert.equal(p.firstGuess.historyIndex,invalid.length);assert.deepEqual(p.firstGuess.value,[1,4]);assert.equal(p.firstGuess.matchesResult,false);
 assert.equal(p.failedRequests.length,invalid.length);
 assert.ok(p.failedRequests.every(e=>e.reason==='invalid-guess'&&e.issue===''&&e.constructionChanged===false));
 for(const [raw,value]of [['0',[0,1]],['-0 1/2',[-1,2]],['-25%',[-1,4]],['2 1/2',[5,2]],['1/12',[1,12]]]){
  const q=accepted(t,build(t,{guess:raw}));assert.deepEqual(q.firstGuess.value,value);assert.equal(q.firstGuess.matchesResult,equal(value,share(t)));
 }
});

test('reset preserves all visible and hidden inputs plus the first successful guess, while current-round evidence starts anew',()=>{
 const t=taskAt(cases[1]),m=build(t,{guess:'1'}),old=cp(m.history),saved=Object.fromEntries(fieldKeys.map(k=>[k,m[k]]));
 click(t,m,'reset');assert.deepEqual(Object.fromEntries(fieldKeys.map(k=>[k,m[k]])),saved);
 assert.equal(m.board.first,'1');finish(t,m,{guess:'1/18',factor:6,story:'第二轮保留自己的文字'});
 const p=accepted(t,m);assert.deepEqual(m.history.slice(0,old.length),old);
 assert.equal(p.firstGuess.historyIndex,0);assert.equal(p.firstGuess.raw,'1');assert.equal(p.firstGuess.matchesResult,false);
 assert.equal(p.currentGuess.raw,'1/18');assert.equal(p.currentGuess.matchesResult,true);
 assert.ok(p.currentGuess.historyIndex>p.resets[0].historyIndex);assert.ok(p.currentCutHistoryIndex>p.resets[0].historyIndex);
});

test('factor counts retain original Number normalization without claiming raw hexadecimal or exponential mathematical notation',()=>{
 for(const [c,raw]of [[cases[0],'0x4'],[cases[1],'3e0'],[cases[2],' +002 '],[cases[0],'4.0000000000000001']]){
  const t=taskAt(c),p=accepted(t,build(t,{factor:raw}));
  assert.equal(p.factorInput.raw,raw);assert.equal(p.factorInput.normalized,Number(raw));assert.equal(p.factorInput.toolNormalized,true);
 }
});

test('answer and inverse equation use independent exact amounts, original factor roles and submission-only semantics',()=>{
 const t=taskAt(cases[2]),m=build(t);const history=cp(m.history);
 for(const [answer,equation]of [['0.125','0.125×2=0.25'],['2/16','2·2/16=1/4'],['0 1/8','2/1*0 1/8=2/8']]){
  written(t,m,{answer,equation});const p=accepted(t,m);assert.equal(p.answer.submissionOnly,true);
  assert.equal(p.inverse.submissionOnly,true);assert.deepEqual(m.history,history);
 }
 for(const answer of ['.125','12.5%','1e-1','1 / 8','0x1']){written(t,m,{answer});rejected(t,m);}
 for(const equation of ['1/8+1/8=1/4','1/8*2*1=1/4','1/8*2=1/4=1/4','1/8*3=1/4','1/8*2=1/2','-1/8*-2=1/4','1/4*1=1/4']){
  written(t,m,{equation});assert.equal(M.inspect(t,m).correct,false);rejected(t,m);
 }
 written(t,m);accepted(t,m);
});

test('fraction and decimal limits are exact and long legal zero prefixes are neither rounded nor truncated',()=>{
 const t=taskAt(cases[2]),m=build(t);
 for(const answer of ['0.125000000','125000000/1000000000']){written(t,m,{answer});rejected(t,m);}
 written(t,m,{answer:'12500000/100000000',equation:'0.12500000*2=0.25000000'});accepted(t,m);
 written(t,m,{answer:'0'.repeat(997)+'1/8'});assert.equal(m.answer.length,1000);accepted(t,m);
 m.answer='0'.repeat(998)+'1/8';assert.equal(m.answer.length,1001);assert.equal(M.valid(t,m),false);rejected(t,m);
});

test('story text is saved without semantic or authorship scoring, and 801-character legacy records remain valid and restorable',()=>{
 const c=cases[1],t=taskAt(c),m=build(t);
 written(t,m,{story:''});assert.equal(M.inspect(t,m).correct,false);rejected(t,m);
 for(const story of ['这段内容没有解释分数数学。','字'.repeat(800)]){
  written(t,m,{story});const p=accepted(t,m);assert.equal(p.story.meaningAssessed,false);assert.equal(p.story.authorshipAssessed,false);
 }
 m.story='字'.repeat(801);assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejected(t,m);
 const lesson=freshLesson(c.id);lesson.index=c.index;lesson.models[c.index]=m;
 assert.equal(submitLesson(lesson).correct,true);const state=fresh();state.lessons[c.id]=lesson;
 assert.deepEqual(parseBackup(JSON.stringify(backup(state)),atlas),state);
 const old=M.initial(t);old.guess='0';old.story='字'.repeat(801);M.act(t,old,'b18-start');
 field(t,old,'story','现在输入仍可修正');finish(t,old);assert.equal(M.valid(t,old),true);
 assert.equal(M.inspect(t,old).correct,true);rejected(t,old,'hidden historical over-limit input is not silently upgraded');
});

test('hidden or unavailable source actions do not become strict evidence merely because later work is correct',()=>{
 const t=taskAt(cases[0]);
 for(const action of ['cut','person','give','commit','piece','save','new-groups','split','normalize']){
  const m=M.initial(t);M.act(t,m,'b18-'+action,['person','give','piece'].includes(action)?{index:'0'}:{});
  M.act(t,m,'b18-reset');finish(t,m);assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejected(t,m,action);
 }
 const m=M.initial(t);start(t,m,'0');M.act(t,m,'b18-person',{index:'0'});finish(t,m);rejected(t,m);
 const again=build(t);M.act(t,again,'b18-start');assert.equal(M.valid(t,again),true);rejected(t,again);
});

test('person and piece IDs must match actual canonical button indices, and data on non-index actions is rejected',()=>{
 const t=taskAt(cases[0]);
 for(const action of ['person','give'])for(const index of ['01','1.0','+1','1e0','0x1',' 1 ','-0','-1','4','NaN','Infinity']){
  const m=M.initial(t);start(t,m);cut(t,m);M.act(t,m,'b18-'+action,{index});M.act(t,m,'b18-reset');finish(t,m);
  assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejected(t,m,action+':'+index);
 }
 for(const action of ['reset','start','cut']){
  const m=M.initial(t);if(action==='cut')start(t,m);
  if(action==='start')m.guess='0';
  M.act(t,m,'b18-'+action,{index:'0'});M.act(t,m,'b18-reset');finish(t,m);rejected(t,m,action);
 }
});

test('field windows reject hidden edits while preserving the fields that reset deliberately retains',()=>{
 const t=taskAt(cases[0]);
 for(const key of fieldKeys.filter(k=>k!=='guess')){
  const m=M.initial(t);m[key]='1';finish(t,m);assert.equal(M.valid(t,m),true);rejected(t,m,'initial hidden '+key);
 }
 for(const key of fieldKeys.filter(k=>!['factor','answer','equation'].includes(k))){
  const m=build(t);m[key]+='1';assert.equal(M.valid(t,m),true);rejected(t,m,'final hidden '+key);
 }
 for(const key of ['factor','answer','equation']){
  const m=build(t);click(t,m,'reset');m[key]+='1';finish(t,m);assert.equal(M.valid(t,m),true);rejected(t,m,'reset hidden '+key);
 }
});

test('exact record keys, ordered identities, first guess and last issue must all match the replayed snapshot',()=>{
 const t=taskAt(cases[0]),base=build(t);
 const edits=[
  m=>{m.extra=true;},m=>{m.board.extra=true;},m=>{m.history[0].extra=true;},
  m=>{m.history[0].f.extra='';},m=>{delete m.history[0].f.tile;},m=>{m.history[0].d.extra='';},
  m=>{m.board.first='99';},m=>{m.board.owners.reverse();},m=>{m.board.selected=999;},
  m=>{m.board.factor=8;},m=>{m.board.started=false;},m=>{m.history=[];},m=>{m.issue='invented';}
 ];
 for(const edit of edits){const m=cp(base);edit(m);rejected(t,m);}
 const m=cp(base);field(t,m,'factor',3);click(t,m,'cut');field(t,m,'factor',4);accepted(t,m);
 m.issue='';assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejected(t,m,'do not erase the last failed-cut message');
});

test('the source 1200-event cap is explicit and ignored later clicks never create an invented retry epoch',()=>{
 const t=taskAt(cases[0]),m=M.initial(t);
 // reset is actually available initially; repeated records intentionally reach
 // the existing cap without adding a synthetic history format.
 assert.match(V.render(t,m),/data-x="b18-reset"/);
 for(let i=0;i<1190;i++)M.act(t,m,'b18-reset');
 finish(t,m);assert.equal(m.history.length,1200);const p=accepted(t,m);
 assert.equal(p.resets.length,1190);assert.equal(p.assessmentLimits.allLaterClicksRecorded,false);
 const saved=cp(m);assert.equal(click(t,m,'reset'),false);assert.deepEqual(m,saved);accepted(t,m);
 const late=M.initial(t);for(let i=0;i<1191;i++)M.act(t,late,'b18-reset');
 start(t,late);cut(t,late);
 for(let person=0;person<3;person++){click(t,late,'person',person);click(t,late,'give',person);}
 click(t,late,'person',3);assert.equal(late.history.length,1200);
 assert.equal(click(t,late,'give',3),false);written(t,late);rejected(t,late);
 const over=cp(m);over.history.push(cp(over.history[0]));assert.equal(M.valid(t,over),false);rejected(t,over);
});

test('complete task fingerprints and typed native contexts isolate all seven associated and two practice positions',()=>{
 for(const c of cases){
  const t=taskAt(c);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},{...c,index:-1},{...c,index:999},
   {...c,sessionId:'__proto__'},{...c,sessionId:'constructor'},{...c,sessionId:1}])assert.equal(fracShareBinding(t,context),null);
  for(const changed of [{...t,prompt:t.prompt+' changed'},{...t,n:t.n+1},{...t,d:t.d+1},{...t,people:t.people+1},
   {...t,type:'x-fractioncase'},{...t,extra:true},{...t,unit:'米'}]){
   assert.equal(fracShareBinding(changed,c),null);rejected(changed,build(t));
  }
 }
 for(const c of [...bridges,...practices]){
  const t=taskAt(c),m=build(t);accepted(t,m);
  assert.equal(fracShareBinding(t,c),null);assert.equal(thinkingGuide(t,c),null);
  assert.equal(thinkingFeedback(t,m,record(m),c),null);
 }
});

test('public feedback names current share quantities and tool-generated displays without inventing explanation or mastery evidence',()=>{
 for(const c of cases){
  const t=taskAt(c),m=build(t),r=record(m),feedback=thinkingFeedback(t,m,r,c);
  assert.ok(feedback);assert.equal(feedback.method,null);assert.ok(thinkingGuide(t,c));
  const content=JSON.stringify(feedback);assert.match(content,/每人/);assert.match(content,/系统|工具/);
  assert.match(content,/长期掌握/);assert.match(content,/解释/);assert.ok(content.includes(text(share(t))));
  const before=cp(r.attempts);field(t,m,'answer',String(share(t)[0]*2)+'/'+String(share(t)[1]*2));
  accepted(t,m);assert.equal(latestSubmissionMatches(m,r),false);assert.equal(thinkingFeedback(t,m,r,c),null);
  r.attempts.push({value:cp(m)});assert.ok(thinkingFeedback(t,m,r,c));
  click(t,m,'reset');finish(t,m,{reverse:true});assert.equal(thinkingFeedback(t,m,r,c),null);
  assert.deepEqual(r.attempts.slice(0,before.length),before);
 }
});

test('an exactly identical rebuilt model cannot prove a new retry epoch when the original format stores no epoch',()=>{
 const c=cases[0],t=taskAt(c),first=build(t),r=record(first),again=build(t);
 assert.deepEqual(again,first);assert.equal(latestSubmissionMatches(again,r),true);
 assert.ok(thinkingFeedback(t,again,r,c));assert.equal(r.attempts.length,1);
 assert.equal(accepted(t,again).assessmentLimits.exactKeystrokeOrderKnown,false);
});

test('malformed task, model and records fail closed without mutating valid old values',()=>{
 const c=cases[0],t=taskAt(c),m=build(t);
 for(const bad of [null,undefined,[],true,0,'bad',{}, {...m,history:null},{...m,history:[null]},{...m,board:null}]){
  assert.equal(replayFracShareEvidence(t,bad),null);
 }
 for(const bad of [null,undefined,[],{},true,{...t,n:NaN}])assert.equal(replayFracShareEvidence(bad,m),null);
 for(const r of [null,{}, {attempts:[]},{attempts:[null]},{attempts:[{value:null}]}]){
  assert.equal(latestSubmissionMatches(m,r),false);assert.equal(thinkingFeedback(t,m,r,c),null);
 }
 accepted(t,m);
});

test.after(()=>console.log('P9_FRACSHARE_INDEPENDENT_NODE '+JSON.stringify({
 ...metrics,nativeTasks:cases.length,associatedTasks:bridges.length,practicePositions:practices.length,
 actualChromium:false,childLearningAssessed:false
})));
