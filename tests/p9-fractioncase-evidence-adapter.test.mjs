import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-fractioncase-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionMeta} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b18-model.js';
import * as F from '../dist/learning/phase5/b17-model.js';
import * as V from '../dist/learning/phase5/b18-view.js';
import {fractionCaseBinding,replayFractionCaseEvidence} from '../dist/learning/fractioncase-evidence.js';
import {fractionOperationsBinding,replayFractionOperationsEvidence} from '../dist/learning/fraction-operations-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {freshLesson,submitLesson} from '../dist/learning/state.js';
import {studyActionFocus} from '../dist/learning/workspace-flow.js';

await ensureB39Ready();
const {cases,associated,sourceHashes}=fixture,clone=structuredClone;
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const context=c=>({sessionId:c.id,index:c.index}),taskFor=c=>sessionTasks(c.id)[c.index];
const spec=(id,index=0)=>{const c=cases.find(c=>c.id===id&&c.index===index);assert.ok(c);return c;};
const original=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);};
const accepts=(t,m)=>{original(t,m);const p=replayFractionCaseEvidence(t,m);assert.ok(p);return p;};
const rejects=(t,m,label)=>assert.equal(replayFractionCaseEvidence(t,m),null,label);
const counters={paths:0,buttons:0,fields:0,verdicts:0,actualSubmissions:0};

// Positive paths are admitted by the actual original renderer before each
// original field/action call. These probes are not Chromium execution.
function step(t,m,s){
 const html=V.render(t,m);
 if(s.field){
  const controls=[...html.matchAll(/<(input|select|textarea)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)].filter(x=>x[2]===s.field);
  assert.equal(controls.length,1,s.field+' must be a real visible field');
  assert.doesNotMatch(controls[0][0],/\bdisabled\b/);
  if(controls[0][1]==='select')assert.ok(html.slice(controls[0].index).split('</select>')[0].includes('value="'+s.value+'"'));
  if(s.field.startsWith('work.'))m.work[s.field.slice(5)]=String(s.value);else m[s.field]=String(s.value);
  M.field(t,m,s.field);counters.fields++;
 }else{
  const controls=[...html.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>x.includes('data-x="'+s.action+'"')&&
   Object.entries(s.data||{}).every(([k,v])=>x.includes('data-'+k+'="'+v+'"')));
  assert.equal(controls.length,1,s.action+' must be a real visible button');assert.doesNotMatch(controls[0],/\bdisabled\b/);
  M.act(t,m,s.action,s.data);counters.buttons++;
 }
 assert.equal(M.valid(t,m),true);return m;
}
const field=(t,m,key,value)=>step(t,m,{field:key,value:String(value)});
const act=(t,m,action,data={})=>step(t,m,{action,data});
function steps(t,{wrongPrediction=false,reverse=false,formScale=1}={}){
 const source=clone(t);
 if(formScale!==1)for(const key of['a','b']){const[n,d]=F.frac(t[key]);source[key]=`${n*formScale}/${d*formScale}`;}
 const out=M.solveSteps(source).map(s=>clone(s));
 if(wrongPrediction)for(const s of out){
  if(s.field==='guess')s.value='negative';
  if(s.field==='low')s.value='100';if(s.field==='high')s.value='101';if(s.field==='inside')s.value='no';
 }
 if(reverse)for(let i=0;i<out.length;){
  if(!['b18-op-shade','b18-op-column','b18-op-row'].includes(out[i].action)){i++;continue;}
  let end=i+1;while(end<out.length&&out[end].action===out[i].action)end++;
  out.splice(i,end-i,...out.slice(i,end).reverse());i=end;
 }
 return out;
}
function finish(t,m,options={}){for(const s of steps(t,options))step(t,m,s);return m;}
const example=(t,options)=>{counters.paths++;return finish(t,M.initial(t),options);};
function until(t,m,action,options={}){const all=steps(t,options),end=all.findIndex(s=>s.action===action);assert.ok(end>=0);for(const s of all.slice(0,end+1))step(t,m,s);return all.slice(end+1);}
const continueSteps=(t,m,list)=>{for(const s of list)step(t,m,s);return m;};

