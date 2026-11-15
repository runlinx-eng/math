import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-scalechain-cases.cjs';
import * as M from '../dist/learning/phase5/b18-model.js';
import * as V from '../dist/learning/phase5/b18-view.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {PRACTICE} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {scaleChainBinding as binding,replayScaleChainEvidence as replay} from '../dist/learning/scalechain-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {freshLesson,modelForLesson,submitLesson,supportLesson,currentSubmission,validateLesson,addLessonNote} from '../dist/learning/state.js';
import {fresh,backup,parseBackup} from '../dist/exploration-core.js';

await ensureB39Ready();
const {cases,bridges,practices}=fixture,clone=structuredClone;
const task=c=>sessionTasks(c.id)[c.index],context=c=>({sessionId:c.id,index:c.index});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(v).digest('hex'),hash=t=>digest(JSON.stringify(stable(t)));
const snapshotKeys=['denom','unit','amount','result','decimal'];
const rawSnapshot=f=>Object.fromEntries(snapshotKeys.map(k=>[k,f[k]]));
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const metrics={models:0,fields:0,buttons:0};
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));

// Independent exact arithmetic. Neither the adapter fixture/solver nor the B18
// arithmetic/parser/grader supplies an expected quantity to these functions.
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
function fraction(n,d=1){
 n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}
 const g=gcd(n,d),r=[Number(n/g),Number(d/g)];assert.ok(r.every(Number.isSafeInteger));return r;
}
function sourceNumber(s){
 assert.equal(typeof s,'string');
 const m=s.match(/^([+-]?\d+)(?:\/(\d+)|\.(\d+))?$/);assert.ok(m,'literal source rational');
 if(m[2])return fraction(m[1],m[2]);
 if(m[3]){const sign=m[1].startsWith('-')?-1n:1n,whole=BigInt(m[1]),den=10n**BigInt(m[3].length);
  return fraction(whole*den+sign*BigInt(m[3]),den);}
 return fraction(m[1]);
}
const multiply=(a,b)=>fraction(BigInt(a[0])*BigInt(b[0]),BigInt(a[1])*BigInt(b[1]));
const plus=(a,b,sign=1)=>fraction(BigInt(a[0])*BigInt(b[1])+BigInt(sign)*BigInt(b[0])*BigInt(a[1]),BigInt(a[1])*BigInt(b[1]));
const formatted=r=>r[1]===1?String(r[0]):r.join('/');
function decimal(r){
 const n=BigInt(r[0]),d=BigInt(r[1]);let scale=1n;
 for(let k=0;k<=8;k++,scale*=10n)if(n*scale%d===0n){
  const digits=(n*scale/d).toString().padStart(k+1,'0');
  return k?digits.slice(0,-k)+'.'+digits.slice(-k):digits;
 }
 throw Error('Non-terminating fixture decimal');
}
function oracle(t){
 let current=sourceNumber(t.start);
 return t.stages.map((st,index)=>{
  const before=current,ratio=sourceNumber(st.ratio),amount=multiply(before,ratio);
  current=st.mode==='off'?plus(before,amount,-1):st.mode==='add'?plus(before,amount):amount;
  return {index,label:st.label,mode:st.mode,ratio,before,amount,result:current,
   decimalRequired:!!st.decimal,percent:st.percent??null};
 });
}
function field(t,m,key,value){
 const found=[...V.render(t,m).matchAll(/<(input|select|textarea)\b[^>]*>/g)]
  .filter(x=>attrs(x[0])['data-xfield']===key);
 assert.equal(found.length,1,'actual visible field '+key);assert.doesNotMatch(found[0][0],/\bdisabled\b/);
 m[key]=String(value);M.field(t,m,key);metrics.fields++;return m;
}
function act(t,m,action,index){
 const expected='b18-'+action;
 const found=[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].filter(x=>{
  const a=attrs(x[0]);return a['data-x']===expected&&
   (index===undefined?a['data-index']===undefined:a['data-index']===String(index));
 });
 assert.equal(found.length,1,'actual visible button '+expected+' '+String(index));
 assert.doesNotMatch(found[0][0],/\bdisabled\b/);
 const before=clone(m.history);M.act(t,m,expected,index===undefined?{}:{index});
 assert.equal(m.history.length,before.length+1);assert.deepEqual(m.history.slice(0,-1),before);
 metrics.buttons++;return m;
}
function prepare(t,m,{denominator,denomText,ids,reverse=false}={}){
 const s=oracle(t)[m.board.index];assert.ok(s,'unfinished actual stage');
 const den=denominator??s.ratio[1],count=s.ratio[0]*den/s.ratio[1];
 assert.ok(Number.isInteger(count)&&count>=1&&count<=160);
 field(t,m,'denom',denomText??den);act(t,m,'cut');
 assert.equal(m.board.denom,den);
 const selected=ids??Array.from({length:count},(_,i)=>i);if(reverse&&ids===undefined)selected.reverse();
 for(const id of selected)act(t,m,'piece',id);
 return {stage:s,denominator:den,selected};
}
function fill(t,m,{unit,amount,result,decimalText}={}){
 const s=oracle(t)[m.board.index];assert.ok(s);
 field(t,m,'unit',unit??formatted(fraction(s.before[0],BigInt(s.before[1])*BigInt(m.board.denom))));
 field(t,m,'amount',amount??formatted(s.amount));
 if(s.decimalRequired)field(t,m,'decimal',decimalText??decimal(s.ratio));
 field(t,m,'result',result??formatted(s.result));
}
function finish(t,m=M.initial(t),options={}){
 while(m.board.index<t.stages.length){prepare(t,m,typeof options==='function'?options(m.board.index):options);fill(t,m);act(t,m,'commit');}
 metrics.models++;return m;
}
function accepts(t,m){
 assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
 const before=JSON.stringify(m),p=replay(t,m);assert.ok(p,'strict evidence exists');
 assert.equal(JSON.stringify(m),before,'replay never rewrites a saved model');
 assert.equal(p.eventCount,m.history.length);assert.equal(p.events.length,m.history.length);
 assert.deepEqual(p.events.map(e=>e.historyIndex),m.history.map((_,i)=>i));
 assert.deepEqual(p.events.map(e=>e.fields),m.history.map(e=>rawSnapshot(e.f)));
 assert.deepEqual(p.firstAttempts,m.board.first);
 return p;
}
function rejects(t,m,label){
 const before=JSON.stringify(m);assert.equal(replay(t,m),null,label);assert.equal(JSON.stringify(m),before);
}
const record=m=>({support:false,attempts:[{value:clone(m)}]});
const cAt=(id,index)=>cases.find(c=>c.id===id&&c.index===index);

