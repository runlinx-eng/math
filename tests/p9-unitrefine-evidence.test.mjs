import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-unitrefine-cases.cjs';
import * as M from '../dist/learning/phase5/b28-model.js';
import * as V from '../dist/learning/phase5/b28-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {PRACTICE,defaultModel,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {unitrefineBinding as binding,replayUnitrefineEvidence as replay} from '../dist/learning/unitrefine-evidence.js';
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
function field(t,m,key,value){
 const html=V.controls(t,m),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-xfield']===key);
 assert.equal(tags.length,1,'one original visible field '+key);assert.doesNotMatch(tags[0],/\bdisabled\b|\breadonly\b/);
 if(tags[0].startsWith('<select')){const start=html.indexOf(tags[0]),body=html.slice(start,html.indexOf('</select>',start));assert.ok([...body.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)),'select really offers '+value);}
 const [root,index]=key.split('.');if(index===undefined)m[root]=String(value);else m[root][Number(index)]=String(value);M.field(t,m,key);assert.equal(M.valid(t,m),true);return m;
}
function action(t,m,name,index){
 const tags=[...V.controls(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-x']===name&&(index===undefined?attrs(x)['data-index']===undefined:attrs(x)['data-index']===String(index)));
 assert.equal(tags.length,1,'one original visible action '+name+':'+index);assert.doesNotMatch(tags[0],/\bdisabled\b/);
 M.act(t,m,name,index===undefined?{}:{index:String(index)});assert.equal(M.valid(t,m),true);return m;
}
function save(t,m,raw=String(m.board.count)){field(t,m,'measure',raw);action(t,m,'m28-record');return m;}
function buildSize(t,m,size,raw){action(t,m,'m28-size',size);for(let i=0;i<Number(BigInt(t.total)/BigInt(size));i++)action(t,m,'m28-add');save(t,m,raw);return m;}
function build(t,m=M.initial(t),reverse=false){for(const u of reverse?[...t.sizes].reverse():t.sizes)buildSize(t,m,u.size);field(t,m,'answers.0','more');return m;}
const reject=(t,m)=>assert.equal(replay(t,m),null);
const oldOnly=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);reject(t,m);};
function retryTags(a){const host={innerHTML:''};renderP3Flow(host,{atlas,id:a.id,record:a});return [...host.innerHTML.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-do']==='p3-retry');}

test('three native positions, one associated copy, one practice and twenty stable source hashes are exact',()=>{
 for(const[file,sha]of Object.entries(fixture.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 assert.equal(Object.keys(fixture.sourceHashes).length,20);
 for(const c of [...fixture.cases,...fixture.associated,...fixture.practice]){assert.deepEqual(at(c),c.task);assert.equal(hash(at(c)),c.taskHash);}
 const native=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-m28-refine'?[id+':'+index]:[]));
 const associated=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-m28-refine'?[id+':'+index]:[]));
 assert.deepEqual(native.sort(),fixture.cases.map(c=>c.id+':'+c.index).sort());assert.equal(native.length,3);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,1);
 assert.deepEqual(associated.sort(),fixture.associated.map(c=>c.id+':'+c.index).sort());assert.equal(associated.length,1);
 assert.deepEqual(Object.keys(PRACTICE).filter(id=>PRACTICE[id].type==='x-m28-refine').sort(),fixture.practice.map(c=>c.id).sort());assert.equal(fixture.practice.length,1);
});

for(const c of fixture.cases)test(c.id+':'+c.index+' proves both exact whole-unit records and actual remainders in either size order',()=>{
 for(const reverse of [false,true]){const t=at(c),m=build(t,M.initial(t),reverse),before=cp(m),p=replay(t,m);assert.ok(p);assert.deepEqual(m,before);assert.equal(p.kind,'unitrefine');assert.equal(p.eventCount,m.history.length);
  assert.deepEqual(p.construction.runs.map(({size,label,count,remainder})=>({size,label,count,remainder})),c.math.quantities);
  for(const r of p.construction.runs){assert.equal(BigInt(r.count)*BigInt(r.size)+BigInt(r.remainder),BigInt(t.total));assert.ok(r.remainder>=0&&r.remainder<r.size);assert.equal(r.count,Number(BigInt(t.total)/BigInt(r.size)));assert.equal(m.history[r.recordedAt].a,'record');assert.equal(m.history[r.recordedAt].f.measure,r.rawCount);assert.equal(m.history[r.selectedAt].a,'size');assert.equal(m.history[r.selectedAt].d.index,String(r.size));assert.equal(r.additionIndices.length,r.count);for(const index of r.additionIndices){assert.ok(index>r.selectedAt&&index<r.recordedAt);assert.equal(m.history[index].a,'add');}assert.equal(r.quantity.denominator,'1');assert.equal(r.quantity.numerator,String(r.count));}
  assert.equal(p.construction.current.size,(reverse?t.sizes[0]:t.sizes.at(-1)).size);assert.equal(p.construction.hadOriginalBad,false);assert.equal(binding(t,context(c)).nodeId,c.nodeId);assert.equal(binding(t,context(c)).method,null);
  for(const key of ['independentCountingAssessed','independentPositioningAssessed','independentDivisionProcessAssessed','physicalMeasurementAssessed','generalUnitChoiceReasoningAssessed','freeExplanationAssessed','generalMasteryAssessed'])assert.equal(p[key],false);
  assert.equal(p.construction.toolProvidedDimensions,true);assert.equal(p.construction.toolPlacedUnitsSequentially,true);assert.equal(p.construction.toolDisplayedCount,true);assert.equal(p.construction.toolDisplayedRemainder,true);
  const rects=[...V.visual(t,m).matchAll(/<rect\b[^>]*>/g)].map(x=>attrs(x[0]));assert.equal(rects.length,m.board.count+1);assert.equal(Number(rects[0].width),t.total*48);for(let i=1;i<rects.length;i++){assert.equal(Number(rects[i].width),m.board.size*48);assert.equal(Number(rects[i].x),100+(i-1)*m.board.size*48);}
 }
});

test('whole source literals and native contexts are required; copied associated and practice tasks do not bind',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);for(const bad of [null,{},[],{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},{sessionId:c.id,index:.5},{sessionId:'__proto__',index:c.index},{sessionId:[c.id],index:c.index}])assert.equal(binding(t,bad),null);
  for(const key of ['prompt','object']){const changed=cp(t);changed[key]+='!';assert.equal(binding(changed,context(c)),null);reject(changed,m);}
  for(const alter of [x=>x.total++,x=>x.sizes[0].size++,x=>x.sizes.reverse(),x=>x.questions[0].value='less',x=>x.extra=true]){const changed=cp(t);alter(changed);assert.equal(binding(changed,context(c)),null);reject(changed,m);}
 }
 for(const c of [...fixture.associated,...fixture.practice])assert.equal(binding(at(c),context(c)),null);
});