test('independent fingerprints enumerate exactly 38 native positions, 14 sources and 56 associated copies',()=>{
 assert.equal(cases.length,38);assert.equal(new Set(cases.map(c=>c.nodeId)).size,14);assert.equal(associated.length,56);
 assert.equal(fixture.coreDependencyIssue,150);
 for(const[path,digest]of Object.entries(sourceHashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),digest,path);
 for(const c of cases){
  const t=taskFor(c),ctx=context(c);assert.deepEqual(t,c.task);assert.equal(c.sessionId,c.id);assert.equal(hash(t),c.taskHash);assert.equal(sessionMeta(c.id).topicId,c.nodeId);
  assert.deepEqual([t.a,t.op,t.b],[c.a,c.op,c.b]);
  const binding=fractionCaseBinding(t,ctx);assert.equal(binding.nodeId,c.nodeId);assert.equal(binding.method,null);assert.ok(binding.question);
  assert.equal(fractionOperationsBinding({...t,type:'x-fracoperations'},ctx),null,'the inner widget does not inherit a native B17 binding');
  for(const bad of [null,[],false,c.id,{}, {...ctx,index:String(c.index)},{...ctx,index:-1},{...ctx,index:999},
   {...ctx,sessionId:'__proto__'},{...ctx,sessionId:{toString:null}}])assert.equal(fractionCaseBinding(t,bad),null);
  for(const bad of [{...t,a:'100'},{...t,prompt:t.prompt+' changed'},{...t,extra:true},{...t,type:'x-fracoperations'}])assert.equal(fractionCaseBinding(bad,ctx),null);
 }
 const found=[],bridges=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{if(fractionCaseBinding(t,{sessionId:id,index}))found.push(id+':'+index);});
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  assert.equal(fractionCaseBinding(t,{sessionId:id,index}),null,id+':'+index);
  if(t.type==='x-fractioncase')bridges.push(id+':'+index);
 });
 assert.deepEqual(bridges.sort(),associated.map(c=>c.id+':'+c.index).sort());
});

for(const c of cases)test(`${c.id}:${c.index} correlates its real outer choice with the actual inner construction`,()=>{
 const t=taskFor(c),m=example(t),before=JSON.stringify(m),p=accepts(t,m);counters.verdicts++;
 assert.deepEqual(m,M.example(t));assert.equal(JSON.stringify(m),before);assert.deepEqual(p.quantities.result,c.result);
 assert.equal(p.operator,t.op);assert.equal(p.starts.length,1);assert.equal(p.resets.length,0);
 assert.equal(p.currentStart.innerIndex,0);assert.equal(p.currentStart.automaticPrediction,m.work.history[0].f.prediction);
 assert.equal(p.currentStart.predictionAttribution,t.estimate?'tool-derived-from-interval':'tool-copied-from-outer-guess');
 assert.equal(p.exactCrossStreamTimingKnown,false);assert.equal(p.storyMeaningAssessed,false);assert.equal(p.independentExplanationAssessed,false);
 assert.deepEqual(p.firstAttempt,m.board.first);assert.equal(p.construction.currentEpoch,0);
 if(t.estimate){assert.equal(p.estimate.inclusive,true);assert.equal(p.estimate.submitted,m.inside);}
 if(t.simple){assert.deepEqual(p.simple.value,c.result);assert.equal(p.simple.scope,'submitted-name');}
 if(t.tile){assert.deepEqual(p.tile.unit,p.construction.product.cellArea);assert.equal(p.tile.count,p.construction.product.cellCount);}
 if(t.inverse){assert.equal(p.inverse.scope,'submitted-equation');assert.deepEqual(p.inverse.total,p.quantities.a);}
 if(t.reciprocal){assert.equal(p.normalized.exactTimingKnown,false);assert.deepEqual(p.normalized.scaledB,[1,1]);assert.ok(p.normalized.compatibleReadyPrefixes.length);}
 const record={attempts:[{correct:true,value:clone(m)}]};assert.equal(latestSubmissionMatches(m,record),true);
 const edited=clone(m);edited.work.answer='999';assert.equal(latestSubmissionMatches(edited,record),false);rejects(t,edited);
 record.attempts.push({correct:false,value:clone(edited)});assert.equal(latestSubmissionMatches(m,record),false);
 assert.deepEqual(replayFractionCaseEvidence(t,JSON.parse(before)),p);
});

test('all 56 associated positions are solved through real controls without receiving a native binding',()=>{
 for(const c of associated){const t=taskFor(c);assert.equal(hash(t),c.taskHash);assert.equal(c.sessionId,c.id);
  assert.deepEqual([BRIDGES[c.id].from,BRIDGES[c.id].to,BRIDGES[c.id].fromTopicId,BRIDGES[c.id].topicId],[c.from,c.to,c.fromNodeId,c.toNodeId]);
  const m=example(t);original(t,m);counters.verdicts++;
  assert.equal(fractionCaseBinding(t,context(c)),null);assert.ok(replayFractionCaseEvidence(t,m),'a valid construction alone is not admission');}
});