test('fixed source whitelist contains ten native tasks, twelve stages, four nodes, five bridges and two practices',()=>{
 assert.equal(cases.length,10);assert.equal(cases.reduce((n,c)=>n+c.expectedStages.length,0),12);
 assert.equal(new Set(cases.map(c=>c.nodeId)).size,4);assert.equal(bridges.length,5);assert.equal(practices.length,2);
 assert.equal(Object.keys(M.fields).length,22);
 for(const [file,expected]of Object.entries(fixture.sourceHashes))
  assert.equal(digest(fs.readFileSync(new URL('../'+file,import.meta.url))),expected,file);
 for(const c of [...cases,...bridges,...practices]){
  const t=c.index===-1?PRACTICE[c.id]:task(c);assert.deepEqual(t,c.task);assert.equal(hash(t),c.taskHash);
 }
 const native=[],related=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{if(t.type==='x-scalechain')native.push(id+':'+index);});
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{if(t.type==='x-scalechain')related.push(id+':'+index);});
 assert.deepEqual(native.sort(),cases.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(related.sort(),bridges.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(Object.entries(PRACTICE).filter(([,t])=>t.type==='x-scalechain').map(([id])=>id+':-1').sort(),
  practices.map(c=>c.id+':-1').sort());
});

for(const c of cases){
 test(c.id+':'+c.index+' independently checks every before/unit/amount/result and actual piece identity',()=>{
  const t=task(c),expected=oracle(t);
  assert.deepEqual(sourceNumber(t.start),c.start);assert.equal(t.unit,c.unit);
  assert.equal(LESSONS[c.id].topicId,c.nodeId);assert.equal(binding(t,context(c))?.nodeId,c.nodeId);
  assert.equal(binding(t,context(c)).method,null);
  for(const [i,e]of expected.entries()){
   const fixed=c.expectedStages[i];
   for(const key of ['before','ratio','mode','amount','result','decimalRequired','percent'])assert.deepEqual(e[key],fixed[key],key);
   assert.deepEqual(fraction(e.before[0],BigInt(e.before[1])*BigInt(fixed.denominator)),fixed.pieceValue);
  }
  for(const options of [{},{reverse:true},i=>({denominator:expected[i].ratio[1]*2,reverse:true}),{denominator:100,reverse:true}]){
   const m=finish(t,M.initial(t),options),p=accepts(t,m);
   assert.deepEqual(p.start,c.start);assert.equal(p.unit,c.unit);assert.deepEqual(p.result,c.result);
   assert.equal(p.stages.length,c.expectedStages.length);assert.equal(p.failedRequests.length,0);assert.equal(p.resets.length,0);
   for(const [i,s]of p.stages.entries()){
    for(const k of ['before','ratio','mode','amount','result','decimalRequired'])assert.deepEqual(s[k],expected[i][k],k);
    assert.equal(s.label,t.stages[i].label);assert.equal(s.percent??null,expected[i].percent);
    assert.deepEqual(s.pieceValue,fraction(expected[i].before[0],BigInt(expected[i].before[1])*BigInt(s.denominator)));
    assert.deepEqual(s.selectedIds,m.board.records[i].selected);assert.equal(s.selectedCount,s.selectedIds.length);
    assert.equal(s.selectedCount*expected[i].ratio[1],expected[i].ratio[0]*s.denominator);
    const e=m.history[s.commitHistoryIndex];assert.equal(e.a,'commit');
    assert.deepEqual(s.submitted,rawSnapshot(e.f));
   }
   assert.deepEqual(p.currentFirstAttempts,p.firstAttempts);
  }
 });
 test(c.id+':'+c.index+' wrong first commit survives correction without advancing current whole',()=>{
  const t=task(c),m=M.initial(t);prepare(t,m);fill(t,m,{unit:'999'});const before=clone(m.board);
  act(t,m,'commit');assert.equal(m.board.index,0);assert.deepEqual(m.board.current,before.current);
  assert.deepEqual(m.board.records,[]);assert.ok(m.issue);const first=clone(m.board.first[0]);
  rejects(t,m,'incomplete wrong first commit');finish(t,m);
  const p=accepts(t,m);assert.equal(p.failedRequests.length,1);assert.deepEqual(p.firstAttempts[0],first);
  assert.equal(p.failedRequests[0].action,'commit');assert.deepEqual(p.failedRequests[0].before,p.failedRequests[0].after);
  assert.equal(p.failedRequests[0].accepted,false);assert.ok(p.failedRequests[0].issue);
 });
 test(c.id+':'+c.index+' five real submissions, explicit retries, reset and v2 backup preserve prior attempts',()=>{
  const t=task(c),a=freshLesson(c.id);a.index=c.index;const saved=[];
  const check=correct=>{
   const previous=clone(a.cases[c.index]?.attempts||[]),result=submitLesson(a);
   assert.equal(result.correct,correct);assert.deepEqual(a.cases[c.index].attempts.slice(0,-1),previous);
   saved.push(clone(a.cases[c.index].attempts.at(-1)));
   assert.equal(!!thinkingFeedback(t,a.models[c.index],a.cases[c.index],context(c)),correct);
  };
  a.models[c.index]=M.initial(t);field(t,a.models[c.index],'denom',c.expectedStages[0].denominator);act(t,a.models[c.index],'cut');
  act(t,a.models[c.index],'commit');supportLesson(a);check(false);finish(t,a.models[c.index]);check(true);
  // Original shared retry replaces only the current model; it does not combine histories from different attempts.
  a.models[c.index]=M.initial(t);assert.equal(currentSubmission(a).status,'modified');
  prepare(t,a.models[c.index]);fill(t,a.models[c.index],{unit:'999'});act(t,a.models[c.index],'commit');supportLesson(a);check(false);
  finish(t,a.models[c.index]);check(true);
  const beforeReset=clone(a.models[c.index].history);act(t,a.models[c.index],'reset');finish(t,a.models[c.index]);
  assert.deepEqual(a.models[c.index].history.slice(0,beforeReset.length),beforeReset);
  assert.equal(latestSubmissionMatches(a.models[c.index],a.cases[c.index]),false);
  assert.equal(thinkingFeedback(t,a.models[c.index],a.cases[c.index],context(c)),null);check(true);
  assert.equal(saved.length,5);assert.deepEqual(a.cases[c.index].attempts,saved);
  const restoredLesson=validateLesson(JSON.parse(JSON.stringify(a)),c.id);
  assert.deepEqual(restoredLesson.models,a.models);assert.deepEqual(restoredLesson.cases,a.cases);
  const old=freshLesson('share');modelForLesson(old);submitLesson(old);addLessonNote(old,'保留原来的未完成切分与说明');
  const all=fresh();all.lessons[c.id]=a;all.lessons.share=old;all.lessonContinuation=c.id;
  const pack=backup(all);assert.equal(pack.version,2);const original=JSON.stringify(all);
  const imported=parseBackup(JSON.stringify(pack),atlas);
  assert.equal(JSON.stringify(all),original);assert.deepEqual(imported.lessons[c.id],a);assert.deepEqual(imported.lessons.share,old);
  assert.deepEqual(imported.lessons[c.id].cases[c.index].attempts,saved);
 });
}