test('all five original examples remain valid without a new helper; units, vessels and ruler stay outside this contract',()=>{
 for(const c of [...fixture.cases,...fixture.associated,...fixture.practice]){const t=at(c),m=exampleModel(t),before=cp(m);assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);assert.ok(replay(t,m));assert.deepEqual(m,before);}
 for(const [id,index]of [['precisionunits',1],['link-sameunitlength-precisionunits',0],['twounits',0]]){const t=sessionTaskFor(id,index);assert.notEqual(t.type,'x-m28-refine');reject(t,exampleModel(t));assert.equal(binding(t,{sessionId:id,index}),null);}
});

test('unselected add and record preserve first, while the first selected blank failure remains literal',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);action(t,m,'m28-add');assert.equal(m.issue,'先选一种单位。');action(t,m,'m28-record');assert.equal(m.issue,'先选单位、放上去。');assert.deepEqual(m.board.first,{});assert.equal(m.board.bad,false);action(t,m,'m28-size',t.sizes[0].size);save(t,m,'');assert.equal(m.board.first['count'+t.sizes[0].size],'');assert.equal(m.board.bad,true);build(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.construction.firstRecords[0].raw,'');assert.equal(p.construction.firstRecords[0].originalAccepted,false);assert.equal(p.construction.firstRecords[0].index,3);assert.equal(p.construction.hadOriginalBad,true);assert.equal(p.records[0].size,null);}
});

