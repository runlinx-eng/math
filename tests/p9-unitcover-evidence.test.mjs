import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-unitcover-cases.cjs';
import unitcoverBrowser from './p9-unitcover-adapter-browser.cjs';
const {compactUnitcoverReport}=unitcoverBrowser;
import * as M from '../dist/learning/phase5/b28-model.js';
import * as V from '../dist/learning/phase5/b28-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {PRACTICE,defaultModel,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {unitcoverBinding as binding,replayUnitcoverEvidence as replay} from '../dist/learning/unitcover-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
await ensureB39Ready();
const cp=structuredClone,at=c=>sessionTaskFor(c.id,c.index),context=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));

test('browser report compaction keeps evidence references and bounded audit summaries without duplicating full State models',()=>{
 const model={history:Array.from({length:2000},(_,i)=>({a:'record',d:{},f:{measure:String(i),unit:'块'}})),board:{positions:[0,1]}};
 const record={attempts:[{id:'a1',value:model},{id:'a2',value:model}],support:true,exposed:false};
 const raw={model,record,attempts:record.attempts,emptyModel:model,originalState:{lessons:{x:{models:{0:model}}}},
  beforeRecord:record,afterRecord:record,attempt:{id:'a2',at:'2026-11-18T00:00:00Z',supported:true,exposed:false,value:model},
  storage:{raw:'raw-storage.txt',state:'state.json',rawSHA256:'abc',stateSHA256:'def'},
  proof:{kind:'unitcover',eventCount:4,construction:{positions:[0,1]}},backupFile:'backup-v2.json'};
 const compact=compactUnitcoverReport(raw);
 assert.equal(Object.hasOwn(compact,'model'),false);assert.equal(Object.hasOwn(compact,'record'),false);
 assert.equal(Object.hasOwn(compact,'attempts'),false);assert.equal(Object.hasOwn(compact,'emptyModel'),false);
 assert.equal(Object.hasOwn(compact,'originalState'),false);
 assert.deepEqual(compact.beforeRecordSummary,{attemptCount:2,support:true,exposed:false});
 assert.deepEqual(compact.afterRecordSummary,{attemptCount:2,support:true,exposed:false});
 assert.deepEqual(compact.attemptSummary,{id:'a2',at:'2026-11-18T00:00:00Z',supported:true,exposed:false});
 assert.equal(compact.storage.state,'state.json');assert.equal(compact.backupFile,'backup-v2.json');
 assert.deepEqual(compact.proof,raw.proof);
 const forged=compactUnitcoverReport({model:{history:[{a:'forged'}]},strict:false},{preserveModels:true});
 assert.deepEqual(forged.model,{history:[{a:'forged'}]});
});
function field(t,m,key,value){
 const html=V.controls(t,m),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-xfield']===key);
 assert.equal(tags.length,1,'one original visible field '+key);assert.doesNotMatch(tags[0],/\bdisabled\b|\breadonly\b/);
 if(tags[0].startsWith('<select')){const start=html.indexOf(tags[0]),body=html.slice(start,html.indexOf('</select>',start));assert.ok([...body.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)),'select really offers '+value);}
 const [root,index]=key.split('.');if(index===undefined)m[root]=String(value);else m[root][Number(index)]=String(value);M.field(t,m,key);assert.equal(M.valid(t,m),true);
}
function action(t,m,name,index){
 const tags=[...V.controls(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-x']===name&&(index===undefined?attrs(x)['data-index']===undefined:attrs(x)['data-index']===String(index)));
 assert.equal(tags.length,1,'one original visible action '+name+':'+index);assert.doesNotMatch(tags[0],/\bdisabled\b/);
 M.act(t,m,name,index===undefined?{}:{index:String(index)});assert.equal(M.valid(t,m),true);return m;
}
function save(t,m,measure=String(t.length/t.size),unit=t.unit){field(t,m,'measure',measure);field(t,m,'unit',unit);action(t,m,'m28-record');return m;}
function build(t,m=M.initial(t)){for(let p=0;p<t.length;p+=t.size)action(t,m,'m28-place',p);save(t,m);(t.questions||[]).forEach((q,i)=>field(t,m,'answers.'+i,q.value));return m;}
const reject=(t,m)=>assert.equal(replay(t,m),null);
const oldOnly=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);reject(t,m);};
function retryTags(a){const host={innerHTML:''};renderP3Flow(host,{atlas,id:a.id,record:a});return [...host.innerHTML.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-do']==='p3-retry');}

test('all six native sources, five associated copies, three practices and twenty stable source hashes are fixed',()=>{
 for(const[file,sha]of Object.entries(fixture.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 assert.equal(Object.keys(fixture.sourceHashes).length,20);
 for(const c of [...fixture.cases,...fixture.associated,...fixture.practice]){assert.deepEqual(at(c),c.task);assert.equal(hash(at(c)),c.taskHash);}
 const native=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-m28-units'?[id+':'+index]:[]));
 const associated=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-m28-units'?[id+':'+index]:[]));
 assert.deepEqual(native.sort(),fixture.cases.map(c=>c.id+':'+c.index).sort());assert.equal(native.length,6);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,3);
 assert.deepEqual(associated.sort(),fixture.associated.map(c=>c.id+':'+c.index).sort());assert.equal(associated.length,5);
 assert.deepEqual(Object.keys(PRACTICE).filter(id=>PRACTICE[id].type==='x-m28-units').sort(),fixture.practice.map(c=>c.id).sort());assert.equal(fixture.practice.length,3);
});

for(const c of fixture.cases)test(c.id+':'+c.index+' proves exact equal-unit intervals, full coverage and the current saved raw pair',()=>{
 const t=at(c),m=build(t),before=cp(m),p=replay(t,m);assert.ok(p);assert.deepEqual(m,before);assert.equal(M.inspect(t,m).correct,true);
 assert.equal(p.kind,'unitcover');assert.equal(p.eventCount,m.history.length);assert.deepEqual(p.construction.coverage,Array(t.length).fill(1));
 assert.deepEqual(p.construction.positions,c.math.positions);assert.equal(p.construction.count,c.math.count);assert.equal(p.construction.size,t.size);assert.equal(p.construction.unit,t.unit);
 assert.equal(p.construction.placements.reduce((n,u)=>n+BigInt(u.end-u.start),0n),BigInt(t.length));
 for(const u of p.construction.placements){assert.equal(u.end-u.start,t.size);assert.equal(m.history[u.placedAt].a,'place');assert.equal(m.history[u.placedAt].d.index,String(u.start));assert.ok(u.placedAt<p.construction.saved.index);}
 assert.deepEqual(p.construction.saved,{index:m.history.length-1,measure:String(c.math.count),unit:t.unit,quantity:{numerator:String(c.math.count),denominator:'1',text:String(c.math.count)}});
 assert.deepEqual(p.construction.firstMeasure,{index:m.history.length-1,raw:String(c.math.count),originalNearCount:true,exactCount:true});
 assert.equal(p.construction.toolProvidedGrid,true);assert.equal(p.construction.toolDisplayedCount,true);
 for(const key of ['independentCountingAssessed','physicalMeasurementAssessed','independentUnitChoiceAssessed','unitComparisonReasoningAssessed','freeExplanationAssessed','generalMasteryAssessed'])assert.equal(p[key],false);
 assert.equal(binding(t,context(c)).nodeId,c.nodeId);assert.equal(binding(t,context(c)).method,null);
 const html=V.visual(t,m),rects=[...html.matchAll(/<rect\b[^>]*>/g)].map(x=>attrs(x[0]));assert.equal(rects.length,c.math.count+1);
 assert.equal(Number(rects[0].width),c.math.totalWidth);for(let i=1;i<rects.length;i++){assert.equal(Number(rects[i].width),c.math.unitWidth);assert.equal(Number(rects[i].x),105+c.math.positions[i-1]*Math.min(48,540/t.length));}
});

test('source contexts and whole task literals cannot be borrowed or coerced',()=>{
 for(const c of fixture.cases){const t=at(c);for(const bad of [null,{},[],{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},{sessionId:c.id,index:.5},{sessionId:'__proto__',index:c.index},{sessionId:['lengthstart'],index:0}])assert.equal(binding(t,bad),null);
  for(const key of ['prompt','unit','object']){const bad=cp(t);bad[key]+='!';assert.equal(binding(bad,context(c)),null);reject(bad,build(t));}
  for(const key of ['length','size']){const bad=cp(t);bad[key]++;assert.equal(binding(bad,context(c)),null);reject(bad,build(t));}
  const bad=cp(t);bad.extra=true;reject(bad,build(t));assert.equal(binding(bad,context(c)),null);
 }
 for(const c of [...fixture.associated,...fixture.practice])assert.equal(binding(at(c),context(c)),null);
});

test('all fourteen original examples retain the unchanged original model and grading path',()=>{
 for(const c of [...fixture.cases,...fixture.associated,...fixture.practice]){const t=at(c),m=exampleModel(t),old=cp(m);assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);assert.ok(replay(t,m));assert.deepEqual(m,old);}
 for(const t of sessionTasks('twounits').slice(0,2)){assert.equal(t.type,'x-m28-ruler');reject(t,exampleModel(t));}
});

test('a blank failed record does not establish first or saved, while numeric gap records really are saved',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);action(t,m,'m28-record');assert.deepEqual(m.board.first,{});assert.equal(m.board.saved,null);assert.equal(m.board.bad,false);assert.equal(m.issue,'先数一数，写下用了几个单位。');reject(t,m);
  save(t,m,String(c.math.count));assert.deepEqual(m.board.first,{measure:String(c.math.count)});assert.deepEqual(m.board.saved,{measure:String(c.math.count),unit:t.unit});assert.equal(m.board.bad,false);assert.equal(M.inspect(t,m).correct,false);reject(t,m);
  build(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.records[0].numeric,false);assert.equal(p.records[0].saved,false);assert.equal(p.records[1].saved,true);assert.equal(p.records[1].completeCoverage,false);assert.equal(p.construction.firstMeasure.index,1);
 }
});