test('45 off20% then add10% uses 36 as the new whole; the mistaken 4.5 is kept before correction to 3.6',()=>{
 const c=cAt('portionoperator',2),t=task(c),m=M.initial(t);
 prepare(t,m);fill(t,m);act(t,m,'commit');assert.deepEqual(m.board.current,[36,1]);
 prepare(t,m);fill(t,m,{unit:'4.5',amount:'4.5',result:'40.5'});act(t,m,'commit');
 assert.equal(m.board.index,1);assert.deepEqual(m.board.current,[36,1]);assert.equal(m.board.records.length,1);
 const first=clone(m.board.first[1]);assert.equal(first.amount,'4.5');
 fill(t,m,{unit:'3.6',amount:'3.6',result:'39.6'});act(t,m,'commit');
 assert.deepEqual(m.board.current,[198,5]);finish(t,m);
 const p=accepts(t,m);assert.deepEqual(p.stages.map(s=>s.before),[[45,1],[36,1],[198,5]]);
 assert.deepEqual(p.stages.map(s=>s.result),[[36,1],[198,5],[99,5]]);
 assert.deepEqual(p.firstAttempts[1],first);assert.equal(p.failedRequests.length,1);
 assert.equal(p.stages[1].submitted.amount,'3.6');
});

test('off and add distinguish the change from the final quantity, including repeated failed requests',()=>{
 for(const [id,index,wrong,expected]of [['pctNames37',3,'10',[30,1]],['pctFraction37',3,'20',[120,1]],['pctFraction37',4,'10',[90,1]]]){
  const t=task(cAt(id,index)),m=M.initial(t);prepare(t,m);fill(t,m,{result:wrong});
  act(t,m,'commit');act(t,m,'commit');assert.equal(m.board.index,0);assert.equal(m.board.records.length,0);
  const first=clone(m.board.first[0]);fill(t,m);act(t,m,'commit');const p=accepts(t,m);
  assert.deepEqual(p.result,expected);assert.equal(p.failedRequests.length,2);assert.deepEqual(p.firstAttempts[0],first);
  assert.ok(p.failedRequests.every(e=>e.stageIndex===0&&e.before.recordCount===0&&e.after.recordCount===0));
 }
});

