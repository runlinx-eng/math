import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import reviewed from './fixtures/p9-fraction-operations-cases.cjs';
import browserPlan from './p9-fraction-operations-adapter-browser.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as F from '../dist/learning/phase5/b17-model.js';
import * as V from '../dist/learning/phase5/b17-view.js';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,supportLesson,validateLesson} from '../dist/learning/state.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {fractionOperationsBinding as binding,replayFractionOperationsEvidence as replay} from '../dist/learning/fraction-operations-evidence.js';

await ensureB39Ready();
const {cases,associated}=reviewed,copy=x=>structuredClone(x),context=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),taskHash=t=>digest(JSON.stringify(stable(t)));
const at=(index,id='fractionfour')=>sessionTasks(id)[index],ids=n=>Array.from({length:n},(_,i)=>i).reverse();
const probes={actions:0,fields:0,submissions:0};
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const buttons=(t,m)=>[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].map(m=>({tag:m[0],data:attrs(m[0])}));
function change(t,m,key,value){
 const html=V.render(t,m),tag=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(m=>m[0]).find(s=>attrs(s)['data-xfield']===key);
 assert.ok(tag,`actual V.render exposes field ${key}`);
 if(tag.startsWith('<select')){
  const select=html.slice(html.indexOf(tag),html.indexOf('</select>',html.indexOf(tag)));
  assert.ok(select.includes(`value="${value}"`),`actual select offers ${key}=${value}`);
 }
 m[key]=String(value);F.field(t,m,key);probes.fields++;return m;
}
function click(t,m,name,data={}){
 const button=buttons(t,m).find(b=>b.data['data-x']==='b17-'+name&&Object.entries(data).every(([k,v])=>b.data['data-'+k]===String(v)));
 assert.ok(button,`actual V.render exposes ${name} ${JSON.stringify(data)}`);
 assert.doesNotMatch(button.tag,/\bdisabled\b/);
 const length=m.history.length;F.act(t,m,'b17-'+name,data);probes.actions++;
 assert.equal(m.history.length,length+1);assert.equal(F.valid(t,m),true,'original replay validates every intermediate event');return m;
}
function start(t,m,options={}){
 if(!m.board.prediction){change(t,m,'prediction',options.prediction||'negative');click(t,m,'predict-op');}
 if(!m.board.forms){
  change(t,m,'aform',options.forms?.[0]||F.ftext(F.frac(t.a)));
  change(t,m,'bform',options.forms?.[1]||F.ftext(F.frac(t.b)));click(t,m,'forms');
 }
 return m;
}
function construct(t,m,options={}){
 const [aa,bb]=m.board.forms;
 if(t.op==='*'){
  for(const index of options.columns||ids(aa[0]))click(t,m,'column',{index});
  for(const index of options.rows||ids(bb[0]))click(t,m,'row',{index});
 }else{
  const D=options.denominator||F.lcm(aa[1],bb[1]);change(t,m,'denom',options.denomText||D);click(t,m,'common');
  for(const [row,r]of[['left',aa],['right',bb]])for(const index of options[row]||ids(r[0]*D/r[1]))click(t,m,'shade',{row,index});
  finishConstruction(t,m);
 }
 return m;
}
function finishConstruction(t,m){
 if(t.op==='/'){
  const [a,b]=m.board.forms.map(([n,d])=>n*m.board.denom/d);
  for(let i=m.board.fits;i<Math.floor(a/b);i++)click(t,m,'fit');click(t,m,'rest');
 }else if(t.op!=='*')click(t,m,'combine');
 return m;
}
function answers(t,m){
 const result=F.operation(t);
 if(t.op==='/'){
  change(t,m,'whole',Math.floor(result[0]/result[1]));change(t,m,'part',`${result[0]%result[1]}/${result[1]}`);
 }
 change(t,m,'answer',F.ftext(result));change(t,m,'reason',t.op==='*'?'scale':t.op==='/'?'groups':'same-parts');return m;
}
const solve=(t,m=F.initial(t),options={})=>answers(t,construct(t,start(t,m,options),options));
const original=(t,m)=>{assert.equal(F.valid(t,m),true);assert.equal(F.inspect(t,m).correct,true);};
function accepts(t,m){
 original(t,m);const before=JSON.stringify(m),proof=replay(t,m);assert.ok(proof);assert.equal(JSON.stringify(m),before);
 assert.deepEqual(replay(t,JSON.parse(before)),proof);assert.deepEqual(JSON.parse(JSON.stringify(proof)),proof);return proof;
}
const rejects=(t,m)=>assert.equal(replay(t,m),null);
function submit(a){probes.submissions++;return submitLesson(a);}
function roundTrip(t,m){
 const b=m.board;
 if(t.op==='*'){const index=b.columns.at(-1);click(t,m,'column',{index});click(t,m,'column',{index});}
 else{const index=b.left.at(-1);click(t,m,'shade',{row:'left',index});click(t,m,'shade',{row:'left',index});finishConstruction(t,m);}
 return m;
}