test('all 38 tasks retain legitimate wrong predictions and exactly paired reset histories',()=>{
 for(const c of cases){
  const t=taskFor(c),m=example(t,{wrongPrediction:true,reverse:true}),p=accepts(t,m),prior=clone(m);counters.verdicts++;
  if(t.estimate){assert.deepEqual(p.estimate.bounds,['100','101']);assert.equal(p.estimate.inside,false);}
  else assert.equal(p.firstAttempt.guess,'negative');
  act(t,m,'b18-reset');assert.deepEqual(m.history.slice(0,-1),prior.history);assert.deepEqual(m.work.history.slice(0,-1),prior.work.history);
  assert.deepEqual(m.board.first,prior.board.first);assert.equal(m.work.board.first,prior.work.board.first);
  for(const key of Object.keys(M.fields))assert.equal(m[key],prior[key]);
  for(const key of Object.keys(F.fields))assert.equal(m.work[key],prior.work[key]);
  assert.equal(m.board.started,false);assert.equal(m.work.board.prediction,null);rejects(t,m);
  finish(t,m);const end=accepts(t,m);counters.verdicts++;
  assert.equal(end.starts.length,2);assert.equal(end.resets.length,1);assert.equal(end.construction.currentEpoch,1);
  assert.deepEqual(end.firstAttempt,prior.board.first);assert.equal(end.currentStart.innerIndex,prior.work.history.length+1);
  assert.deepEqual(m.history.slice(0,prior.history.length),prior.history);assert.deepEqual(m.work.history.slice(0,prior.work.history.length),prior.work.history);
 }
});

test('all five real State submissions and complete older attempts survive edits and a full reset in both paths',()=>{
 for(const reverse of[false,true])for(const c of cases){
  const t=taskFor(c),a=freshLesson(c.id),m=M.initial(t),snapshots=[];a.index=c.index;a.models[c.index]=m;counters.paths++;
  const check=(correct,strict)=>{
   assert.equal(studyActionFocus({task:t,model:m}).readyToCheck,true);
   const before=clone(m),older=clone(a.cases[c.index]?.attempts||[]),result=submitLesson(a);
   assert.equal(result.correct,correct);assert.equal(!!replayFractionCaseEvidence(t,m),strict);assert.deepEqual(m,before);
   assert.deepEqual(a.cases[c.index].attempts.slice(0,-1),older);assert.deepEqual(a.cases[c.index].attempts.at(-1).value,before);
   snapshots.push(clone(a.cases[c.index].attempts.at(-1)));counters.actualSubmissions++;counters.verdicts++;
  };
  check(false,false);finish(t,m,{wrongPrediction:true,reverse});const answer=m.work.answer;
  field(t,m,'work.answer','999');check(false,false);field(t,m,'work.answer',answer);check(true,true);
  const first=clone(m);field(t,m,'work.answer','998');assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);check(false,false);
  act(t,m,'b18-reset');finish(t,m,{reverse});check(true,true);
  assert.equal(a.cases[c.index].attempts.length,5);assert.deepEqual(a.cases[c.index].attempts,snapshots);
  assert.deepEqual(JSON.parse(JSON.stringify(a)).cases[c.index].attempts,snapshots);
  assert.deepEqual(m.history.slice(0,first.history.length),first.history);assert.deepEqual(m.work.history.slice(0,first.work.history.length),first.work.history);
 }
 assert.equal(counters.actualSubmissions,380);
});

test('equivalent unreduced input forms change the actual pieces and cells without changing the task quantities',()=>{
 for(const c of cases){const t=taskFor(c),base=accepts(t,example(t)),m=example(t,{formScale:2,reverse:true}),p=accepts(t,m);counters.verdicts++;
  assert.deepEqual(p.quantities,base.quantities);assert.deepEqual(p.construction.forms,base.construction.forms.map(r=>r.map(n=>2*n)));
  if(t.op==='*'){assert.equal(p.construction.product.cellCount,4*base.construction.product.cellCount);assert.equal(p.construction.product.cellArea[1],4*base.construction.product.cellArea[1]);}
  else assert.equal(p.construction.common.denominator,2*base.construction.common.denominator);
 }
});

test('zero whole groups and nonzero remainders keep original units separate from a group unit',()=>{
 for(const[id,index,q,amount,part]of[['fractionquotient',0,0,[2,3],[5,6]],['fractionquotient',1,1,[1,4],[1,2]],['fractionquotient',2,1,[1,6],[1,4]]]){
  const t=taskFor(spec(id,index)),p=accepts(t,example(t)),d=p.construction.division;
  assert.equal(d.wholeGroups,q);assert.deepEqual(d.remainingAmount,amount);assert.deepEqual(d.fractionOfGroup,part);
  assert.equal(d.originalPieces,d.wholeGroups*d.groupPieces+d.remainingPieces);assert.ok(d.remainingPieces<d.groupPieces);
  assert.equal(d.fitIndices.length,q);assert.equal(d.toolDisplaysRemainder,true);
 }
});