test('first wrong measure, wrong visible unit and original bad survive clear and later exact construction',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);save(t,m,String(c.math.count+1),'cm');assert.equal(m.board.bad,true);action(t,m,'m28-clear');assert.deepEqual(m.board.first,{measure:String(c.math.count+1)});build(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.construction.firstMeasure.exactCount,false);assert.equal(p.construction.firstMeasure.originalNearCount,false);assert.equal(p.construction.hadOriginalBad,true);assert.equal(p.clears.length,1);assert.equal(p.clears[0].retainedBad,true);}
});

test('gaps and genuine overlaps must be repaired before a new saved pair can prove the current cover',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);action(t,m,'m28-place',0);assert.equal(m.board.saved,null);reject(t,m);save(t,m);assert.equal(M.inspect(t,m).correct,false);reject(t,m);action(t,m,'m28-place',0);assert.equal(m.board.saved,null);reject(t,m);save(t,m);let p=replay(t,m);assert.ok(p);assert.equal(p.removals.length,1);assert.ok(p.construction.placements.find(x=>x.start===0).placedAt>p.removals[0].index);
  if(t.size===2){action(t,m,'m28-place',1);save(t,m);assert.equal(m.board.bad,true);assert.equal(M.inspect(t,m).correct,false);reject(t,m);action(t,m,'m28-place',1);save(t,m);p=replay(t,m);assert.ok(p);assert.equal(p.construction.hadOriginalBad,true);assert.ok(p.events.some(e=>e.overlap));}
 }
});