test('fixed source fingerprints and complete task hashes identify exactly ten native positions and three nodes',()=>{
 for(const [file,sha]of Object.entries(reviewed.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 assert.equal(cases.length,10);assert.equal(new Set(cases.map(c=>c.nodeId)).size,3);
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index];assert.equal(taskHash(t),c.taskHash);assert.equal(t.a,c.a);assert.equal(t.b,c.b);assert.equal(t.op,c.op);
  assert.equal(LESSONS[c.id].topicId,c.nodeId);assert.equal(binding(t,context(c)).nodeId,c.nodeId);
  assert.equal(binding(t,context(c)).method,null);assert.match(binding(t,context(c)).question,/[？?]/);
 }
});

test('native binding does not inherit across bridges, wrappers, task edits or malformed JSON contexts',()=>{
 const natives=[],bridges=[],wrapped={native:0,associated:0};
 for(const [catalog,out]of[[LESSONS,natives],[BRIDGES,bridges]])for(const id of Object.keys(catalog))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-fracoperations')out.push(id+':'+index);
  const bind=binding(t,{sessionId:id,index});
  if(bind)assert.ok(cases.some(c=>c.id===id&&c.index===index));
  if(t.type==='x-fractioncase'){wrapped[catalog===LESSONS?'native':'associated']++;assert.equal(bind,null);}
 });
 assert.deepEqual(natives.sort(),cases.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(bridges.sort(),associated.map(c=>c.id+':'+c.index).sort());assert.deepEqual(wrapped,reviewed.wrappedCandidates);
 const t=at(0);
 for(const ctx of [null,[],42,'fractionfour',{}, {sessionId:{toString:null},index:0},{sessionId:'fractionfour',index:'0'},
  {sessionId:'fractionfour',index:-1},{sessionId:'fractionfour',index:99},{sessionId:'__proto__',index:0}])assert.equal(binding(t,ctx),null);
 assert.equal(binding({...t,prompt:t.prompt+' changed'},{sessionId:'fractionfour',index:0}),null);
});

