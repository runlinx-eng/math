import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-wideshift-cases.cjs';
import browserFixture from './p9-wideshift-adapter-browser.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b08-model.js';
import * as V from '../dist/learning/phase5/b08-view.js';
import {wideShiftBinding,replayWideShiftEvidence} from '../dist/learning/wideshift-evidence.js';
import {wideShiftEvidenceSteps,wideShiftEvidenceExample} from '../scripts/wideshift-evidence-fixture.mjs';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,validateLesson} from '../dist/learning/state.js';

await ensureB39Ready();
const {cases,associated,excludedAdd,excludedBoards}=fixture,copy=structuredClone;
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=t=>digest(JSON.stringify(stable(t)));
const taskFor=c=>sessionTasks(c.id)[c.index],at=(id,index)=>sessionTasks(id)[index];
const Q=1000000n,LIMIT=100000000n*Q;
const ticks=s=>{const negative=s.startsWith('-'),[w,f='']=s.replace(/^-/,'').split('.');return (BigInt(w)*Q+BigInt(f.padEnd(6,'0')))*(negative?-1n:1n);};
const accepted=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);const before=JSON.stringify(m),p=replayWideShiftEvidence(t,m);assert.ok(p);assert.equal(JSON.stringify(m),before);return p;};
const rejected=(t,m)=>assert.equal(replayWideShiftEvidence(t,m),null);
const originalOnly=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejected(t,m);};
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const probes={paths:0,fields:0,actions:0};
function visibleStep(t,m,s){
 const html=V.render(t,m);
 if(s.field){
  const tag=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).find(tag=>attrs(tag)['data-xfield']===s.field);assert.ok(tag,s.field+' is visible');
  if(tag.startsWith('<select'))assert.ok(html.slice(html.indexOf(tag),html.indexOf('</select>',html.indexOf(tag))).includes(`value="${s.value}"`));
  m[s.field]=String(s.value);M.field(t,m,s.field);probes.fields++;
 }else{
  const tag=[...html.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).find(tag=>attrs(tag)['data-x']===s.action&&Object.entries(s.data||{}).every(([k,v])=>attrs(tag)['data-'+k]===String(v)));
  assert.ok(tag,'original action exists');assert.doesNotMatch(tag,/\bdisabled\b/);const before=JSON.stringify(m);M.act(t,m,s.action,s.data);assert.notEqual(JSON.stringify(m),before,'positive control really acts');probes.actions++;
 }
 assert.equal(M.valid(t,m),true);
}
const visibleBuild=(t,options)=>{const m=M.initial(t);for(const s of wideShiftEvidenceSteps(t,options))visibleStep(t,m,s);probes.paths++;return m;};
function exact(t,m,p){
 let n=ticks(t.start),shift=0;assert.equal(p.start,Number(n));assert.equal(p.unit,Number(Q));assert.equal(p.steps.length,m.trace.length);
 for(const [i,delta]of m.trace.entries()){
  assert.ok(delta===1||delta===-1);const before=n;if(delta<0){assert.equal(n%10n,0n);n/=10n;}else n*=10n;
  shift+=delta;assert.ok(shift>=-9&&shift<=9&&n>0n&&n<=LIMIT);assert.equal(p.steps[i].from,Number(before));assert.equal(p.steps[i].to,Number(n));assert.equal(p.steps[i].toShift,shift);
 }
 assert.equal(p.end,Number(n));assert.equal(p.netShift,shift);assert.equal(ticks(m.answer),n);assert.equal(p.successfulMoves,m.trace.length);
 if(t.mode==='scientific'){assert.ok(n>=Q&&n<10n*Q);const exponent=BigInt(m.exponent),factor=10n**(exponent<0n?-exponent:exponent);assert.equal(exponent>=0n?n*factor:ticks(t.start)*factor,exponent>=0n?ticks(t.start):n);assert.equal(p.scientific.exponent,Number(exponent));}
 assert.equal(p.digitRowsSystemGenerated,true);assert.equal(p.unrecordedClicksAssessed,false);
}