test('exact integer, decimal, fraction and original mixed-number spellings are accepted without floating inference',()=>{
 for(const c of fixture.cases){const t=at(c),n=c.math.count;for(const raw of [String(n),n+'.0',String(n*3)+'/3',`${n-1} 1/1`,'  00'+n+'.000  ','0 '+n+'/1']){const m=build(t);save(t,m,raw);assert.equal(M.inspect(t,m).correct,true);const p=replay(t,m);assert.ok(p,raw);assert.equal(p.construction.saved.quantity.numerator,String(n));assert.equal(p.construction.saved.quantity.denominator,'1');assert.equal(p.construction.saved.measure,raw);}}
});

test('original near successes stay successful history but cannot establish an exact current saved count',()=>{
 for(const c of fixture.cases){const t=at(c),n=c.math.count,m=M.initial(t);for(let p=0;p<t.length;p+=t.size)action(t,m,'m28-place',p);save(t,m,n+'.00000001');(t.questions||[]).forEach((q,i)=>field(t,m,'answers.'+i,q.value));oldOnly(t,m);assert.equal(m.board.bad,false);assert.equal(m.board.first.measure,n+'.00000001');
  save(t,m,String(n));const p=replay(t,m);assert.ok(p);assert.equal(p.records[0].originalNearCount,true);assert.equal(p.records[0].exactCount,false);assert.equal(p.records[0].saved,true);assert.equal(p.construction.hadOriginalBad,false);assert.equal(p.construction.firstMeasure.originalNearCount,true);assert.equal(p.construction.firstMeasure.exactCount,false);
  save(t,m,n+'.'+'0'.repeat(30)+'1');oldOnly(t,m);assert.equal(m.board.bad,false);
 }
});