for(const c of cases)test(`${c.id}:${c.index} uses actual fields, enabled controls and five unmodified submission snapshots`,()=>{
 const t=sessionTasks(c.id)[c.index],a=freshLesson(c.id);a.index=c.index;const m=modelForLesson(a);supportLesson(a);solve(t,m);
 const p=accepts(t,m);assert.deepEqual(p.quantities.result,c.result);
 assert.equal(p.firstPrediction,'negative');assert.equal(p.currentPrediction,'negative');assert.equal(p.predictionAttribution,'recorded-field');
 assert.equal(p.independentExplanationAssessed,false);assert.equal(p.events.length,m.history.length);
 assert.deepEqual(p.events.map(e=>e.index),m.history.map((_,i)=>i));
 if(c.denominator){
  assert.equal(p.common.denominator,c.denominator);assert.deepEqual(p.common.counts,c.counts);assert.deepEqual(p.common.unit,[1,c.denominator]);
  assert.equal(new Set(p.common.left).size,c.counts[0]);assert.equal(new Set(p.common.right).size,c.counts[1]);
  if(t.op==='/'){
   const d=p.division;assert.equal(d.wholeGroups*d.groupPieces+d.remainingPieces,d.originalPieces);
   assert.ok(d.remainingPieces>=0&&d.remainingPieces<d.groupPieces);assert.equal(d.fitIndices.length,d.wholeGroups);
  }else assert.equal(p.combination.resultCount,t.op==='+'?c.counts[0]+c.counts[1]:c.counts[0]-c.counts[1]);
 }else{
  assert.equal(p.product.cellCount,c.counts[0]*c.counts[1]);assert.equal(p.product.cellArea[0],1);
  assert.equal(p.product.cellCount*c.result[1],c.result[0]*p.product.cellArea[1]);
 }
 change(t,m,'answer','999');assert.equal(submit(a).correct,false);assert.equal(currentSubmission(a).status,'revise');rejects(t,m);
 answers(t,m);assert.equal(submit(a).correct,true);assert.equal(currentSubmission(a).status,'correct');
 change(t,m,'answer','998');assert.equal(currentSubmission(a).status,'modified');assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);
 assert.equal(submit(a).correct,false);answers(t,m);assert.equal(submit(a).correct,true);
 const beforeBoard=copy(m.board),previous=copy(a.cases[c.index].attempts.at(-1).value);roundTrip(t,m);
 assert.deepEqual(m.board,beforeBoard);assert.equal(currentSubmission(a).status,'modified');
 assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);assert.deepEqual(a.cases[c.index].attempts.at(-1).value,previous);
 assert.equal(submit(a).correct,true);assert.equal(currentSubmission(a).status,'correct');accepts(t,m);
 const attempts=a.cases[c.index].attempts;assert.equal(attempts.length,5);assert.equal(new Set(attempts.map(x=>x.id)).size,5);
 assert.deepEqual(attempts.map(x=>x.exposed),[false,true,true,true,true]);assert.ok(attempts.every(x=>x.supported));
 assert.deepEqual(attempts.at(-1).value,m);assert.deepEqual(validateLesson(JSON.parse(JSON.stringify(a)),c.id).models[c.index],m);
});

test('associated arithmetic work is valid mathematics but does not acquire a native binding',()=>{
 for(const c of associated){const t=sessionTasks(c.id)[c.index],m=solve(t);accepts(t,m);assert.equal(binding(t,context(c)),null);}
});

test('alternative common units conserve both original quantities without requiring contiguous identities',()=>{
 const t=at(0),m=solve(t,undefined,{denominator:24,denomText:'+24.0',left:ids(18).map(i=>i+3),right:ids(16).map(i=>i+5)}),p=accepts(t,m);
 assert.deepEqual(p.common.counts,[18,16]);assert.deepEqual(p.common.unit,[1,24]);assert.equal(p.combination.resultCount,34);
 assert.equal(p.common.left.length*4,p.common.denominator*3);assert.equal(p.common.right.length*3,p.common.denominator*2);
});

test('unreduced multiplication forms and scattered rows describe intersection area, not a claimed rectangle',()=>{
 const t=at(2),m=solve(t,undefined,{forms:['6/8','4/6'],columns:[0,1,2,4,6,7],rows:[0,2,4,5]}),p=accepts(t,m);
 assert.deepEqual(p.forms,[[6,8],[4,6]]);assert.deepEqual(p.product.cellArea,[1,48]);assert.equal(p.product.cellCount,24);
 assert.deepEqual(p.product.area,[1,2]);assert.equal(p.product.contiguousColumns,false);assert.equal(p.product.contiguousRows,false);
 assert.equal(p.common,null);assert.equal(p.combination,null);assert.equal(p.division,null);
});

test('valid repeated combine and rest confirmations retain their event indices without inventing new construction',()=>{
 for(const index of [0,3]){
  const t=at(index),m=solve(t),name=t.op==='/'?'rest':'combine';click(t,m,name);click(t,m,name);const p=accepts(t,m);
  assert.equal(p.events.at(-1).effect,false);assert.equal(p.events.at(-2).effect,false);
  assert.equal((p.division?.restIndices||p.combination.combineIndices).length,3);
  if(p.division)assert.equal(p.division.fitIndices.length,p.division.wholeGroups);
 }
});