test('closed interval endpoints, missed intervals and percent bounds are checked independently',()=>{
 for(const bounds of[['23/12','2'],['1','23/12'],['0','1/2'],['50%','100%'],['-0 1/2','0']]){
  const t=taskFor(spec('unlikeparts')),m=M.initial(t);const all=steps(t),lo=F.frac(bounds[0]),hi=F.frac(bounds[1]);
  const inside=23n*BigInt(lo[1])>=12n*BigInt(lo[0])&&23n*BigInt(hi[1])<=12n*BigInt(hi[0]);
  for(const s of all){if(s.field==='low')s.value=bounds[0];if(s.field==='high')s.value=bounds[1];if(s.field==='inside')s.value=inside?'yes':'no';step(t,m,s);}
  const p=accepts(t,m);assert.equal(p.estimate.inside,inside);assert.deepEqual(p.estimate.bounds,bounds);
 }
});

test('a source floating comparison limitation does not become an exact strict interval',()=>{
 const t=taskFor(spec('unlikeparts')),m=M.initial(t);field(t,m,'choice',t.op);field(t,m,'low','999999990001/99999999');field(t,m,'high','999999980001/99999998');
 assert.ok(999999990001n*99999998n<999999980001n*99999999n);assert.equal(F.cmp(m.low,m.high),0);
 act(t,m,'b18-start');assert.equal(m.board.started,false);assert.ok(m.issue);finish(t,m);original(t,m);rejects(t,m);
});

test('failed outer choices and failed intervals cannot be erased by correction or reset',()=>{
 for(const c of[spec('joinfractions'),spec('unlikeparts')])for(const reset of[false,true]){
  const t=taskFor(c),m=M.initial(t);field(t,m,'choice',t.estimate?t.op:'*');
  if(t.estimate){field(t,m,'low','2');field(t,m,'high','1');}else field(t,m,'guess','part');
  act(t,m,'b18-start');assert.ok(m.issue);const failed=clone(m.history);
  if(reset)act(t,m,'b18-reset');finish(t,m);original(t,m);assert.deepEqual(m.history.slice(0,failed.length),failed);rejects(t,m);
 }
});

test('failed forms and invalid common units stay excluded after valid completion and reset',()=>{
 for(const failure of['forms','common'])for(const reset of[false,true]){
  const t=taskFor(spec('joinfractions')),m=M.initial(t);let remaining=until(t,m,'b18-start');
  if(failure==='forms'){field(t,m,'work.aform','1/5');field(t,m,'work.bform','2/5');act(t,m,'b18-op-forms');}
  else{remaining=continueSteps(t,m,remaining.slice(0,3))&&remaining.slice(3);field(t,m,'work.denom','3');act(t,m,'b18-op-common');}
  assert.ok(m.issue);const old=clone(m.work.history);
  if(reset){act(t,m,'b18-reset');finish(t,m);}else continueSteps(t,m,remaining);
  original(t,m);assert.deepEqual(m.work.history.slice(0,old.length),old);rejects(t,m);
 }
});

test('outer and inner histories must agree on each automatic prediction even when both original validators pass',()=>{
 for(const c of[spec('joinfractions'),spec('unlikeparts'),spec('fractionquotient')]){
  const t=taskFor(c),m=example(t,{wrongPrediction:true}),inner=M.inner(t),other=F.initial(inner);
  const different=m.work.board.prediction==='negative'?'more':'negative';
  for(const s of F.solveSteps(inner)){
   if(s.field){other[s.field]=s.field==='prediction'?different:s.value;F.field(inner,other,s.field);}else F.act(inner,other,s.action,s.data);
  }
  m.work=other;original(t,m);assert.ok(replayFractionOperationsEvidence({type:'x-fracoperations',a:t.a,b:t.b,op:t.op,prompt:t.prompt},m.work));
  rejects(t,m,'individually valid streams do not establish a correlated start');
 }
});

test('the core receives only its five mathematical keys and pre-start hidden inner edits cannot become child operations',()=>{
 const t=taskFor(spec('joinfractions')),m=example(t);
 assert.equal(replayFractionOperationsEvidence(M.inner(t),m.work),null,'outer scene/flags are not part of the core contract');
 assert.ok(replayFractionCaseEvidence(t,m));
 const hidden=M.initial(t);assert.ok(!V.render(t,hidden).includes('data-xfield="work.answer"'));
 hidden.work.answer='4/5';M.field(t,hidden,'work.answer');finish(t,hidden);original(t,hidden);rejects(t,hidden);
 const reset=example(t,{wrongPrediction:true});act(t,reset,'b18-reset');finish(t,reset);
 reset.work=clone(m.work);original(t,reset);rejects(t,reset,'a missing inner reset cannot borrow two outer starts');
});