test('numeric failures retain the actual preceding saved pair and terminal issue even after fields return to it',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),oldSave=cp(m.board.saved),oldFirst=cp(m.board.first);save(t,m,'','');assert.deepEqual(m.board.saved,oldSave);assert.deepEqual(m.board.first,oldFirst);assert.equal(m.board.bad,false);reject(t,m);
  field(t,m,'measure',oldSave.measure);field(t,m,'unit',oldSave.unit);assert.equal(M.inspect(t,m).correct,true);const p=replay(t,m);assert.ok(p);assert.equal(p.issue,'先数一数，写下用了几个单位。');assert.equal(p.records.at(-1).saved,false);assert.equal(p.construction.saved.index,m.history.length-2);assert.equal(p.construction.saved.measure,oldSave.measure);
  const forged=cp(m);forged.issue='';oldOnly(t,forged);action(t,m,'m28-record');assert.equal(m.issue,'');assert.ok(replay(t,m));
 }
});

test('saved versus draft is raw-string exact; optional prose remains visible and semantically unassessed',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),saved=cp(m.board.saved);field(t,m,'measure',saved.measure+'.0');assert.equal(M.inspect(t,m).correct,false);reject(t,m);action(t,m,'m28-record');assert.ok(replay(t,m));field(t,m,'prose','我把单位接起来，原话仅保留。');const p=replay(t,m);assert.ok(p);assert.equal(p.prose,m.prose);assert.equal(p.freeExplanationAssessed,false);field(t,m,'unit','');reject(t,m);field(t,m,'unit',t.unit);assert.ok(replay(t,m));}
});

test('the single more selection stays an original answer requirement without unit-reasoning attribution',()=>{
 const c=fixture.cases.find(c=>c.id==='twounits'),t=at(c),m=build(t);for(const v of ['','less']){field(t,m,'answers.0',v);assert.equal(M.inspect(t,m).correct,false);reject(t,m);}field(t,m,'answers.0','more');const p=replay(t,m);assert.ok(p);assert.equal(p.unitComparisonReasoningAssessed,false);const bad=cp(m);bad.answers[0]='hidden';reject(t,bad);
});

test('all hidden fields, extra keys, wrong issue and unselectable values fail closed despite old permissive validity',()=>{
 const c=fixture.cases[0],t=at(c),m=build(t);
 for(const mutate of [x=>x.offset='0',x=>x.estimate='1',x=>x.error='1',x=>x.extra=true,x=>x.issue='invented']){const bad=cp(m);mutate(bad);oldOnly(t,bad);}
 for(const mutate of [x=>x.values.push('1'),x=>x.answers.push('more'),x=>x.seed=0,x=>x.seed=4294967296,x=>x.prose='x'.repeat(1201),x=>x.board.extra=true,x=>x.board.first.extra=true,x=>x.board.saved.extra=true]){const bad=cp(m);mutate(bad);reject(t,bad);}
 for(const seed of [1,17,4294967295]){const x=cp(m);x.seed=seed;assert.ok(replay(t,x));}
 const x=cp(m);x.prose='x'.repeat(1200);assert.equal(M.valid(t,x),true);assert.ok(replay(t,x));
});