test('all 26 literal native positions and 21 associated tasks have fixed complete source and task hashes',()=>{
 assert.equal(cases.length,26);assert.equal(new Set(cases.map(c=>c.nodeId)).size,10);assert.equal(associated.length,21);
 for(const[p,h]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+p,import.meta.url))),h,p);
 const found=[],raw=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-wideshift'&&t.mode!=='add')raw.push(id+':'+index);
  if(wideShiftBinding(t,{sessionId:id,index}))found.push(id+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(found,raw.sort());
 for(const c of [...cases,...associated]){const t=taskFor(c);assert.deepEqual(t,c.task);assert.equal(hash(t),c.taskHash);if(c.nodeId){assert.equal(LESSONS[c.id].topicId,c.nodeId);assert.equal(wideShiftBinding(t,c)?.method,null);}}
});

test('four add native tasks, one add bridge, all 28 wideboards and all 1552 associated positions stay isolated',()=>{
 assert.equal(excludedAdd.filter(c=>c.kind==='native').length,4);assert.equal(excludedAdd.filter(c=>c.kind==='bridge').length,1);assert.equal(excludedBoards.length,28);
 for(const c of [...excludedAdd,...excludedBoards]){const t=taskFor(c);assert.equal(hash(t),c.taskHash);assert.equal(wideShiftBinding(t,{sessionId:c.id,index:c.index}),null);rejected(t,M.example(t));}
 let count=0,own=0;for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{count++;if(t.type==='x-wideshift')own++;for(const a of EVIDENCE_ADAPTERS)assert.equal(a.binding(t,{sessionId:id,index}),null);});
 assert.equal(count,1552);assert.equal(own,22);
 for(const c of associated){const t=taskFor(c),m=visibleBuild(t);accepted(t,m);assert.equal(thinkingGuide(t,c),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:m}]},c),null);}
});

for(const c of cases)test(`${c.id}:${c.index} genuine controls retain incorrect or correct guesses, detours and exact decimal relationships`,()=>{
 const t=taskFor(c),direct=Array.from({length:Math.abs(c.targetShift)},()=>Math.sign(c.targetShift));
 for(const options of [{guess:'-1'},{guess:c.end},{guess:'-1',trace:[1,-1,...direct]}]){
  const m=visibleBuild(t,options),p=accepted(t,m);exact(t,m,p);browserFixture.exact(c,m,p);
  assert.equal(p.display.end,c.end);assert.equal(p.netShift,c.targetShift);assert.equal(p.display.factor,c.factor);
  assert.equal(p.guess.matchesResult,options.guess===c.end);assert.equal(m.guess,m.committed);
  assert.equal(p.leftMoves+p.rightMoves,p.successfulMoves);assert.equal(p.direction,c.direction);
 }
 const original=M.example(t);assert.equal(M.inspect(t,original).correct,true);rejected(t,original);
});

test('every public entry rejects malformed JSON sources without coercion and preserves all legitimate bindings',()=>{
 for(const c of cases){const t=taskFor(c),m=wideShiftEvidenceExample(t),record={attempts:[{value:copy(m)}]},before=JSON.stringify({t,m,record});
  const binding=wideShiftBinding(t,c);assert.ok(binding);assert.ok(thinkingGuide(t,c));assert.ok(thinkingFeedback(t,m,record,c));
  for(const raw of [null,false,[],{}, {sessionId:{toString:null},index:c.index},{sessionId:[c.id],index:c.index},{sessionId:c.id,index:{toString:null}},
   {sessionId:c.id,index:[c.index]},{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:false},{sessionId:c.id,index:-1},{sessionId:c.id,index:0.5}]){
   const context=JSON.parse(JSON.stringify(raw));assert.equal(wideShiftBinding(t,context),null);assert.equal(thinkingGuide(t,context),null);assert.equal(thinkingFeedback(t,m,record,context),null);
  }
  for(const changed of [{...t,prompt:t.prompt+' changed'},{...t,start:t.start+'0'},{...t,step:t.step+1},{...t,mode:'add'},{...t,extra:true}])assert.equal(wideShiftBinding(changed,c),null);
  assert.deepEqual(wideShiftBinding(copy(t),JSON.parse(JSON.stringify(c))),binding);assert.equal(JSON.stringify({t,m,record}),before);
 }
});