test('only outer resets can anchor an inner reset and no start can be silently repeated',()=>{
 const t=taskFor(spec('joinfractions'));
 for(const action of['b18-start','b18-cut','b18-op-predict-op','b18-op-forms']){
  const m=example(t);assert.ok(!V.render(t,m).includes('data-x="'+action+'"'));M.act(t,m,action);
  if(action==='b18-op-forms'){const all=steps(t);continueSteps(t,m,all.slice(all.findIndex(s=>s.action==='b18-op-forms')+1));}
  original(t,m);rejects(t,m,action);
 }
 const m=example(t);M.act(t,m,'b18-op-reset');
 // Rebuild the inner original model directly only as an adversarial API input.
 for(const s of F.solveSteps(M.inner(t))){if(s.field){m.work[s.field]=s.value;F.field(M.inner(t),m.work,s.field);}else F.act(M.inner(t),m.work,s.action,s.data);}
 original(t,m);rejects(t,m,'an unmatched inner reset is not an outer UI action');
});

test('empty outer resets are real confirmations and preserve paired epoch identity',()=>{
 const t=taskFor(spec('joinfractions')),m=M.initial(t);act(t,m,'b18-reset');act(t,m,'b18-reset');finish(t,m);
 const p=accepts(t,m);assert.equal(p.resets.length,2);assert.equal(p.currentStart.epoch,2);assert.equal(p.currentStart.innerIndex,2);
 assert.ok(p.construction.resets.every(r=>r.preservedFirst===null));
});

test('normalization proves the reciprocal applied to both quantities without inventing a cross-stream timestamp',()=>{
 const t=taskFor(spec('fractionquotient',1)),m=example(t),p=accepts(t,m);
 assert.deepEqual(p.normalized.factor,[2,1]);assert.deepEqual(p.normalized.scaledA,[3,2]);assert.deepEqual(p.normalized.scaledB,[1,1]);
 assert.equal(p.normalized.exactTimingKnown,false);assert.equal(p.exactCrossStreamTimingKnown,false);
 const before=clone(m);act(t,m,'b18-normalize');const again=accepts(t,m);assert.equal(again.normalizations.length,2);
 assert.deepEqual(again.normalizations[0].compatibleReadyPrefixes,again.normalizations[1].compatibleReadyPrefixes);
 assert.deepEqual(m.work.history,before.work.history,'the outer request is not an invented inner operation');
 // This API chronology is observationally indistinguishable from a legal late
 // normalize. The proof may expose a compatible interval, never certify when.
 const early=M.initial(t),remaining=until(t,early,'b18-start');early.inverse='2';early.scaledA='3/2';early.scaledB='1';
 assert.ok(!V.render(t,early).includes('data-x="b18-normalize"'));M.act(t,early,'b18-normalize');
 continueSteps(t,early,remaining.filter(s=>!['inverse','scaledA','scaledB'].includes(s.field)&&s.action!=='b18-normalize'));
 const ambiguous=accepts(t,early);assert.equal(ambiguous.normalized.exactTimingKnown,false);assert.ok(ambiguous.normalized.compatibleReadyPrefixes[0][0]>1);
});

test('every normalization epoch needs its own nonempty compatible ready interval',()=>{
 const t=taskFor(spec('fractionquotient',1)),m=M.initial(t);until(t,m,'b18-start');m.inverse='2';m.scaledA='3/2';m.scaledB='1';M.act(t,m,'b18-normalize');
 act(t,m,'b18-reset');finish(t,m);original(t,m);rejects(t,m,'a later epoch cannot supply readiness for an earlier normalization');
});

test('common-unit changes remove readiness and compatible windows exclude the unfinished prefixes',()=>{
 const t=taskFor(spec('fractionquotient',1)),m=example(t),oldLength=m.work.history.length;
 act(t,m,'b18-op-common');assert.ok(!V.render(t,m).includes('data-x="b18-normalize"'));rejects(t,m);
 const list=steps(t),afterCommon=list.findIndex(s=>s.action==='b18-op-common')+1;continueSteps(t,m,list.slice(afterCommon));
 const p=accepts(t,m);assert.equal(p.normalizations.length,2);assert.equal(p.exactCrossStreamTimingKnown,false);
 const rest=p.construction.events.filter(e=>e.action==='rest').at(-1).index;
 for(const n of p.normalizations){
  assert.ok(n.compatibleReadyPrefixes.length>=2);
  for(let prefix=oldLength+1;prefix<=rest;prefix++)assert.ok(!n.compatibleReadyPrefixes.some(([lo,hi])=>lo<=prefix&&prefix<=hi));
 }
});

test('outer record inputs cannot change in an epoch that never exposed them',()=>{
 const t=taskFor(spec('fractioncarry',1)),m=M.initial(t);until(t,m,'b18-start');
 assert.ok(!V.render(t,m).includes('data-xfield="simple"'));m.simple='1/2';M.field(t,m,'simple');act(t,m,'b18-reset');
 finish(t,m);original(t,m);rejects(t,m,'a future ready construction cannot make a previous hidden edit visible');
});