test('only canonical original button metadata and closed event shapes can contribute evidence',()=>{
 const c=fixture.cases[0],t=at(c),m=build(t);
 for(const index of ['00','0e0','-0',' 0','',0]){const bad=cp(m);bad.history[0].d.index=index;if(typeof index==='string')assert.equal(M.valid(t,bad),true);reject(t,bad);}
 for(const mutate of [x=>x.history[0].extra=true,x=>x.history[0].f.extra=true,x=>x.history[0].d.extra='x',x=>x.history.at(-1).d.index='',x=>x.history.at(-1).extra=true]){const bad=cp(m);mutate(bad);reject(t,bad);}
 for(const actionName of ['help','align','tool','select','convert']){const bad=cp(m);M.act(t,bad,'m28-'+actionName);assert.equal(M.valid(t,bad),true);assert.equal(M.inspect(t,bad).correct,true);reject(t,bad);}
 const hiddenUnit=cp(m);hiddenUnit.history.unshift({a:'record',d:{},f:{measure:'4',unit:'hidden'}});hiddenUnit.board.first.measure='4';hiddenUnit.board.bad=true;oldOnly(t,hiddenUnit);
});

test('board and placement attribution must be exactly derived from the complete retained action history',()=>{
 const c=fixture.cases[0],t=at(c),m=build(t);
 for(const mutate of [x=>x.history.shift(),x=>x.history.pop(),x=>x.board.positions.pop(),x=>x.board.positions.reverse(),x=>x.board.bad=true,x=>x.board.first.measure='5',x=>x.board.saved.measure='4.0',x=>x.history.splice(0,0,{a:'place',d:{index:'7'},f:{}})]){const bad=cp(m);mutate(bad);reject(t,bad);}
 const sparse=cp(m);delete sparse.history[0];reject(t,sparse);const extra=cp(m);extra.history.extra=true;reject(t,extra);assert.ok(replay(t,m));
});

test('the original 2000 action cap is a model no-op and does not manufacture a new saved spelling',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);while(m.history.length<2000)M.act(t,m,'m28-record');assert.equal(M.valid(t,m),true);let p=replay(t,m);assert.ok(p);assert.equal(p.historyAtCapacity,true);assert.equal(p.historyLimit,2000);assert.equal(p.limitBehavior,'whole-model-action-no-op-with-controller-metadata-write');
  const before=cp(m);for(const [actionName,data]of [['m28-clear',{}],['m28-place',{index:'0'}],['m28-record',{}]]){M.act(t,m,actionName,data);assert.deepEqual(m,before);}
  field(t,m,'measure',m.measure+'.0');const draft=cp(m);M.act(t,m,'m28-record');assert.deepEqual(m,draft);reject(t,m);field(t,m,'measure',before.measure);assert.ok(replay(t,m));
  const over=cp(m);over.history.push(cp(over.history.at(-1)));assert.equal(M.valid(t,over),false);reject(t,over);
 }
});

test('old attempts, support/exposure, notes and draft survive current clear and genuine shared-retry eligibility',()=>{
 for(const c of fixture.cases){const t=at(c),a=State.freshLesson(c.id);a.index=c.index;a.models[c.index]=M.initial(t);const m=a.models[c.index];assert.equal(retryTags(a).length,0);save(t,m,String(c.math.count+1),'cm');State.supportLesson(a);State.submitLesson(a);assert.equal(retryTags(a).length,1);build(t,m);State.submitLesson(a);assert.equal(a.cases[c.index].attempts[0].supported,true);assert.equal(a.cases[c.index].attempts[1].exposed,true);const prior=cp(a.cases);State.addLessonNote(a,'原有笔记');a.draft='保留草稿';const notes=cp(a.notes),draft=a.draft;
  action(t,m,'m28-clear');assert.equal(State.currentSubmission(a).status,'modified');assert.equal(State.lessonSummary(a).cases[c.index].complete,true);assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);reject(t,m);
  // The real shared handler replaces only this current model. The navigation
  // test executes that unchanged handler; this test fixes its State invariant.
  a.models[c.index]=defaultModel(t);assert.deepEqual(a.cases,prior);assert.deepEqual(a.notes,notes);assert.equal(a.draft,draft);assert.deepEqual(a.models[c.index].board.first,{});assert.equal(a.models[c.index].board.bad,false);assert.equal(retryTags(a).length,1);build(t,a.models[c.index]);State.submitLesson(a);assert.deepEqual(a.cases[c.index].attempts.slice(0,-1),prior[c.index].attempts);assert.equal(latestSubmissionMatches(a.models[c.index],a.cases[c.index]),true);
 }
});