test('a selected partial numeric record fails even when its entered number matches the current count',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t),size=t.sizes[0].size;action(t,m,'m28-size',size);action(t,m,'m28-add');save(t,m,'1');assert.equal(m.board.runs.length,0);assert.equal(m.board.bad,true);reject(t,m);build(t,m);const p=replay(t,m),first=p.construction.firstRecords[0];assert.equal(first.raw,'1');assert.equal(first.originalNearPlacedCount,true);assert.equal(first.originalAccepted,false);assert.equal(first.exactFullCount,false);}
});

test('old near-success current text and saved near-success text are separate exactness failures',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),n=m.board.count;field(t,m,'measure',n+'.00000001');oldOnly(t,m);field(t,m,'measure',String(n));assert.ok(replay(t,m));save(t,m,n+'.00000001');assert.equal(m.board.bad,false);field(t,m,'measure',String(n));oldOnly(t,m);save(t,m);assert.ok(replay(t,m));}
});

test('a noncurrent near-success surviving run must be rebuilt exactly, despite exact current text and unchanged numeric run data',()=>{
 for(const c of fixture.cases)for(const order of [c.task.sizes,[...c.task.sizes].reverse()]){const t=at(c),m=M.initial(t),a=order[0],b=order[1];buildSize(t,m,a.size,Number(BigInt(t.total)/BigInt(a.size))+'.00000001');buildSize(t,m,b.size);field(t,m,'answers.0','more');oldOnly(t,m);assert.equal(m.board.bad,false);save(t,m);oldOnly(t,m);const oldRuns=cp(m.board.runs);buildSize(t,m,a.size);assert.ok(replay(t,m));assert.deepEqual([...m.board.runs].sort((x,y)=>x.size-y.size),oldRuns.sort((x,y)=>x.size-y.size));assert.match(replay(t,m).construction.firstRecords.find(x=>x.size===a.size).raw,/\.00000001$/);}
});

test('equivalent exact current spellings need no new record, but the full current model must be submitted again',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),record={attempts:[{value:cp(m)}]},history=cp(m.history),runs=cp(m.board.runs),n=m.board.count;
  for(const raw of [n+'.0','  '+n+'  ',(n*2)+'/2',(n-1)+' 2/2','0'.repeat(1180)+n]){field(t,m,'measure',raw);assert.ok(replay(t,m));assert.deepEqual(m.history,history);assert.deepEqual(m.board.runs,runs);assert.equal(latestSubmissionMatches(m,record),false);}
  record.attempts.push({value:cp(m)});assert.equal(latestSubmissionMatches(m,record),true);
 }
});

test('source-supported exact count spellings work in successful records; unsupported or wrong numbers do not',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),n=m.board.count;for(const raw of [String(n),n+'.00',(n*3)+'/3',(n-1)+' 4/4','\t'+n+'\n']){save(t,m,raw);const p=replay(t,m);assert.ok(p);assert.equal(p.construction.runs.find(r=>r.size===m.board.size).rawCount,raw);}
  for(const raw of ['',String(n+1),'-'+n,'+'+n,n+'e0',n+'/0','0/0','Infinity','NaN',n+'.00000001']){save(t,m,raw);reject(t,m);save(t,m,String(n));assert.ok(replay(t,m));}
 }
});

test('failed blank records and overflow retain exact saved runs, and restoring the current count preserves the real terminal issue',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),runs=cp(m.board.runs),n=m.board.count;save(t,m,'');assert.deepEqual(m.board.runs,runs);reject(t,m);field(t,m,'measure',String(n));let p=replay(t,m);assert.ok(p);assert.equal(p.issue,'先把能放下的完整单位排满，再数一数。');assert.equal(p.records.at(-1).originalAccepted,false);action(t,m,'m28-add');assert.deepEqual(m.board.runs,runs);p=replay(t,m);assert.ok(p);assert.equal(p.issue,'放不下完整的一块，看看还剩多少。');assert.equal(p.overflows.at(-1).retainedRecord,p.construction.runs.find(r=>r.size===m.board.size).recordedAt);}
});

