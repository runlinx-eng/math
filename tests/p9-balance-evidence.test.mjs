import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-balance-cases.cjs';
import * as M from '../dist/learning/phase5/b28-model.js';
import * as V from '../dist/learning/phase5/b28-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {PRACTICE,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {balanceBinding as binding,replayBalanceEvidence as replay} from '../dist/learning/balance-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
await ensureB39Ready();
const cp=structuredClone,all=[...fixture.cases,...fixture.associated,...fixture.practice];
const at=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
function field(t,m,key,value){
 const html=V.controls(t,m),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-xfield']===key);
 assert.equal(tags.length,1,'original visible field '+key);assert.doesNotMatch(tags[0],/\bdisabled\b|\breadonly\b/);
 if(tags[0].startsWith('<select')){const start=html.indexOf(tags[0]),body=html.slice(start,html.indexOf('</select>',start));assert.ok([...body.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)));}
 const [root,index]=key.split('.');if(index===undefined)m[root]=String(value);else m[root][+index]=String(value);M.field(t,m,key);assert.equal(M.valid(t,m),true);return m;
}
function action(t,m,name,index){
 const tags=[...V.controls(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-x']===name&&(index===undefined?attrs(x)['data-index']===undefined:attrs(x)['data-index']===String(index)));
 assert.equal(tags.length,1,'original visible action '+name+':'+index);assert.doesNotMatch(tags[0],/\bdisabled\b/);M.act(t,m,name,index===undefined?{}:{index:String(index)});assert.equal(M.valid(t,m),true);return m;
}
const relation=t=>t.left.mass===t.right.mass?'equal':t.left.mass>t.right.mass?'left':'right';
function record(t,m,raw=String(t.mass),unit=t.unit){field(t,m,'measure',raw);field(t,m,'unit',unit);action(t,m,'m28-record');return m;}
function build(t,m=M.initial(t),{raw,weights}={}){
 if(t.mode==='compare'){action(t,m,'m28-test');action(t,m,'m28-choice',relation(t));for(const[q,i]of t.questions.map((q,i)=>[q,i]))field(t,m,'answers.'+i,t.left.mass>t.right.mass?'right':'left');}
 else{while(m.board.weights.length)action(t,m,'m28-remove');const chosen=weights??(t.unit==='g'?[200,500]:[1,1,1,1,1]);for(const n of chosen)action(t,m,'m28-weight',n);record(t,m,raw??String(t.mass));}return m;
}
const reject=(t,m)=>assert.equal(replay(t,m),null);
function oldOnly(t,m){assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);reject(t,m);}

test('the complete literal family is six native, four associated and one actual practice with immutable original sources',()=>{
 for(const[file,sha]of Object.entries(fixture.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 for(const c of all){assert.deepEqual(at(c),c.task);assert.equal(hash(at(c)),c.taskHash);}
 const inventory=ids=>ids.flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-m28-balance'?[id+':'+index]:[])).sort();
 assert.deepEqual(inventory(Object.keys(LESSONS)),fixture.cases.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(inventory(Object.keys(BRIDGES)),fixture.associated.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(Object.keys(PRACTICE).filter(id=>PRACTICE[id].type==='x-m28-balance'),['compareweight']);
 assert.equal(fixture.cases.length,6);assert.equal(fixture.associated.length,4);assert.equal(fixture.practice.length,1);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,3);
 for(const id of new Set(fixture.associated.map(c=>c.id))){assert.equal(Object.hasOwn(PRACTICE,id),false);assert.deepEqual(sessionTaskFor(id,-1),sessionTaskFor(id,0));}
});

for(const c of fixture.cases)test(c.id+':'+c.index+' binds its exact native context and proves the independently specified source relation',()=>{
 const t=at(c),m=build(t),before=cp(m),p=replay(t,m);assert.ok(p);assert.deepEqual(m,before);assert.equal(p.kind,'balance');assert.equal(p.shape,c.math.shape);assert.equal(p.eventCount,m.history.length);
 assert.equal(binding(t,ctx(c)).nodeId,c.nodeId);assert.equal(binding(t,ctx(c)).kind,t.mode);assert.equal(binding(t,ctx(c)).method,null);
 for(const k of ['physicalMeasurementAssessed','independentAdditionProcessAssessed','independentConversionAssessed','sizePredictsMassAssessed','freeExplanationAssessed','generalMasteryAssessed'])assert.equal(p[k],false);
 if(t.mode==='compare'){assert.equal(p.construction.relation,c.math.relation);assert.equal(p.construction.lighter,c.math.lighter);assert.equal(p.construction.sourceMassValuesNotVisible,true);assert.equal(p.construction.comparisonIsQualitative,true);assert.equal(p.construction.choice.selected,c.math.relation);}
 else{assert.equal(p.construction.sum.text,String(c.math.mass));assert.equal(p.construction.record.unit,c.math.unit);assert.equal(p.construction.record.raw,m.measure);assert.equal(p.construction.record.balanced,true);assert.equal(p.construction.toolShowsTotal,false);assert.deepEqual(p.construction.weights.map(x=>x.amount),m.board.weights);}
});

test('associated and actual practice models replay without acquiring native source binding',()=>{
 for(const c of all){const t=at(c),m=exampleModel(t);assert.equal(M.inspect(t,m).correct,true);assert.ok(replay(t,m));}
 for(const c of [...fixture.associated,...fixture.practice])assert.equal(binding(at(c),ctx(c)),null);
});

test('full task and source identity reject changed questions, prompts, masses, units and foreign contexts',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);for(const context of [null,{},[],{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},{sessionId:c.id,index:.5},{sessionId:'__proto__',index:0}])assert.equal(binding(t,context),null);
  for(const modify of [x=>x.prompt+='!',x=>x.extra=true,x=>x.questions.push({label:'new',value:1}),x=>x.mode='foreign',x=>{if(x.mode==='compare')x.left.mass++;else x.mass++;}]){const changed=cp(t);modify(changed);assert.equal(binding(changed,ctx(c)),null);reject(changed,m);}
 }
 for(const[id,index]of [['lengthstart',0],['lengthstart',1],['precisionunits',0],['measurecalc',1],['communicate38',0]]){const t=sessionTaskFor(id,index);assert.notEqual(t.type,'x-m28-balance');assert.equal(binding(t,{sessionId:id,index}),null);reject(t,exampleModel(t));}
});

test('a hidden pre-test choice can be originally green but is never source-visible comparison evidence',()=>{
 for(const c of fixture.cases.filter(c=>c.math.shape==='compare')){const t=at(c),m=M.initial(t);assert.doesNotMatch(V.controls(t,m),/data-x="m28-choice"/);M.act(t,m,'m28-choice',{index:relation(t)});action(t,m,'m28-test');t.questions.forEach((q,i)=>field(t,m,'answers.'+i,q.value));oldOnly(t,m);}
});

test('the lighter question is already visible before testing, and repeated test does not erase first choice or bad',()=>{
 const t=at(fixture.cases.find(c=>c.id==='compareweight'&&c.index===2)),m=M.initial(t);field(t,m,'answers.0','right');action(t,m,'m28-test');action(t,m,'m28-choice','right');assert.equal(m.board.first.choice,'right');assert.equal(m.board.bad,true);action(t,m,'m28-choice','left');action(t,m,'m28-test');assert.ok(replay(t,m));assert.equal(replay(t,m).construction.firstChoice.selected,'right');assert.equal(replay(t,m).construction.currentQuestions[0].onlyCurrentField,true);
});

test('all 27 independently enumerated ordered weight solutions work, not only exampleWeights',()=>{
 let count=0;for(const c of fixture.cases.filter(c=>c.math.shape==='weigh')){const t=at(c),solutions=[];const walk=(sum,parts)=>{if(sum===c.math.mass){solutions.push(parts);return;}for(const n of c.math.weights)if(sum+n<=c.math.mass)walk(sum+n,[...parts,n]);};walk(0,[]);assert.equal(solutions.length,c.math.orderedSolutions);
  assert.equal(new Set(solutions.map(s=>[...s].sort((a,b)=>a-b).join(','))).size,c.math.multisets.length);
  for(const weights of solutions){const m=build(t,undefined,{weights}),p=replay(t,m);assert.ok(p);assert.deepEqual(p.construction.weights.map(x=>x.amount),weights);assert.equal(p.construction.sum.text,String(c.math.mass));count++;}
 }assert.equal(count,27);
});

test('recording before balance is legal history but later actual weight changes invalidate that saved pair',()=>{
 for(const c of fixture.cases.filter(c=>c.math.shape==='weigh')){const t=at(c),m=M.initial(t);record(t,m);assert.equal(m.board.first.measure,String(t.mass));assert.deepEqual(m.board.saved,{measure:String(t.mass),unit:t.unit});reject(t,m);const first=cp(m.board.first);action(t,m,'m28-weight',t.weights[0]);assert.equal(m.board.saved,null);build(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.construction.firstMeasure.balanced,false);assert.deepEqual(m.board.first,first);}
});

test('literal saved spelling and units require a new original record even for equivalent rational numbers',()=>{
 for(const c of fixture.cases.filter(c=>c.math.shape==='weigh')){const t=at(c),m=build(t),first=cp(m.board.first),old=cp(m.board.saved),history=cp(m.history);
  for(const raw of [t.mass+'.0','  '+t.mass+'  ',(t.mass*2)+'/2',(t.mass-1)+' 2/2']){field(t,m,'measure',raw);assert.equal(M.inspect(t,m).correct,false);reject(t,m);assert.deepEqual(m.board.saved,old);assert.deepEqual(m.history,history);}
  action(t,m,'m28-record');assert.ok(replay(t,m));assert.deepEqual(m.board.first,first);field(t,m,'unit',t.unit==='g'?'kg':'cm');action(t,m,'m28-record');reject(t,m);record(t,m);assert.ok(replay(t,m));assert.equal(m.board.bad,true);
 }
});

test('near-success and double-underflow history remain originally green but require an exact current resave',()=>{
 for(const c of fixture.cases.filter(c=>c.math.shape==='weigh'))for(const raw of [c.math.mass+'.00000001',c.math.mass+'.00000000000000000001',c.math.mass+' 1/'+'1'+'0'.repeat(400)]){
  const t=at(c),m=build(t,undefined,{raw});oldOnly(t,m);assert.equal(m.board.bad,false);assert.equal(m.board.first.measure,raw);field(t,m,'measure',String(t.mass));reject(t,m);action(t,m,'m28-record');const p=replay(t,m);assert.ok(p);assert.equal(p.construction.firstMeasure.exactMass,false);assert.equal(p.construction.hadOriginalBad,false);
 }
});

test('malformed numeric inputs are real failures; a terminal failure can retain a valid older save and issue',()=>{
 for(const c of fixture.cases.filter(c=>c.math.shape==='weigh')){const t=at(c),m=build(t),saved=cp(m.board.saved),first=cp(m.board.first);
  for(const raw of ['', 'NaN','Infinity','1e3','0x64','+700','1/0','-0 1/0']){record(t,m,raw);assert.equal(m.issue,'先记录用了多少单位。');assert.deepEqual(m.board.saved,saved);assert.deepEqual(m.board.first,first);reject(t,m);field(t,m,'measure',saved.measure);assert.ok(replay(t,m));assert.equal(replay(t,m).issue,'先记录用了多少单位。');}
 }
});

test('the 31st weight logs a visible no-op, clears issue and retains saved; empty remove also remains a real request',()=>{
 for(const c of fixture.cases.filter(c=>c.math.shape==='weigh')){const t=at(c),m=M.initial(t);action(t,m,'m28-remove');assert.equal(m.history.length,1);record(t,m);action(t,m,'m28-remove');assert.ok(m.board.saved);for(let n=0;n<30;n++)action(t,m,'m28-weight',t.weights[0]);record(t,m);const saved=cp(m.board.saved);record(t,m,'bad');const h=m.history.length;action(t,m,'m28-weight',t.weights[0]);assert.equal(m.board.weights.length,30);assert.equal(m.history.length,h+1);assert.equal(m.issue,'');assert.deepEqual(m.board.saved,saved);build(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.weights.filter(x=>x.ignoredAtWeightLimit).length,1);assert.ok(p.removals.some(x=>x.removed===null));}
});

test('numeric-equivalent button data is not a canonical visible source control',()=>{
 const t=at(fixture.cases.find(c=>c.id==='measurecalc'));
 for(const data of ['100.0','0100','+100',' 100 ','1e2','0x64']){const m=M.initial(t);for(let i=0;i<7;i++)M.act(t,m,'m28-weight',{index:data});record(t,m);oldOnly(t,m);}
});

test('cross-mode actions, hidden fields, extra keys and forged issue cannot borrow an original green grade',()=>{
 for(const c of fixture.cases){const t=at(c),initial=build(t);for(const mutate of [m=>m.offset='0',m=>m.estimate='5',m=>m.error='0',m=>m.values.push('1'),m=>m.issue='invented',m=>m.extra=true,m=>m.board.extra=true,m=>m.history[0].extra=true]){const m=cp(initial);mutate(m);reject(t,m);}
  for(const[name,data]of [['help',{}],['clear',{}],['align',{}],['predict',{}],...(t.mode==='compare'?[['record',{}],['remove',{}]]:[['test',{}]])]){const m=cp(initial);M.act(t,m,'m28-'+name,data);oldOnly(t,m);}
  if(t.mode==='compare'){const m=cp(initial);m.measure='7';m.unit='g';oldOnly(t,m);}
 }
});

test('capacity retains the whole model while current saved spelling and latest complete submission still matter',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);while(m.history.length<2000)action(t,m,t.mode==='compare'?'m28-test':'m28-record');const before=cp(m);action(t,m,t.mode==='compare'?'m28-choice':'m28-remove',t.mode==='compare'?relation(t):undefined);assert.deepEqual(m,before);assert.equal(replay(t,m).historyAtCapacity,true);const record={attempts:[{value:cp(m)}]};assert.equal(latestSubmissionMatches(m,record),true);field(t,m,'prose','current unsaved explanation');assert.equal(latestSubmissionMatches(m,record),false);assert.ok(replay(t,m));
  if(t.mode==='weigh'){const raw=m.measure;field(t,m,'measure',raw+'.0');action(t,m,'m28-record');reject(t,m);field(t,m,'measure',raw);assert.ok(replay(t,m));}
 }
});