test('all 28 six-of-eight selections for 150% are valid, including three pieces from each whole',()=>{
 for(const c of [cAt('portionoperator',3),cAt('pctFraction37',2)]){
  const t=task(c);
  for(let omittedA=0;omittedA<8;omittedA++)for(let omittedB=omittedA+1;omittedB<8;omittedB++){
   const ids=Array.from({length:8},(_,i)=>i).filter(i=>i!==omittedA&&i!==omittedB).reverse();
   const m=M.initial(t);prepare(t,m,{denominator:4,ids});fill(t,m);act(t,m,'commit');const p=accepts(t,m);
   assert.deepEqual(p.stages[0].selectedIds,ids);assert.deepEqual(p.stages[0].pieceValue,[50,1]);
   assert.deepEqual(p.stages[0].amount,[300,1]);assert.deepEqual(p.result,[300,1]);
  }
  for(const count of [5,7]){const m=M.initial(t);prepare(t,m,{denominator:4,ids:Array.from({length:count},(_,i)=>i)});fill(t,m);act(t,m,'commit');
   assert.equal(m.board.index,0);rejects(t,m,'150% requires six quarter-pieces');finish(t,m);assert.equal(accepts(t,m).failedRequests.length,1);}
 }
});

test('real selection cancellation and successful repartition retain the old events without requiring first-frame filling',()=>{
 const t=task(cAt('portionoperator',3)),m=M.initial(t);
 prepare(t,m,{denominator:4,ids:[7,0,6,1,5,2]});act(t,m,'piece',7);act(t,m,'piece',7);
 const old=clone(m.history);field(t,m,'denom','8');act(t,m,'cut');assert.deepEqual(m.board.selected,[]);
 for(const i of [15,0,14,1,13,2,12,3,11,4,10,5])act(t,m,'piece',i);
 fill(t,m);act(t,m,'commit');const p=accepts(t,m);
 assert.deepEqual(m.history.slice(0,old.length),old);assert.equal(p.stages[0].selectedCount,12);
 assert.deepEqual(p.stages[0].pieceValue,[25,1]);assert.equal(p.failedRequests.length,0);
});