test('current construction indices exclude old fits, rests and combines invalidated by common or shading',()=>{
 for(const index of [0,3,7]){
  const t=at(index),m=solve(t),old=accepts(t,m),oldLength=m.history.length,D=m.board.denom*2;
  construct(t,m,{denominator:D});answers(t,m);const next=accepts(t,m);
  assert.equal(next.events.length,m.history.length);assert.ok(next.events.some(e=>e.index<oldLength&&['fit','rest','combine'].includes(e.action)));
  const current=next.division?[...next.division.fitIndices,...next.division.restIndices]:next.combination.combineIndices;
  assert.ok(current.every(i=>i>next.constructionAfterIndex&&i>=oldLength));
  if(next.division){assert.equal(next.division.fitIndices.length,next.division.wholeGroups);assert.equal(next.division.groupPieces,old.division.groupPieces*2);}
  const preRoundTrip=m.history.length;roundTrip(t,m);const final=accepts(t,m);
  assert.ok((final.division?.fitIndices||final.combination.combineIndices).every(i=>i>=preRoundTrip));
  if(final.division)assert.equal(final.division.fitIndices.length,final.division.wholeGroups);
 }
});

test('same common-unit confirmation can be a legitimate no-change event but cannot preserve prior construction',()=>{
 const t=at(0),m=F.initial(t);start(t,m);change(t,m,'denom','12');click(t,m,'common');click(t,m,'common');
 for(const [row,n]of[['left',9],['right',8]])for(const index of ids(n))click(t,m,'shade',{row,index});click(t,m,'combine');answers(t,m);
 const p=accepts(t,m);assert.equal(p.events[3].action,'common');assert.equal(p.events[3].effect,false);
 click(t,m,'common');assert.equal(m.board.combined,false);rejects(t,m);construct(t,m);answers(t,m);accepts(t,m);
});

test('empty and completed reset preserve full history, first prediction and previously visible field strings',()=>{
 const t=at(3),m=F.initial(t);click(t,m,'reset');solve(t,m,{prediction:'part'});const before=copy(m),i=m.history.length;
 click(t,m,'reset');assert.equal(m.answer,before.answer);assert.equal(m.whole,before.whole);assert.equal(m.part,before.part);
 assert.equal(m.board.first,'part');solve(t,m,{prediction:'more'});const p=accepts(t,m);
 assert.equal(p.firstPrediction,'part');assert.equal(p.currentPrediction,'more');assert.equal(p.currentEpoch,2);
 assert.deepEqual(p.predictions.map(x=>[x.index,x.epoch,x.value]),[[1,1,'part'],[i+1,2,'more']]);
 assert.deepEqual(p.resets.map(x=>x.index),[0,i]);assert.equal(p.events[0].effect,false);
 assert.deepEqual(m.history.slice(0,i),before.history);assert.equal(p.epochs[1].endExclusive,i);
 assert.ok(p.division.fitIndices.every(index=>index>i));
});

test('all 28 hidden fields and the raw forms/prediction snapshots must remain consistent',()=>{
 assert.equal(Object.keys(F.fields).length,28);const t=at(0),good=solve(t);
 for(const key of Object.keys(F.fields).filter(k=>!['answer','reason','denom'].includes(k))){
  const m=copy(good);m[key]='unrecorded';rejects(t,m);
 }
 const equivalent=copy(good);equivalent.aform='6/8';original(t,equivalent);rejects(t,equivalent);
 const unused=copy(good);for(const e of unused.history)e.f.factor='3';unused.factor='3';original(t,unused);rejects(t,unused);
 const hiddenAnswer=copy(good);hiddenAnswer.history[0].f.answer='17/12';original(t,hiddenAnswer);rejects(t,hiddenAnswer);
});

test('current visible edits are current submissions, while a changed operation invalidates the last complete snapshot',()=>{
 const t=at(0),m=solve(t),record={attempts:[{value:copy(m)}]};assert.equal(latestSubmissionMatches(m,record),true);
 change(t,m,'answer','34/24');accepts(t,m);assert.equal(latestSubmissionMatches(m,record),false);
 change(t,m,'answer','17/12');assert.equal(latestSubmissionMatches(m,record),true);
 roundTrip(t,m);accepts(t,m);assert.equal(latestSubmissionMatches(m,record),false);
});