test('positive remove and re-add invalidate only the current run until a real save; zero remove is an enabled recorded no-op',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),size=m.board.size,other=cp(m.board.runs.find(r=>r.size!==size));action(t,m,'m28-remove');assert.deepEqual(m.board.runs,[other]);reject(t,m);action(t,m,'m28-add');assert.deepEqual(m.board.runs,[other]);reject(t,m);save(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.removals.at(-1).effect,true);assert.equal(p.events[p.removals.at(-1).removedAddition].action,'add');assert.ok(!p.construction.current.additionIndices.includes(p.removals.at(-1).removedAddition));
  const empty=M.initial(t);action(t,empty,'m28-remove');assert.equal(empty.history.length,1);assert.deepEqual(empty.board,M.initial(t).board);build(t,empty);assert.equal(replay(t,empty).removals[0].effect,false);
 }
});

test('rechoosing the same size resets only that run and keeps the other record, first raw, bad and visible text',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);action(t,m,'m28-size',t.sizes[0].size);save(t,m,'wrong');build(t,m);const first=cp(m.board.first),bad=m.board.bad,other=cp(m.board.runs.find(r=>r.size!==m.board.size)),raw=m.measure,history=cp(m.history);action(t,m,'m28-size',m.board.size);assert.equal(m.board.count,0);assert.deepEqual(m.board.runs,[other]);assert.deepEqual(m.board.first,first);assert.equal(m.board.bad,bad);assert.equal(m.measure,raw);assert.deepEqual(m.history.slice(0,-1),history);reject(t,m);buildSize(t,m,m.board.size);assert.ok(replay(t,m));assert.deepEqual(m.board.first,first);}
});

test('only three visible fields and five source buttons supply exact canonical history metadata',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),controls=V.controls(t,m);assert.deepEqual([...controls.matchAll(/data-xfield="([^"]+)"/g)].map(x=>x[1]).sort(),['answers.0','measure','prose']);assert.equal([...controls.matchAll(/<button\b/g)].length,5);
  for(const e of m.history){assert.deepEqual(Object.keys(e).sort(),['a','d','f']);if(e.a==='size'){assert.deepEqual(Object.keys(e.d),['index']);assert.ok(t.sizes.some(u=>e.d.index===String(u.size)));}else assert.deepEqual(e.d,{});assert.deepEqual(Object.keys(e.f).sort(),e.a==='record'?['measure','unit']:[]);if(e.a==='record')assert.equal(e.f.unit,'');}
 }
});

test('old grade-true hidden fields, invented issue, foreign actions and noncanonical event data fail closed',()=>{
 const mutations=[m=>m.extra=true,m=>m.offset='0',m=>m.estimate='1',m=>m.error='0',m=>m.unit='块',m=>m.issue='invented',m=>m.history[0].extra=true,m=>m.history.find(e=>e.a==='add').d.index='',m=>m.history.find(e=>e.a==='size').d.index='0'+m.history.find(e=>e.a==='size').d.index,m=>m.history.find(e=>e.a==='record').f.unit='块',m=>m.history.push({a:'tool',d:{},f:{}})];
 for(const c of [...fixture.cases,...fixture.associated,...fixture.practice])for(const reverse of [false,true]){const t=at(c),good=build(t,M.initial(t),reverse);for(const alter of mutations){const m=cp(good);alter(m);oldOnly(t,m);}for(const alter of [m=>m.board.count++,m=>m.board.runs[0].remainder++,m=>m.history.pop(),m=>m.history[0].f.hidden='',m=>m.board.first.extra='',m=>m.answers[0]='invalid',m=>m.seed=0,m=>m.prose='x'.repeat(1201)]){const m=cp(good);alter(m);reject(t,m);}}
});