test('invalid recuts preserve the earlier construction; later correction keeps all failure requests',()=>{
 const t=task(cAt('pctNames37',3)),m=M.initial(t);prepare(t,m);
 const board=clone(m.board);
 for(const denominator of ['0','101','3','4.5','','Infinity','NaN']){
  field(t,m,'denom',denominator);act(t,m,'cut');assert.deepEqual(m.board,board);assert.ok(m.issue);
 }
 field(t,m,'denom','4');fill(t,m);act(t,m,'commit');const p=accepts(t,m);
 assert.equal(p.failedRequests.length,7);assert.ok(p.failedRequests.every(e=>e.action==='cut'&&!e.accepted));
 assert.ok(p.failedRequests.every(e=>JSON.stringify(e.before)===JSON.stringify(e.after)));
 assert.equal(p.stages[0].selectedCount,1);
});

test('reset at index zero retains input text and cross-reset first attempt while new construction has its own first attempt',()=>{
 const t=task(cAt('pctNames37',3)),m=M.initial(t);prepare(t,m);fill(t,m,{result:'10'});act(t,m,'commit');
 const before=clone(m),first=clone(m.board.first);act(t,m,'reset');
 assert.deepEqual(rawSnapshot(m),rawSnapshot(before));assert.deepEqual(m.board.first,first);assert.deepEqual(m.board.records,[]);
 assert.doesNotMatch(V.controls(t,m),/data-xfield="(?:unit|amount|result|decimal)"/);
 finish(t,m);const p=accepts(t,m);assert.deepEqual(p.firstAttempts,first);
 assert.equal(p.firstAttempts[0].result,'10');assert.equal(p.currentFirstAttempts[0].result,'30');
 assert.deepEqual(p.resets[0].automaticFieldsCleared,[]);assert.equal(p.stages.length,1);
 assert.deepEqual(m.history.slice(0,before.history.length),before.history);
});

test('reset after an advanced stage clears five fields, retains earliest errors and rebuilds only current completed stages',()=>{
 const t=task(cAt('portionoperator',2)),m=M.initial(t);prepare(t,m);fill(t,m);act(t,m,'commit');
 prepare(t,m);fill(t,m,{unit:'4.5',amount:'4.5',result:'40.5'});act(t,m,'commit');const first=clone(m.board.first),before=clone(m.history);
 act(t,m,'reset');assert.equal(m.board.index,0);assert.deepEqual(m.board.current,[45,1]);assert.deepEqual(m.board.first,first);
 for(const k of snapshotKeys)assert.equal(m[k],'');
 finish(t,m);const p=accepts(t,m);assert.deepEqual(p.firstAttempts.slice(0,2),first);
 assert.equal(p.firstAttempts[1].amount,'4.5');assert.equal(p.currentFirstAttempts[1].amount,'18/5');
 assert.equal(p.stages.length,3);assert.deepEqual(p.stages.map(s=>s.before),[[45,1],[36,1],[198,5]]);
 assert.deepEqual(p.resets[0].automaticFieldsCleared.slice().sort(),snapshotKeys.slice().sort());
 assert.deepEqual(m.history.slice(0,before.length),before);assert.equal(p.failedRequests.length,1);
});

test('empty and complete resets are visible real controls, keep all events, and never invent a completed stage',()=>{
 const t=task(cAt('portionoperator',0)),m=M.initial(t);act(t,m,'reset');act(t,m,'reset');
 finish(t,m);const prior=clone(m.board.first),before=clone(m.history);act(t,m,'reset');
 assert.deepEqual(m.board.first,prior);assert.equal(M.inspect(t,m).correct,false);rejects(t,m,'reset unfinished');
 finish(t,m);const p=accepts(t,m);assert.equal(p.resets.length,3);assert.equal(p.stages.length,1);
 assert.deepEqual(m.history.slice(0,before.length),before);assert.deepEqual(p.firstAttempts,prior);
});

test('Number-normalized denominator aliases 0x4 and 5e0 retain literal input without asserting exact textual integer notation',()=>{
 for(const [id,index,text,den]of [['portionoperator',0,'0x4',4],['portionoperator',1,'5e0',5],['pctNames37',3,' +004 ',4]]){
  const t=task(cAt(id,index)),m=M.initial(t);prepare(t,m,{denominator:den,denomText:text});fill(t,m);act(t,m,'commit');
  const p=accepts(t,m);assert.equal(p.stages[0].denominator,den);assert.equal(p.stages[0].submitted.denom,text);
  assert.equal(p.firstAttempts[0].denom,text);
 }
});