test('hidden repeated prediction and repeated forms are not accepted as reachable controls',()=>{
 for(const name of ['predict-op','forms']){
  const t=at(0),m=solve(t);assert.ok(!buttons(t,m).some(x=>x.data['data-x']==='b17-'+name));
  F.act(t,m,'b17-'+name);if(name==='forms'){construct(t,m);answers(t,m);}original(t,m);rejects(t,m);
 }
 const t=at(2),m=solve(t);assert.ok(!buttons(t,m).some(x=>x.data['data-x']==='b17-common'));
 m.denom='12';F.act(t,m,'b17-common');original(t,m);rejects(t,m);
});

test('real incorrect forms or common units followed by correction cannot manufacture a fully valid process',()=>{
 for(const bad of ['forms','common']){
  const t=at(0),m=F.initial(t);change(t,m,'prediction','more');click(t,m,'predict-op');
  if(bad==='forms'){change(t,m,'aform','1/4');change(t,m,'bform','2/3');click(t,m,'forms');assert.equal(m.board.forms,null);}
  start(t,m);if(bad==='common'){change(t,m,'denom','5');click(t,m,'common');assert.equal(m.board.denom,0);}
  construct(t,m);answers(t,m);original(t,m);rejects(t,m);
 }
});

test('raw decimal and percent parser rejections remain rejected even after a real reset and correct construction',()=>{
 for(const value of ['0.750000000','75.000000000%']){
  const t=at(0),m=F.initial(t);change(t,m,'prediction','more');click(t,m,'predict-op');
  change(t,m,'aform',value);change(t,m,'bform','2/3');click(t,m,'forms');
  assert.equal(F.frac(value),null);assert.equal(m.board.forms,null);assert.notEqual(m.issue,'');
  click(t,m,'reset');solve(t,m);original(t,m);rejects(t,m);
 }
 for(const value of ['0.75000000','0.75']){
  const t=at(0),m=solve(t,undefined,{forms:[value,'2/3']});assert.deepEqual(accepts(t,m).forms,[[3,4],[2,3]]);
 }
 // frac can name a percent, but forms also requires the original raw equality
 // parser. That extra source restriction must survive reset just as errors do.
 for(const value of ['75%','75.00000000%']){
  const t=at(0),m=F.initial(t);change(t,m,'prediction','more');click(t,m,'predict-op');
  change(t,m,'aform',value);change(t,m,'bform','2/3');click(t,m,'forms');
  assert.deepEqual(F.frac(value),[3,4]);assert.equal(m.board.forms,null);assert.notEqual(m.issue,'');
  click(t,m,'reset');solve(t,m);original(t,m);rejects(t,m);
 }
});

test('real early combine/rest and an extra visible fit cannot be washed away by later success or reset',()=>{
 for(const name of ['combine','rest','fit']){
  const t=at(name==='combine'?0:3),m=F.initial(t);start(t,m);change(t,m,'denom','12');click(t,m,'common');
  if(name==='fit'){construct(t,m);answers(t,m);click(t,m,'fit');assert.notEqual(m.issue,'');click(t,m,'reset');solve(t,m);}
  else{click(t,m,name);assert.equal(m.board.combined,false);assert.equal(m.board.rest,false);construct(t,m);answers(t,m);}
  original(t,m);rejects(t,m);
 }
});

test('piece capacity follows each actual side, never the larger layout width or a nonexistent cross-widget action',()=>{
 const t=at(0),m=F.initial(t);start(t,m);change(t,m,'denom','12');click(t,m,'common');
 for(const row of ['left','right']){
  const available=buttons(t,m).filter(x=>x.data['data-x']==='b17-shade'&&x.data['data-row']===row);
  assert.equal(available.length,12);assert.ok(available.every(x=>Number(x.data['data-index'])<12));
 }
 F.act(t,m,'b17-shade',{row:'left',index:12});construct(t,m);answers(t,m);original(t,m);rejects(t,m);
 const bad=solve(t);F.act(t,bad,'b17-cell',{index:0});original(t,bad);rejects(t,bad);
});