test('real repeated combine and remainder requests are confirmations, not additional construction',()=>{
 for(const c of[spec('joinfractions'),spec('fractionquotient')]){
  const t=taskFor(c),m=example(t),before=accepts(t,m),action=t.op==='/'?'b18-op-rest':'b18-op-combine';
  act(t,m,action);const p=accepts(t,m);assert.equal(p.construction.events.at(-1).effect,false);
  assert.deepEqual(p.quantities,before.quantities);assert.equal(p.starts.length,1);
  if(t.op==='/')assert.equal(p.construction.division.wholeGroups,before.construction.division.wholeGroups);
 }
});

test('a wrong reciprocal or one-sided scaling followed by correction retains the invalid historical record',()=>{
 const t=taskFor(spec('fractionquotient',1));
 for(const[fieldName,bad]of[['inverse','1/2'],['scaledA','3/4'],['scaledB','1/2']]){
  const m=example(t),correct=m[fieldName];field(t,m,fieldName,bad);act(t,m,'b18-normalize');assert.ok(m.issue);
  field(t,m,fieldName,correct);act(t,m,'b18-normalize');original(t,m);rejects(t,m);
  act(t,m,'b18-reset');finish(t,m);original(t,m);rejects(t,m);
 }
});

test('submitted minimal, mixed, area and inverse names are not separate recorded calculations',()=>{
 const c=spec('fractioncarry',1),t=taskFor(c),m=example(t),history=clone(m.history),inner=clone(m.work.history);
 for(const name of['0.5','1/2']){field(t,m,'simple',name);const p=accepts(t,m);assert.equal(p.simple.scope,'submitted-name');}
 field(t,m,'simple','2/4');assert.equal(M.inspect(t,m).correct,false);rejects(t,m);field(t,m,'simple','1/2');accepts(t,m);
 assert.deepEqual(m.history,history);assert.deepEqual(m.work.history,inner);
 const dt=taskFor(spec('fractionquotient')),dm=example(dt);for(const eq of['5/6×4/5=2/3','4/5 * 5/6 = 2/3']){field(dt,dm,'equation',eq);assert.equal(accepts(dt,dm).inverse.scope,'submitted-equation');}
 const wt=taskFor(spec('fractionstories',1)),wm=example(wt);assert.deepEqual(accepts(wt,wm).mixed,{whole:4,part:[0,1],submitted:{whole:'4',part:'0'}});
});

test('exact grammar rejects split digits, exponents, near values, signed wrong amounts and invisible fields',()=>{
 for(const c of[spec('fractioncarry',1),spec('fractionquotient',1),spec('fractionarea')]){
  const t=taskFor(c),base=example(t);
  for(const bad of['0 1','1e0','0.5000000000000001','-0 1/2','1/0']){const m=clone(base);m.work.answer=bad;rejects(t,m,bad);}
  for(const key of Object.keys(M.fields).filter(k=>!['inside','simple','whole','part','tile','count','equation','inverse','scaledA','scaledB','story'].includes(k))){const m=clone(base);m[key]='999';rejects(t,m,key);}
  const hidden=clone(base);hidden.work.fraction='forged';rejects(t,hidden);
 }
});

test('the smallest accepted percent intervals remain exact and raw overprecision is not reduced into acceptance',()=>{
 const t=taskFor(spec('unlikeparts')),m=M.initial(t),list=steps(t);
 for(const s of list){if(s.field==='low')s.value='1/100000000%';if(s.field==='high')s.value='2/100000000%';if(s.field==='inside')s.value='no';step(t,m,s);}
 const p=accepts(t,m);assert.deepEqual(p.estimate.lower,[1,10000000000]);assert.deepEqual(p.estimate.upper,[1,5000000000]);assert.equal(p.estimate.inside,false);
 const bad=M.initial(t);field(t,bad,'choice',t.op);field(t,bad,'low','0.750000000');field(t,bad,'high','5');act(t,bad,'b18-start');
 assert.ok(bad.issue);act(t,bad,'b18-reset');finish(t,bad);original(t,bad);rejects(t,bad);
});

test('unknown, redundant, cross-type and structurally tampered histories fail without mutating their inputs',()=>{
 const t=taskFor(spec('joinfractions')),m=example(t),before=JSON.stringify([t,m]);
 const badModels=[null,[],{}, {...m,extra:true}, {...m,issue:'old failure'}, {...m,history:[]}];
 for(const change of[e=>e.d={index:'0'},e=>e.extra=true,e=>e.f.extra='x',e=>delete e.f.answer,e=>e.a='normalize']){const bad=clone(m);change(bad.history[0]);badModels.push(bad);}
 for(const bad of badModels)rejects(t,bad);
 for(const bad of[{...t,extra:true},{...t,type:'x-fracoperations'},{...t,tile:true},{...t,reciprocal:true},{...t,story:false},
  ...[[],null,false,'',{},[0,{toString:()=>1}]].map(estimate=>({...t,estimate}))])rejects(bad,m);
 assert.equal(JSON.stringify([t,m]),before);
});