test('the original rejected .2 and other wrong percentage names remain failures before exact 0.20 correction',()=>{
 const t=task(cAt('portionoperator',1)),m=M.initial(t);prepare(t,m);
 for(const s of ['.2','20','20%','2e-1','0.200000001','0.2 0']){
  fill(t,m,{decimalText:s});act(t,m,'commit');assert.equal(m.board.index,0);assert.ok(m.issue);
 }
 const first=clone(m.board.first);fill(t,m,{decimalText:'0.20'});act(t,m,'commit');const p=accepts(t,m);
 assert.equal(p.failedRequests.length,6);assert.deepEqual(p.firstAttempts,first);
 assert.equal(p.firstAttempts[0].decimal,'.2');assert.equal(p.stages[0].submitted.decimal,'0.20');
 assert.deepEqual(p.stages[0].ratio,[1,5]);
});

test('exact fractional, mixed and decimal amounts can be submitted without being treated as independent calculation events',()=>{
 const t=task(cAt('portionoperator',2)),m=M.initial(t);
 prepare(t,m);fill(t,m,{unit:'+09.000',amount:'18/2',result:'72/2',decimalText:'00.200'});act(t,m,'commit');
 prepare(t,m);fill(t,m,{unit:'3 3/5',amount:'36/10',result:'39 3/5',decimalText:'0.10'});act(t,m,'commit');
 prepare(t,m);fill(t,m,{unit:'19.8',amount:'19 4/5',result:'99/5'});act(t,m,'commit');
 const p=accepts(t,m);assert.deepEqual(p.result,[99,5]);assert.equal(p.stages[1].submitted.amount,'36/10');
 assert.equal(p.stages[2].submitted.unit,'19.8');assert.ok(p.systemGenerated);assert.ok(p.assessmentLimits);
});

test('original amount precision, denominator and text limits preserve rejected requests without rounding exact quantities',()=>{
 const t=task(cAt('portionoperator',0)),m=M.initial(t);prepare(t,m);
 // All three strings denote fifty exactly in unrestricted rational arithmetic,
 // but the original input contract rejects their precision or raw bounds.
 for(const unit of ['50.000000000','5000000050/100000001','50000000000000/1000000000000']){
  fill(t,m,{unit});act(t,m,'commit');assert.equal(m.board.index,0);assert.ok(m.issue);
 }
 fill(t,m,{unit:'5000000000/100000000',amount:'150.00000000',result:'15000000000/100000000'});act(t,m,'commit');
 const p=accepts(t,m);assert.equal(p.failedRequests.length,3);assert.deepEqual(p.result,[150,1]);
 assert.equal(p.stages[0].submitted.unit,'5000000000/100000000');
 const zeros=M.initial(t);prepare(t,zeros);fill(t,zeros,{unit:'0'.repeat(998)+'50'});act(t,zeros,'commit');
 assert.equal(accepts(t,zeros).stages[0].submitted.unit.length,1000);
 const tooLong=M.initial(t);prepare(t,tooLong);fill(t,tooLong,{unit:'0'.repeat(999)+'50'});
 const before=clone(tooLong.history);M.act(t,tooLong,'b18-commit');
 assert.deepEqual(tooLong.history,before,'original serial limit rejects the oversized event');
 assert.equal(M.valid(t,tooLong),false);rejects(t,tooLong,'1001-character saved field');
});

test('1200 recorded actions are a finite receipt; later ignored controls cannot be claimed as newly recorded learning',()=>{
 const t=task(cAt('portionoperator',0)),m=M.initial(t);
 const resetMany=(model,count)=>{
  assert.match(V.render(t,model),/data-x="b18-reset"/);
  for(let i=0;i<count;i++){
   const before=model.history.length;M.act(t,model,'b18-reset');assert.equal(model.history.length,before+1);metrics.buttons++;
  }
  assert.ok(model.history.every(e=>e.a==='reset'&&JSON.stringify(e)===JSON.stringify(model.history[0])));
 };
 // The remaining original controls are cut, three piece toggles and commit.
 resetMany(m,1195);finish(t,m);const p=accepts(t,m);assert.equal(p.eventCount,1200);
 assert.equal(p.resets.length,1195);assert.equal(p.assessmentLimits.recordingLimit,1200);
 assert.equal(p.assessmentLimits.allLaterClicksRecorded,false);
 const before=clone(m);M.act(t,m,'b18-reset');assert.deepEqual(m,before);accepts(t,m);
 const stuck=M.initial(t);resetMany(stuck,1196);prepare(t,stuck);fill(t,stuck);
 const old=clone(stuck);M.act(t,stuck,'b18-commit');assert.deepEqual(stuck,old);
 assert.equal(M.inspect(t,stuck).correct,false);rejects(t,stuck,'history cap cannot invent a successful commit');
 const forged=clone(m);forged.history.push(clone(m.history[0]));rejects(t,forged,'1201 recorded actions');
});