test('the visible wrong or blank more-choice and changed prose remain current-model concerns',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);for(const wrong of ['less','']){field(t,m,'answers.0',wrong);assert.equal(M.inspect(t,m).correct,false);reject(t,m);}field(t,m,'answers.0','more');field(t,m,'prose','小单位排得更细；这是我写下的原话。');const p=replay(t,m);assert.ok(p);assert.equal(p.prose,m.prose);assert.equal(p.freeExplanationAssessed,false);}
});

test('2000 source actions cap the entire model; editing still works and must not be confused with the controller write boundary',()=>{
 for(const c of fixture.cases){const t=at(c); // Construct the cap through original events, not by seeding a board.
  const cap=build(t);while(cap.history.length<1999){M.act(t,cap,'m28-add');}M.act(t,cap,'m28-record');assert.equal(cap.history.length,2000);assert.equal(M.valid(t,cap),true);const before=cp(cap),p=replay(t,cap);assert.ok(p);assert.equal(p.historyAtCapacity,true);assert.equal(p.historyLimit,2000);assert.equal(p.limitBehavior,'whole-model-action-no-op-with-controller-metadata-write');
  for(const [name,index]of [['m28-size',t.sizes[0].size],['m28-add'],['m28-remove'],['m28-record']]){action(t,cap,name,index);assert.deepEqual(cap,before);}
  field(t,cap,'measure',String(cap.board.count+1));reject(t,cap);action(t,cap,'m28-record');reject(t,cap);field(t,cap,'measure',before.measure);assert.ok(replay(t,cap));assert.deepEqual(cap,before);const over=cp(cap);over.history.push(cp(over.history.at(-1)));assert.equal(M.valid(t,over),false);reject(t,over);
 }
});

test('old failed and near-success attempts, support, notes and draft survive a fresh current retry model',()=>{
 for(const c of fixture.cases){const t=at(c),a=State.freshLesson(c.id);a.index=c.index;a.models[c.index]=M.initial(t);assert.equal(retryTags(a).length,0);let m=a.models[c.index];action(t,m,'m28-size',t.sizes[0].size);save(t,m,'');State.supportLesson(a);assert.equal(State.submitLesson(a).correct,false);assert.equal(retryTags(a).length,1);build(t,m);save(t,m,m.board.count+'.00000001');assert.equal(State.submitLesson(a).correct,true);reject(t,m);save(t,m);State.submitLesson(a);const cases=cp(a.cases);State.addLessonNote(a,'保留旧的单位记录笔记');a.draft='重建前的草稿';const notes=cp(a.notes),draft=a.draft;action(t,m,'m28-size',m.board.size);assert.equal(State.currentSubmission(a).status,'modified');assert.equal(State.lessonSummary(a).cases[c.index].complete,true);assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);
  // The navigation test executes the original shared handler; this fixes its
  // unchanged State invariant without pretending a reset button exists here.
  a.models[c.index]=defaultModel(t);assert.deepEqual(a.cases,cases);assert.deepEqual(a.notes,notes);assert.equal(a.draft,draft);assert.deepEqual(a.models[c.index].board.first,{});assert.equal(a.models[c.index].board.bad,false);build(t,a.models[c.index],true);State.submitLesson(a);assert.deepEqual(a.cases[c.index].attempts.slice(0,-1),cases[c.index].attempts);assert.equal(a.cases[c.index].attempts[0].supported,true);assert.equal(a.cases[c.index].attempts.at(-1).exposed,true);assert.equal(latestSubmissionMatches(a.models[c.index],a.cases[c.index]),true);
 }
});