test('the exact browser planners use enabled original controls for both complete native and associated viewport paths',()=>{
 const source=fs.readFileSync(new URL('./p9-fractioncase-adapter-browser.cjs',import.meta.url),'utf8');
 const start=source.indexOf(' function solveSteps('),end=source.indexOf(' for(const spec of [...cases,...associated])');
 assert.ok(start>=0&&end>start);
 const browserSteps=new Function('M','F',source.slice(start,end)+'\nreturn solveSteps;')(M,F);
 for(const reverse of[false,true]){
  for(const c of cases){
   const t=taskFor(c),m=M.initial(t);counters.paths++;
   continueSteps(t,m,browserSteps(t,{wrongPrediction:true,reverse}));accepts(t,m);counters.verdicts++;
   field(t,m,'work.answer','998');act(t,m,'b18-reset');continueSteps(t,m,browserSteps(t,{reverse}));accepts(t,m);counters.verdicts++;
  }
  for(const c of associated){const t=taskFor(c),m=M.initial(t);counters.paths++;continueSteps(t,m,browserSteps(t,{reverse}));original(t,m);assert.equal(fractionCaseBinding(t,context(c)),null);counters.verdicts++;}
  for(const c of[spec('joinfractions'),spec('joinfractions',1),spec('fractionarea'),spec('fractionquotient')]){
   const t=taskFor(c),m=M.initial(t);counters.paths++;
   continueSteps(t,m,browserSteps(t,{formScale:2,reverse,scattered:t.op==='*'}));const p=accepts(t,m);counters.verdicts++;
   if(t.op==='*'){
    assert.equal(p.construction.product.contiguousColumns,false);
    const grid=V.visual(t,m).split('<div class="b18-area-grid"')[1].split('</div>')[0];
    assert.equal((grid.match(/background:#c98d55/g)||[]).length,p.construction.product.cellCount);
   }
  }
  for(const bounds of[['-0 1/2','-0 1/4'],['50%','100%'],['23/12','2'],['1','23/12']]){
   const t=taskFor(spec('unlikeparts')),m=M.initial(t);counters.paths++;continueSteps(t,m,browserSteps(t,{bounds}));
   const p=accepts(t,m);counters.verdicts++;assert.deepEqual(p.estimate.bounds,bounds);
  }
 }
});

const saved=value=>({support:false,attempts:[{value:clone(value)}]});
const feedback=(c,m,record=saved(m))=>thinkingFeedback(taskFor(c),m,record,context(c));
const words=card=>[card.observation,...card.detail,card.connection].join('\n');

test('all 38 feedback bindings require the current full submission and preserve source and method boundaries',()=>{
 for(const c of cases){
  const t=taskFor(c),m=M.example(t),record=saved(m),before=JSON.stringify([t,m,record]);
  const guide=thinkingGuide(t,context(c)),card=feedback(c,m,record);
  assert.ok(guide&&card);assert.equal(card.method,null);assert.match(guide.summary,/可选/);
  assert.match(words(card),/工具/);assert.match(words(card),/当前提交/);assert.match(words(card),/长期掌握/);
  assert.match(words(card),/故事的意义/);assert.doesNotMatch(words(card),/你(?:独立|亲手)(?:证明|计算|推导|归一化)/);
  assert.equal(thinkingFeedback(t,m,{attempts:[]},context(c)),null);
  const edited=clone(m);edited.work.answer='999';assert.equal(feedback(c,edited,record),null);
  assert.equal(feedback(c,m,{attempts:[{value:clone(m)},{value:M.initial(t)}]}),null);
  assert.equal(thinkingFeedback({...t,scene:t.scene+' changed'},m,record,context(c)),null);
  assert.equal(thinkingFeedback(t,m,record,{...context(c),index:String(c.index)}),null);
  assert.equal(JSON.stringify([t,m,record]),before,'feedback does not change models or attempts');
 }
});

test('all 56 associated copies retain original success without borrowing guidance or strict feedback',()=>{
 for(const c of associated){
  const t=taskFor(c),m=M.example(t);original(t,m);
  assert.equal(thinkingGuide(t,context(c)),null);assert.equal(feedback(c,m),null);
 }
});

test('prediction feedback distinguishes the first start, the current round and the tool-derived interval midpoint',()=>{
 const c=spec('unlikeparts'),t=taskFor(c),m=example(t,{wrongPrediction:true});
 let text=words(feedback(c,m));assert.match(text,/最初开始时填写的范围是 100 到 101/);
 assert.match(text,/不在本轮区间内/);assert.match(text,/工具根据本轮区间中点自动/);
 assert.match(text,/不是额外一次作答/);
 act(t,m,'b18-reset');finish(t,m);text=words(feedback(c,m));
 assert.match(text,/最初开始时填写的范围是 100 到 101/);assert.match(text,/本轮填写的范围是 1 到 2/);
 assert.match(text,/重新摆放了 1 次/);assert.match(text,/在本轮区间内/);
 const d=spec('joinfractions'),u=taskFor(d),n=example(u,{wrongPrediction:true});act(u,n,'b18-reset');finish(u,n);
 text=words(feedback(d,n));assert.match(text,/最初填写的量级猜想是“比0小”/);
 assert.match(text,/本轮开始填写的是“在0与1之间”/);assert.match(text,/未把它算作第二次预测/);
});

test('feedback attributes result strips and intersections to the tool and keeps both remainder units',()=>{
 const add=spec('joinfractions'),plus=words(feedback(add,M.example(taskFor(add))));
 assert.match(plus,/工具显示/);assert.match(plus,/实际选份/);assert.match(plus,/当前答案/);
 const zero=spec('fractionquotient'),z=words(feedback(zero,M.example(taskFor(zero))));
 assert.match(z,/0 次有效放组/);assert.match(z,/原单位的 2\/3/);assert.match(z,/一组的 5\/6/);
 const one=spec('fractionquotient',1),o=words(feedback(one,M.example(taskFor(one))));
 assert.match(o,/1 次有效放组/);assert.match(o,/原单位的 1\/4/);assert.match(o,/一组的 1\/2/);
 const c=spec('fractionarea'),t=taskFor(c),m=example(t,{formScale:2});
 act(t,m,'b18-op-column',{index:'0'});act(t,m,'b18-op-column',{index:'5'});
 const p=accepts(t,m);assert.equal(p.construction.product.contiguousColumns,false);
 const product=words(feedback(c,m));assert.match(product,/工具显示交集/);assert.match(product,/不连续/);
 assert.match(product,/没有把它们当作一块连续长方形/);assert.match(product,/本次提交的每格面积/);
});

test('normalization feedback proves both factors but explicitly limits unknown cross-stream timing',()=>{
 const c=spec('fractionquotient',1),t=taskFor(c),m=M.example(t);act(t,m,'b18-normalize');
 const p=accepts(t,m);assert.equal(p.normalizations.length,2);
 const text=words(feedback(c,m));assert.match(text,/3\/4 × 2 = 3\/2/);assert.match(text,/1\/2 × 2 = 1/);
 assert.match(text,/两边使用相同倍数，商保持不变/);assert.match(text,/与已完成图示兼容/);
 assert.match(text,/不能确定换算发生的精确时刻/);assert.doesNotMatch(text,/你先.*(?:涂|构造).*然后.*换算/);
});

test('extra names, inverse relationships and stories stay attributed to the current submission',()=>{
 const simple=spec('fractioncarry',1),s=words(feedback(simple,M.example(taskFor(simple))));
 assert.match(s,/本次提交的最简名字 1\/2/);assert.match(s,/没有把它记成一次独立约分操作/);
 const mixed=spec('fractionstories',1),u=M.example(taskFor(mixed));
 const text=words(feedback(mixed,u));assert.match(text,/整份 4 和余下部分 0/);
 const inv=spec('countsmallgroups',1),n=M.example(taskFor(inv));
 field(taskFor(inv),n,'story','这里记录的是我的故事，文字内容没有被数学适配器评价。');
 const i=words(feedback(inv,n));assert.match(i,/没有自动判断故事是否完整说明/);
 assert.match(i,/本次提交的算式/);assert.match(i,/组数 24 与每组的量 1\/4/);
 assert.match(i,/没有把算式当成另外一次计算操作/);
 const mp=spec('argument38',1),card=feedback(mp,M.example(taskFor(mp)));assert.equal(card.method,null);
});

test('originally correct repaired work receives no feedback when an earlier recorded normalization was invalid',()=>{
 const c=spec('fractionquotient',1),t=taskFor(c),m=example(t);
 field(t,m,'scaledB','2');act(t,m,'b18-normalize');field(t,m,'scaledB','1');act(t,m,'b18-normalize');
 original(t,m);assert.equal(feedback(c,m),null);
 act(t,m,'b18-reset');finish(t,m);original(t,m);assert.equal(feedback(c,m),null);
});

test('recorded control-probe totals distinguish actual model operations from browser validation',()=>{
 assert.ok(counters.paths>=208);assert.ok(counters.buttons>5000);assert.ok(counters.fields>2000);assert.ok(counters.verdicts>=500);
 assert.equal(counters.actualSubmissions,380);console.log('P9_FRACTIONCASE_REAL_CONTROL_PROBE '+JSON.stringify(counters));
});