test('invisible commits/pieces, completed controls and cross-widget events cannot be legitimized by reset',()=>{
 const t=task(cAt('portionoperator',0));
 for(const [action,data]of [['commit',{}],['piece',{index:'0'}],['new-groups',{}],['save',{}],['start',{}],['split',{}],['normalize',{}]]){
  const m=M.initial(t);M.act(t,m,'b18-'+action,data);act(t,m,'reset');finish(t,m);
  assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejects(t,m,'unavailable '+action);
 }
 for(const action of ['cut','piece','commit']){
  const m=finish(t);assert.doesNotMatch(V.controls(t,m),/data-x="b18-(?:cut|piece|commit)"/);
  M.act(t,m,'b18-'+action,action==='piece'?{index:'0'}:{});rejects(t,m,'completed hidden '+action);
 }
});

test('piece IDs must be the exact visible dataset spelling, not Number-equivalent or out-of-range text',()=>{
 const t=task(cAt('pctNames37',3));
 for(const index of ['01','1.0','+1','1e0','0x1',' 1 ','-0','-1','4','NaN','Infinity']){
  const m=M.initial(t);field(t,m,'denom','4');act(t,m,'cut');M.act(t,m,'b18-piece',{index});
  // Complete with a fresh legal cut so a forged earlier event cannot be hidden by a successful result.
  finish(t,m);assert.equal(M.valid(t,m),true);rejects(t,m,'non-rendered index '+index);
 }
 for(const action of ['cut','reset','commit']){
  const m=M.initial(t);M.act(t,m,'b18-'+action,{index:'0'});act(t,m,'reset');finish(t,m);
  rejects(t,m,'button with invented dataset index '+action);
 }
});

test('hidden fields before cut, during reset and after completion cannot change without a visible control',()=>{
 const t=task(cAt('portionoperator',0));
 for(const key of Object.keys(M.fields).filter(k=>k!=='denom')){
  const m=M.initial(t);m[key]='9';finish(t,m);assert.equal(M.valid(t,m),true);rejects(t,m,'hidden initial '+key);
 }
 const base=finish(t);
 for(const key of Object.keys(M.fields)){const m=clone(base);m[key]='1';assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejects(t,m,'hidden final '+key);}
 const reset=M.initial(t);prepare(t,reset);fill(t,reset);act(t,reset,'reset');
 reset.unit='999';finish(t,reset);rejects(t,reset,'hidden preserved field changed after reset before recut');
});

test('exact keys, replayed first/records and original issue cannot be replaced by a successful final board',()=>{
 const t=task(cAt('portionoperator',2)),m=finish(t);
 const mutations=[
  x=>x.extra=true,x=>x.board.extra=true,x=>x.board.first[0].extra=true,x=>x.board.records[0].extra=true,
  x=>x.history[0].extra=true,x=>x.history[0].d.extra='0',x=>x.history[0].f.extra='',
  x=>delete x.history[0].f.story,x=>x.history[0].f.denom=5,x=>x.history[0].d.index=0,
  x=>x.history[0].a='unknown',x=>x.history=[],x=>x.history=null,
  x=>x.board.first[0].amount='999',x=>x.board.records[0].unit='999',
  x=>x.board.records[0].selected=[1],x=>x.board.current=[99,1],
  x=>x.board.index=2,x=>x.issue='invented issue'
 ];
 for(const change of mutations){const n=clone(m);change(n);assert.notDeepEqual(n,m,'the mutation changes the saved model');rejects(t,n,String(change));}
 const n=clone(m);n.history=[...m.history.slice(1)];rejects(t,n,'missing real cut');
 const many=task(cAt('portionoperator',3)),selected=finish(many);
 selected.board.records[0].selected.reverse();rejects(many,selected,'changed actual multi-piece selection order');
});

test('all public native bindings require the exact complete source and raw context types',()=>{
 for(const c of cases){
  const t=task(c),m=finish(t);assert.ok(binding(clone(t),context(c)));
  for(const invalid of [null,[],true,1,c.id,{}, {sessionId:[],index:0},{sessionId:{toString:null},index:0},
   {sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},{sessionId:c.id,index:999},
   {sessionId:'__proto__',index:0},{sessionId:'constructor',index:0}]){
   assert.equal(binding(t,invalid),null);assert.equal(thinkingGuide(t,invalid),null);
   assert.equal(thinkingFeedback(t,m,record(m),invalid),null);
  }
  for(const change of [x=>x.start='201',x=>x.unit+='changed',x=>x.prompt+='changed',
   x=>x.stages[0].label+='changed',x=>x.stages[0].ratio='1/3',x=>x.stages[0].mode='additive',
   x=>x.extra=true,x=>x.stages[0].extra=true]){
   const n=clone(t);change(n);assert.equal(binding(n,context(c)),null);rejects(n,m,'changed complete source fingerprint');
  }
 }
});