test('exact integer unit input rejects rounding into a valid denominator while preserving the original grade',()=>{
 const t=at(0),m=F.initial(t);start(t,m);change(t,m,'denom','12.0000000000000001');click(t,m,'common');assert.equal(m.board.denom,12);
 for(const [row,n]of[['left',9],['right',8]])for(const index of ids(n))click(t,m,'shade',{row,index});click(t,m,'combine');answers(t,m);
 original(t,m);rejects(t,m);
 const valid=solve(t,undefined,{denomText:'12.0000000000000000'});accepts(t,valid);
});

test('nearby decimal answers, invalid signed quantities and non-mathematical fields cannot earn evidence',()=>{
 const t=at(2),m=solve(t);
 for(const answer of ['0.50000000000000001','-0 1/2','0/0','Infinity','NaN','1 2','']){const x=copy(m);x.answer=answer;rejects(t,x);}
 for(const key of ['answer','reason']){const x=copy(m);x[key]='wrong';rejects(t,x);}
});

test('zero whole groups distinguish remainder in the original unit from remainder as a fraction of one group',()=>{
 const t={type:'x-fracoperations',a:'1/2',b:'3/4',op:'/',prompt:'Compare two units.'},m=solve(t),p=accepts(t,m);
 assert.equal(p.division.wholeGroups,0);assert.deepEqual(p.division.fitIndices,[]);assert.equal(p.division.restIndices.length,1);
 assert.equal(p.division.originalPieces,2);assert.equal(p.division.groupPieces,3);assert.equal(p.division.remainingPieces,2);
 assert.deepEqual(p.division.remainingAmount,[1,2]);assert.deepEqual(p.division.fractionOfGroup,[2,3]);assert.deepEqual(p.quantities.result,[2,3]);
 const wrong=copy(m);wrong.part='1/2';rejects(t,wrong);assert.equal(binding(t,{sessionId:'fractionfour',index:3}),null);
});

test('zero quantities and zero remainder are mathematical facts; a directed negative subtraction is outside this construction',()=>{
 for(const [a,b,op]of[['3/4','3/4','-'],['0','2/3','+'],['0','2/3','*'],['0','2/3','/']]){
  const t={type:'x-fracoperations',a,b,op,prompt:'Zero boundary.'},m=solve(t),p=accepts(t,m);
  assert.deepEqual(p.quantities.result,F.operation(t));if(op!=='+'&&a==='0')assert.equal(p.resultKind,'zero');
  if(op==='/'){assert.deepEqual(p.division.remainingAmount,[0,1]);assert.deepEqual(p.division.fractionOfGroup,[0,1]);}
 }
 const t={type:'x-fracoperations',a:'3/4',b:'3/4',op:'-',prompt:'Zero boundary.'},m=solve(t);change(t,m,'answer','-0 0/1');accepts(t,m);
 for(const task of [{...t,a:'1/4'},{...t,a:'-0 1/2'}, {...t,op:'/',b:'0'}])assert.equal(replay(task,F.initial(task)),null);
});

test('malformed model/task/event shapes, changed token identities and excess payload fail closed without mutation',()=>{
 const t=at(0),good=solve(t),cases=[null,[],{}, {...good,extra:true},{...good,issue:'pending'}, {...good,history:[]}, {...good,history:Array(1501).fill(good.history[0])}];
 for(const change of [m=>delete m.factor,m=>m.history[0].d.extra='x',m=>m.history[0].f.extra='',m=>m.history[0].a='unknown',
  m=>m.history[0].f.prediction=3,m=>m.board.left[0]=999,m=>m.history[3].d.index='01',m=>m.history[3].d.index='1e0']){const m=copy(good);change(m);cases.push(m);}
 for(const m of cases){const before=JSON.stringify(m);rejects(t,m);assert.equal(JSON.stringify(m),before);}
 for(const task of [null,{}, {...t,extra:true},{...t,prompt:3},{...t,type:'x-fractioncase'},{...t,op:'^'}])rejects(task,good);
});