test('forged excursions above range, below precision or outside either shift bound remain rejected after return',()=>{
 for(const [id,index,trace]of [
  ['tenpattern',0,[...Array(6).fill(1),...Array(5).fill(-1)]],
  ['decimalscale',0,[...Array(6).fill(-1),...Array(5).fill(1)]],
  ['standardform',0,[...Array(10).fill(-1),...Array(5).fill(1)]],
  ['standardform',1,[...Array(10).fill(1),...Array(6).fill(-1)]]
 ]){const t=at(id,index),m=wideShiftEvidenceExample(t);m.trace=trace;originalOnly(t,m);}
});

test('actual disabled precision and range controls never produce claimed moves, and legal return paths still work',()=>{
 for(const [id,index,delta]of [['tenpattern',0,1],['decimalscale',0,-1]]){
  const t=at(id,index),m=M.initial(t);m.guess='-1';M.act(t,m,'wide-predict');
  while(M.shifted(t.start,m.shift+delta)!==null)M.act(t,m,'wide-move',{delta});
  const tag=[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).find(x=>attrs(x)['data-x']==='wide-move'&&attrs(x)['data-delta']===String(delta));assert.match(tag,/\bdisabled\b/);
  const frozen=copy(m);M.act(t,m,'wide-move',{delta});assert.deepEqual(m,frozen);
  while(m.shift!==t.step)M.act(t,m,'wide-move',{delta:Math.sign(t.step-m.shift)});
  for(const s of wideShiftEvidenceSteps(t).filter(s=>s.field&&s.field!=='guess'))visibleStep(t,m,s);accepted(t,m);
 }
});

test('enabled clicks beyond either shift bound are unrecorded, preserved separately from successful movements',()=>{
 for(const [id,index,delta]of [['standardform',0,-1],['standardform',1,1]]){
  const t=at(id,index),m=M.initial(t);m.guess='-1';M.act(t,m,'wide-predict');for(let i=0;i<9;i++)M.act(t,m,'wide-move',{delta});assert.equal(m.shift,delta*9);
  const tag=[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).find(x=>attrs(x)['data-x']==='wide-move'&&attrs(x)['data-delta']===String(delta));assert.doesNotMatch(tag,/\bdisabled\b/);
  const frozen=copy(m);M.act(t,m,'wide-move',{delta});assert.deepEqual(m,frozen);
  const target=M.targetShift(t);while(m.shift!==target)M.act(t,m,'wide-move',{delta:Math.sign(target-m.shift)});
  for(const s of wideShiftEvidenceSteps(t).filter(s=>s.field&&s.field!=='guess'))visibleStep(t,m,s);const p=accepted(t,m);exact(t,m,p);assert.equal(p.unrecordedClicksAssessed,false);
 }
});

test('all sixty recorded moves survive and the ignored sixty-first click is not fabricated',()=>{
 const t=at('powerpattern',1),trace=[...Array.from({length:29},()=>[1,-1]).flat(),1,1],m=visibleBuild(t,{trace});assert.equal(m.trace.length,60);
 const p=accepted(t,m);assert.equal(p.successfulMoves,60);const frozen=copy(m);M.act(t,m,'wide-move',{delta:-1});assert.deepEqual(m,frozen);assert.deepEqual(replayWideShiftEvidence(t,m),p);
 const forged=copy(m);forged.trace.push(1,-1);rejected(t,forged);
 assert.throws(()=>wideShiftEvidenceExample(t,{trace:[...trace,-1]}),/did not leave/);
});