test('five same-widget bridges and two retained practice positions stay isolated even when exact native clones',()=>{
 for(const c of [...bridges,...practices]){
  const t=c.index===-1?PRACTICE[c.id]:task(c),m=finish(t);accepts(t,m);
  assert.equal(binding(t,context(c)),null);assert.equal(thinkingGuide(t,context(c)),null);
  assert.equal(thinkingFeedback(t,m,record(m),context(c)),null);
 }
});

test('source-bound feedback describes the current whole and bounded records, never MP mastery or child-drawn system partitions',()=>{
 for(const c of cases){
  const t=task(c),m=finish(t),r=record(m),before=JSON.stringify(r),feedback=thinkingFeedback(t,m,r,context(c));
  assert.ok(thinkingGuide(t,context(c))?.question);assert.ok(feedback);assert.equal(feedback.method,null);
  const text=JSON.stringify(feedback);assert.match(text,/整体/);assert.match(text,/系统|工具显示/);assert.match(text,/长期掌握/);
  assert.doesNotMatch(text,/MP\.\d|你已掌握|已经掌握|你独立画|你独立计算/);
  assert.equal(JSON.stringify(r),before);assert.equal(thinkingFeedback(t,m,{attempts:[]},context(c)),null);
  const previous=clone(r.attempts);act(t,m,'reset');finish(t,m);
  assert.equal(thinkingFeedback(t,m,r,context(c)),null,'same final quantity after real reset is a different full snapshot');
  r.attempts.push({value:clone(m)});assert.ok(thinkingFeedback(t,m,r,context(c)));
  assert.deepEqual(r.attempts.slice(0,-1),previous);
 }
});

test('money feedback uses exact cents where possible and keeps finer-than-cent piece values as exact fractions',()=>{
 const c=cAt('portionoperator',2),t=task(c);
 const m=finish(t,M.initial(t),{denominator:30}),feedback=thinkingFeedback(t,m,record(m),context(c));
 assert.ok(feedback);assert.match(feedback.observation,/以 45\.00元 为整体/);
 assert.match(feedback.observation,/每份 1\.50元/);assert.match(feedback.observation,/以 36\.00元 为整体/);
 assert.match(feedback.observation,/每份 1\.20元/);assert.match(feedback.observation,/取出 3\.60元/);
 assert.match(feedback.observation,/得到 39\.60元/);assert.match(feedback.observation,/每份 1\.32元/);
 assert.match(feedback.observation,/得到 19\.80元/);
 const fine=finish(t,M.initial(t),{denominator:40}),fineFeedback=thinkingFeedback(t,fine,record(fine),context(c));
 assert.ok(fineFeedback);assert.deepEqual(accepts(t,fine).stages[0].pieceValue,[9,8]);
 assert.match(fineFeedback.observation,/每份 9\/8元/);assert.doesNotMatch(fineFeedback.observation,/1\.12元|1\.13元/);
 assert.match(fineFeedback.observation,/每份 0\.90元/);assert.match(fineFeedback.observation,/每份 0\.99元/);
});

test('malformed task/model input and a forged terminal issue fail closed without changing original grading',()=>{
 const t=task(cAt('portionoperator',0)),m=finish(t);
 for(const n of [null,{},[],true,42,{...t,stages:null},{...t,type:'x-fracshare'},{...t,extra:true}])rejects(n,m,'malformed source');
 for(const n of [null,{},[],true,42,{...m,board:null},{...m,board:{...m.board,first:null}}])rejects(t,n,'malformed model');
 const bad=M.initial(t);field(t,bad,'denom','3');act(t,bad,'cut');bad.issue='';finish(t,bad);
 // The erased earlier transient issue is not immutable event state. Only the
 // current issue can be checked; this does not claim hidden UI timing is known.
 accepts(t,bad);
 const terminal=clone(m);terminal.issue='old failure';assert.equal(M.valid(t,terminal),true);
 assert.equal(M.inspect(t,terminal).correct,true);rejects(t,terminal,'current issue does not match replay');
});

test.after(()=>console.log('P9_SCALECHAIN_INDEPENDENT_NODE '+JSON.stringify({...metrics,nativeTasks:cases.length,
 nativeStages:cases.reduce((n,c)=>n+c.expectedStages.length,0),associatedTasks:bridges.length,practicePositions:practices.length,
 actualChromium:false,childLearningAssessed:false})));