test('future B18 projected mathematics can reuse the core, but all 38 native and 56 associated wrappers stay unbound',()=>{
 let native=0,bridge=0;
 for(const catalog of [LESSONS,BRIDGES])for(const id of Object.keys(catalog))sessionTasks(id).forEach((t,index)=>{
  if(t.type!=='x-fractioncase')return;
  const projected={type:'x-fracoperations',a:t.a,b:t.b,op:t.op,prompt:t.prompt},m=solve(projected);
  accepts(projected,m);assert.equal(binding(projected,{sessionId:id,index}),null);
  assert.equal(replay({...t,type:'x-fracoperations'},m),null,'extra wrapper requirements cannot be silently dropped');
  catalog===LESSONS?native++:bridge++;
 });
 assert.deepEqual({native,associated:bridge},reviewed.wrappedCandidates);
});

test('the actual standalone browser plan reaches every native, associated, error and exploration control through V.render',()=>{
 const before={...probes},run=(t,m,stages=['start','construct','finish','answer'],options={})=>{
  for(const s of browserPlan.operationPlan(F,t,options))if(stages.includes(s.stage)){
   if(s.field)change(t,m,s.field,s.value);else click(t,m,s.action,s.data);
  }
 };
 for(const c of [...cases,...associated]){
  const t=sessionTasks(c.id)[c.index],a=freshLesson(c.id);a.index=c.index;const m=modelForLesson(a);run(t,m);accepts(t,m);
  if(c.nodeId){
   change(t,m,'answer','999');assert.equal(submit(a).correct,false);run(t,m,['answer']);assert.equal(submit(a).correct,true);
   change(t,m,'answer','998');assert.equal(submit(a).correct,false);run(t,m,['answer']);assert.equal(submit(a).correct,true);
   const name=t.op==='*'?'column':'shade',index=m.board[t.op==='*'?'columns':'left'].at(-1),data=t.op==='*'?{index}:{row:'left',index};
   click(t,m,name,data);click(t,m,name,data);if(t.op!=='*')run(t,m,['finish']);
  }
  assert.equal(submit(a).correct,true);accepts(t,m);
 }
 for(const variant of ['early-combine','early-rest','extra-fit-reset','raw-decimal-reset','percent-reset','rounded-common']){
  const index=['early-rest','extra-fit-reset'].includes(variant)?3:0,t=at(index),a=freshLesson('fractionfour');a.index=index;const m=modelForLesson(a);
  if(['raw-decimal-reset','percent-reset'].includes(variant)){
   change(t,m,'prediction','more');click(t,m,'predict-op');change(t,m,'aform',variant==='raw-decimal-reset'?'0.750000000':'75%');
   change(t,m,'bform','2/3');click(t,m,'forms');assert.equal(m.board.forms,null);click(t,m,'reset');run(t,m);
  }else if(variant==='extra-fit-reset'){
   run(t,m);click(t,m,'fit');assert.notEqual(m.issue,'');click(t,m,'reset');run(t,m);
  }else{
   run(t,m,['start']);change(t,m,'denom',variant==='rounded-common'?'12.0000000000000001':'12');click(t,m,'common');
   if(variant!=='rounded-common')click(t,m,variant==='early-rest'?'rest':'combine');run(t,m,['construct','finish','answer']);
  }
  assert.equal(submit(a).correct,true);rejects(t,m);
 }
 for(const variant of ['rescale-common','reset-preserves-first','repeat-confirmation']){
  const t=at(3),a=freshLesson('fractionfour');a.index=3;const m=modelForLesson(a);run(t,m);const prefix=copy(m.history);
  if(variant==='rescale-common')run(t,m,['construct','finish','answer'],{denominator:24});
  else if(variant==='reset-preserves-first'){click(t,m,'reset');run(t,m,undefined,{prediction:'more'});}
  else{click(t,m,'rest');click(t,m,'rest');}
  assert.equal(submit(a).correct,true);accepts(t,m);assert.deepEqual(m.history.slice(0,prefix.length),prefix);
 }
 console.log('fraction-operations browser-plan source probes '+JSON.stringify({paths:21,
  actions:probes.actions-before.actions,fields:probes.fields-before.fields,submissions:probes.submissions-before.submissions}));
});