test('1200 text is accepted, 1201 is invalid, and exact original raw storage and old attempts survive codec roundtrip',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
 for(const c of fixture.cases){const t=at(c),m=build(t);field(t,m,'prose','中'.repeat(1200));assert.ok(replay(t,m));const bad=cp(m);bad.prose+='中';assert.equal(M.valid(t,bad),false);reject(t,bad);
  const a=State.freshLesson(c.id);a.index=c.index;a.view='task';a.models[c.index]=cp(m);State.submitLesson(a);assert.deepEqual(a.cases[c.index].attempts.at(-1).value,m);const state=Core.fresh();state.lessons[c.id]=a;const valid=Core.validate(cp(state),atlas);assert.deepEqual(valid,state);const backing=new Map(),storage={getItem:k=>backing.get(k)??null,setItem:(k,v)=>backing.set(k,v)};Storage.writeStored(Core.KEY,JSON.stringify(state),storage);assert.deepEqual(JSON.parse(Storage.readStored(Core.KEY,storage)),state);
 }
});

test('two public contracts bind only the six native positions and all feedback matches the latest full work',()=>{
 assert.deepEqual(EVIDENCE_ADAPTERS.filter(a=>a.id.startsWith('balance-')).map(a=>a.id),['balance-compare','balance-weigh']);
 for(const c of all){const t=at(c),m=build(t),record={support:false,attempts:[{value:cp(m)}]},native=c.role==='native';
  const adapters=EVIDENCE_ADAPTERS.filter(a=>a.type===t.type&&a.binding(t,ctx(c)));assert.equal(adapters.length,native?1:0);
  assert.equal(!!thinkingGuide(t,ctx(c)),native);assert.equal(!!thinkingFeedback(t,m,record,ctx(c)),native);
  if(!native)continue;
  assert.equal(adapters[0].id,'balance-'+t.mode);const f=thinkingFeedback(t,m,record,ctx(c));assert.equal(f.method,null);assert.doesNotMatch(JSON.stringify(f),/MP\.\d/);
  if(t.mode==='compare')assert.doesNotMatch(JSON.stringify(f),/31|质量是|克|千克/);
  const changed=cp(m);changed.prose+='未提交';assert.equal(thinkingFeedback(t,changed,record,ctx(c)),null);
  assert.equal(thinkingFeedback(t,m,{attempts:[]},ctx(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:cp(m)},{value:changed}]},ctx(c)),null);
  const supported=thinkingFeedback(t,m,{...record,support:true},ctx(c));assert.equal(supported.method,null);assert.ok(supported.detail.includes('你看过提示或比较反馈。'));
 }
});