test('the complete original state and repeated v2 restore preserve near-success, failure, clear and corrected attempts',()=>{
 const s=Core.fresh();let time=0;
 for(const c of fixture.cases){const t=at(c),a=s.lessons[c.id]||=State.freshLesson(c.id);a.index=c.index;a.models[c.index]=build(t);save(t,a.models[c.index],c.math.count+'.00000001');assert.equal(State.submitLesson(a).correct,true);reject(t,a.models[c.index]);save(t,a.models[c.index]);State.submitLesson(a);action(t,a.models[c.index],'m28-clear');State.submitLesson(a);build(t,a.models[c.index]);State.submitLesson(a);a.updatedAt=new Date(Date.UTC(2026,10,16)+time++).toISOString();}
 Core.validate(s,atlas);const before=JSON.stringify(s),backup=JSON.stringify(Core.backup(cp(s))),parsed=Core.parseBackup(backup,atlas);assert.deepEqual(parsed,s);const merged=Core.merge(Core.fresh(),parsed,atlas);assert.deepEqual(merged,s);assert.deepEqual(Core.merge(cp(merged),Core.parseBackup(backup,atlas),atlas),s);assert.equal(JSON.stringify(s),before);
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};Storage.writeStored(Core.KEY,JSON.stringify(merged),storage);const raw=store.get(Core.KEY);Storage.writeStored(Core.KEY,JSON.stringify(Core.merge(cp(merged),parsed,atlas)),storage);assert.equal(store.get(Core.KEY),raw);
 const bad=JSON.parse(backup);bad.state.lessons.lengthstart.models[0].prose='x'.repeat(1201);assert.throws(()=>Core.parseBackup(JSON.stringify(bad),atlas));assert.equal(store.get(Core.KEY),raw);
});

test('exactly one bounded registry contract and current native submission gate the optional feedback',()=>{
 const adapter=EVIDENCE_ADAPTERS.filter(a=>a.id==='unitcover');assert.equal(adapter.length,1);assert.equal(adapter[0].type,'x-m28-units');assert.equal(adapter[0].binding,binding);assert.equal(adapter[0].replay,replay);
 for(const c of fixture.cases){const t=at(c),m=build(t),record={support:false,attempts:[{value:cp(m)}]};assert.ok(thinkingGuide(t,context(c)));const f=thinkingFeedback(t,m,record,context(c));assert.ok(f);assert.equal(f.method,null);assert.match(JSON.stringify(f),/工具提供/);assert.match(JSON.stringify(f),/每个小格只盖一次/);assert.doesNotMatch(JSON.stringify(f),/此前提交/);
  for(const bad of [null,{}, {attempts:[]},{attempts:[{value:null}]},{attempts:[{value:cp(m)},{value:M.initial(t)}]}])assert.equal(thinkingFeedback(t,m,bad,context(c)),null);
  field(t,m,'prose','当前可见原话');assert.equal(thinkingFeedback(t,m,record,context(c)),null);record.attempts.push({value:cp(m)});record.support=true;const latest=thinkingFeedback(t,m,record,context(c));assert.ok(latest);assert.match(JSON.stringify(latest),/此前提交原样保留/);assert.match(JSON.stringify(latest),/你看过提示或比较反馈/);
 }
 for(const c of [...fixture.associated,...fixture.practice]){const t=at(c),m=build(t);assert.equal(thinkingGuide(t,context(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:cp(m)}]},context(c)),null);}
});

test('feedback preserves first near-success raw and distinguishes an internal rebuild from a prior submission',()=>{
 const c=fixture.cases[0],t=at(c),m=M.initial(t);save(t,m,'4.00000001');action(t,m,'m28-clear');build(t,m);const record={attempts:[{value:cp(m)}]},f=thinkingFeedback(t,m,record,context(c));assert.ok(f);assert.match(JSON.stringify(f),/4\.00000001/);assert.match(JSON.stringify(f),/没有替换最早的原文/);assert.match(JSON.stringify(f),/取回和清空/);assert.doesNotMatch(JSON.stringify(f),/此前提交|最早.*(?:错了|失败|不正确)/);
 save(t,m,'');field(t,m,'measure','4');record.attempts.push({value:cp(m)});assert.ok(thinkingFeedback(t,m,record,context(c)));assert.equal(m.issue,'先数一数，写下用了几个单位。');
});