test('exact six-place precision, endpoint range and scientific normalization are checked without floating tolerances',()=>{
 const synthetic=(start,step,mode='shift')=>({type:'x-wideshift',mode,start,step,prompt:'精确边界检查。'});
 for(const t of [synthetic('0.000001',1),synthetic('10000000',1),synthetic('1',-6),synthetic('100000000',0,'scientific'),synthetic('0.000001',0,'scientific')]){
  const m=wideShiftEvidenceExample(t),p=accepted(t,m);exact(t,m,p);
  for(const value of ['0.0000001','100000000.000001','1e3','+10','1 0','NaN','Infinity']){const bad=copy(m);bad.answer=value;rejected(t,bad);}
 }
 const t=synthetic('1',0),m=wideShiftEvidenceExample(t,{trace:[1,-1]});accepted(t,m);assert.equal(m.factor,'1');
 const zero=wideShiftEvidenceExample(t);rejected(t,zero);
});

test('hidden fields, altered frozen guesses, extra keys and incomplete or stale work never receive strict evidence',()=>{
 for(const c of cases){const t=taskFor(c),m=wideShiftEvidenceExample(t);const mutations=[x=>x.guess='0',x=>x.committed=null,x=>x.trace=[],x=>x.trace[0]=0,
  x=>x.trace[0]='1',x=>x.shift+=1,x=>x.answer='0',x=>x.moves=[1],x=>x.swaps=['up1'],x=>x.u=[1],x=>x.changed=[0],x=>x.extra=true,
  t.mode==='scientific'?x=>x.factor='1':x=>x.exponent='0',t.mode==='scientific'?x=>x.exponent='0':x=>x.direction='wrong'];
  for(const mutate of mutations){const bad=copy(m);mutate(bad);rejected(t,bad);}
  for(const bad of [null,{},[],true])rejected(t,bad);
 }
});

test('all native lessons retain five complete attempts, visible correction, edit expiry and original JSON records',()=>{
 for(const c of cases){const t=taskFor(c),a=freshLesson(c.id);a.index=c.index;const m=modelForLesson(a);assert.equal(submitLesson(a).correct,false);
  for(const s of wideShiftEvidenceSteps(t))visibleStep(t,m,s);const answer=m.answer;m.answer='-999';assert.equal(submitLesson(a).correct,false);
  m.answer=answer;assert.equal(submitLesson(a).correct,true);const first=copy(a.cases[c.index].attempts[2]);assert.ok(thinkingFeedback(t,m,a.cases[c.index],c));
  m.answer='-998';assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);assert.equal(submitLesson(a).correct,false);
  m.answer=answer;visibleStep(t,m,{action:'wide-move',data:{delta:1}});visibleStep(t,m,{action:'wide-move',data:{delta:-1}});assert.equal(submitLesson(a).correct,true);
  assert.deepEqual(a.cases[c.index].attempts.map(x=>M.inspect(t,x.value).correct),[false,false,true,false,true]);assert.deepEqual(a.cases[c.index].attempts[2],first);
  const restored=validateLesson(JSON.parse(JSON.stringify(a)),c.id);assert.ok(restored);assert.deepEqual(restored.models,a.models);assert.deepEqual(restored.cases,a.cases);
  const f=thinkingFeedback(t,m,a.cases[c.index],c);assert.ok(f);assert.equal(f.method,null);assert.match(f.observation,/成功移动/);assert.match(f.detail.join(' '),/工具.*自动画出/);assert.match(f.detail.join(' '),/没有核对每一次点击/);
  assert.doesNotMatch(JSON.stringify(f),/MP\.\d|已掌握|独立完成/);
 }
 console.log('WIDESHIFT_REAL_CONTROL_PROBES',JSON.stringify(probes));
});