test('full original State and repeated v2 merge preserve old near-success, failed, terminal-issue and corrected snapshots',()=>{
 const s=Core.fresh();let time=0;
 for(const c of fixture.cases){const t=at(c),a=s.lessons[c.id]||=State.freshLesson(c.id);a.index=c.index;a.models[c.index]=build(t);const m=a.models[c.index];save(t,m,m.board.count+'.00000001');assert.equal(State.submitLesson(a).correct,true);reject(t,m);save(t,m);State.submitLesson(a);save(t,m,'');State.supportLesson(a);assert.equal(State.submitLesson(a).correct,false);field(t,m,'measure',String(m.board.count));assert.ok(replay(t,m));State.submitLesson(a);State.addLessonNote(a,'保留来源 '+c.index+' 的原笔记');a.draft='保留原草稿';a.updatedAt=new Date(Date.UTC(2026,10,16)+time++).toISOString();}
 Core.validate(s,atlas);const before=JSON.stringify(s),backup=JSON.stringify(Core.backup(cp(s))),parsed=Core.parseBackup(backup,atlas);assert.deepEqual(parsed,s);const merged=Core.merge(Core.fresh(),parsed,atlas);assert.deepEqual(merged,s);assert.deepEqual(Core.merge(cp(merged),Core.parseBackup(backup,atlas),atlas),s);assert.equal(JSON.stringify(s),before);
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};Storage.writeStored(Core.KEY,JSON.stringify(merged),storage);const raw=store.get(Core.KEY);Storage.writeStored(Core.KEY,JSON.stringify(Core.merge(cp(merged),parsed,atlas)),storage);assert.equal(store.get(Core.KEY),raw);const bad=JSON.parse(backup);bad.state.lessons.precisionunits.models[0].prose='x'.repeat(1201);assert.throws(()=>Core.parseBackup(JSON.stringify(bad),atlas));assert.equal(store.get(Core.KEY),raw);
});

test('one bounded registry entry and latest native full-model submission gate optional feedback',()=>{
 const adapters=EVIDENCE_ADAPTERS.filter(a=>a.id==='unitrefine');assert.equal(adapters.length,1);assert.equal(adapters[0].type,'x-m28-refine');assert.equal(adapters[0].binding,binding);assert.equal(adapters[0].replay,replay);
 for(const c of fixture.cases){const t=at(c),m=build(t),record={attempts:[{value:cp(m)}]};assert.ok(thinkingGuide(t,context(c)));const f=thinkingFeedback(t,m,record,context(c));assert.ok(f);assert.equal(f.method,null);assert.match(JSON.stringify(f),/工具/);assert.doesNotMatch(JSON.stringify(f),/此前提交/);
  for(const bad of [null,{}, {attempts:[]},{attempts:[{value:null}]},{attempts:[{value:cp(m)},{value:M.initial(t)}]}])assert.equal(thinkingFeedback(t,m,bad,context(c)),null);
  field(t,m,'measure',m.board.count+'.0');assert.ok(replay(t,m));assert.equal(thinkingFeedback(t,m,record,context(c)),null);record.attempts.push({value:cp(m)});record.support=true;assert.ok(thinkingFeedback(t,m,record,context(c)));
 }
 for(const c of [...fixture.associated,...fixture.practice]){const t=at(c),m=build(t);assert.equal(thinkingGuide(t,context(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:cp(m)}]},context(c)),null);}
});

test('feedback does not rewrite first blank or first near-success, invent a past submission, or assert an independent division process',()=>{
 const c=fixture.cases[0],t=at(c),m=M.initial(t);action(t,m,'m28-size',t.sizes[0].size);save(t,m,'');build(t,m);const record={attempts:[{value:cp(m)}]};assert.ok(thinkingFeedback(t,m,record,context(c)));assert.equal(replay(t,m).construction.firstRecords[0].raw,'');
 const near=M.initial(t);buildSize(t,near,t.sizes[0].size,'2.00000001');buildSize(t,near,t.sizes[1].size);field(t,near,'answers.0','more');assert.equal(thinkingFeedback(t,near,{attempts:[{value:cp(near)}]},context(c)),null);buildSize(t,near,t.sizes[0].size);const f=thinkingFeedback(t,near,{attempts:[{value:cp(near)}]},context(c));assert.ok(f);assert.equal(replay(t,near).construction.firstRecords[0].raw,'2.00000001');assert.doesNotMatch(JSON.stringify(f),/此前提交|最早.*(?:错了|失败|不正确)|独立完成除法|掌握.*测量/);
});