test('all ten feedback bindings require the entire latest submitted model and preserve all associated isolation',()=>{
 for(const c of cases){
  const t=sessionTasks(c.id)[c.index],m=F.example(t),saved={support:true,attempts:[{value:copy(m)}]},before=JSON.stringify(saved);
  assert.ok(thinkingGuide(t,context(c)));assert.equal(thinkingFeedback(t,m,null,context(c)),null);
  const feedback=thinkingFeedback(t,m,saved,context(c));assert.ok(feedback);assert.equal(feedback.method,null);
  assert.match(feedback.detail.join(' '),/没有自动评价自由解释或长期掌握/);assert.match(feedback.detail.join(' '),/提示/);
  assert.doesNotMatch(JSON.stringify(feedback),/MP\.\d/);assert.equal(thinkingFeedback(t,m,saved,{}),null);
  const changed=copy(m);changed.answer='999';assert.equal(thinkingFeedback(t,changed,saved,context(c)),null);
  assert.equal(thinkingFeedback(t,changed,{attempts:[{value:changed}]},context(c)),null);
  assert.equal(thinkingFeedback(t,m,{attempts:[{value:m},{value:changed}]},context(c)),null);
  assert.equal(JSON.stringify(saved),before);
 }
 for(const c of associated){const t=sessionTasks(c.id)[c.index],m=F.example(t);
  assert.equal(thinkingGuide(t,context(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:m}]},context(c)),null);
 }
});

test('feedback attributes generated result bars and intersections to the tool, including scattered multiplication',()=>{
 const plus=cases.find(c=>c.id==='fractionfour'&&c.index===0),t=at(0),m=F.example(t),record=x=>({attempts:[{value:x}]});
 const words=thinkingFeedback(t,m,record(m),context(plus));
 assert.match(words.observation,/9 个 1\/12 和 8 个 1\/12/);assert.match(words.observation,/工具显示 17 个 1\/12/);
 assert.doesNotMatch(words.observation,/独立|亲手.*结果|手工.*结果/);
 const mult=cases.find(c=>c.id==='fractionfour'&&c.index===2),mt=at(2),mm=solve(mt,undefined,{forms:['6/8','4/6'],columns:[0,1,2,4,6,7],rows:[0,2,4,5]});
 const feedback=thinkingFeedback(mt,mm,record(mm),context(mult));
 assert.match(feedback.observation,/6 列和 4 行/);assert.match(feedback.observation,/1\/48/);assert.match(feedback.observation,/工具显示.*交集共 24 小格/);
 assert.match(feedback.detail.join(' '),/不连续/);assert.match(feedback.detail.join(' '),/不把它们冒充一块连续的长方形/);
});

test('division feedback separates current fits, original-unit remainder and group-unit remainder without inventing save times',()=>{
 const c=cases.find(c=>c.id==='fractionfour'&&c.index===3),t=at(3),m=solve(t);construct(t,m,{denominator:24});answers(t,m);click(t,m,'rest');
 const words=thinkingFeedback(t,m,{attempts:[{value:m}]},context(c));
 assert.match(words.observation,/18 小份.*16 小份/);assert.match(words.observation,/1\/24/);
 assert.match(words.observation,/当前构造记录了 1 次有效放组/);assert.doesNotMatch(words.observation,/2 次有效放组/);
 assert.match(words.observation,/工具显示还余 2 小份/);assert.match(words.observation,/原来单位的 1\/12，也是.*组的 1\/8/);
 const exact=cases.find(c=>c.id==='fractionfour'&&c.index===7),et=at(7),em=F.example(et);
 const ew=thinkingFeedback(et,em,{attempts:[{value:em}]},context(exact));
 assert.match(ew.observation,/5 次有效放组/);assert.match(ew.observation,/还余 0 小份/);assert.match(ew.observation,/原来单位的 0，也是.*组的 0/);
});

test('source-only control probes include every native five-attempt path and leave original APIs untouched',()=>{
 assert.equal(probes.submissions,111);assert.ok(probes.actions>1000);assert.ok(probes.fields>500);
 for(const [file,sha]of Object.entries(reviewed.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 console.log('fraction-operations original-control probes '+JSON.stringify(probes));
});
