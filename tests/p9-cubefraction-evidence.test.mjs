import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-cubefraction-cases.cjs';
import * as M from '../dist/learning/phase5/b31-model.js';
import * as V from '../dist/learning/phase5/b31-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {PRACTICE,voxels,inspect as inspectTask} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {cubeFractionBinding as binding,replayCubeFractionEvidence as replay} from '../dist/learning/cubefraction-evidence.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
await ensureB39Ready();
const cp=structuredClone,at=c=>sessionTaskFor(c.id,c.index),context=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=t=>digest(JSON.stringify(stable(t)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
function field(t,m,key,value){
 const html=V.render(t,m),controls=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(tag=>attrs(tag)['data-xfield']===key);
 assert.equal(controls.length,1,'one original visible field '+key);assert.doesNotMatch(controls[0],/\bdisabled\b|\breadonly\b/);
 if(controls[0].startsWith('<select')){const start=html.indexOf(controls[0]),body=html.slice(start,html.indexOf('</select>',start));assert.ok([...body.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)),'original visible select value');}
 setField(m,key,String(value));M.field(t,m,key);assert.equal(M.valid(t,m),true);
}
function action(t,m,name,index){
 const html=V.render(t,m),controls=[...html.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(tag=>attrs(tag)['data-x']===name&&(index===undefined||attrs(tag)['data-index']===String(index)));
 assert.equal(controls.length,1,'one original visible action '+name+' '+index);assert.doesNotMatch(controls[0],/\bdisabled\b/);
 const d=index===undefined?{}:{index};M.act(t,m,name==='turn-extra'?'m31-turn':name,d);assert.equal(M.valid(t,m),true);return m;
}
function fill(t,m){const total=t.grid.reduce((a,b)=>a*b,1);while(m.board.filled.length<total){const i=Array.from({length:total},(_,i)=>i).find(i=>!m.board.filled.includes(i));action(t,m,'m31-fill',i);}}
function plan(c,m){const t=at(c);for(const key of ['perLayer','layers','total'])field(t,m,key,c.math[key]);action(t,m,'m31-plan');}
function part(c,m){const t=at(c);for(const key of ['oneCube','base'])field(t,m,key,c.math[key]);action(t,m,'m31-part');}
function finish(c,m=M.initial(at(c))){const t=at(c);fill(t,m);if(!m.board.opened)action(t,m,'m31-spread');if(!m.board.turned)action(t,m,'turn-extra');if(!m.board.plan)plan(c,m);if(!m.board.part)part(c,m);field(t,m,'volume',c.math.volume);field(t,m,'product',c.math.volume);field(t,m,'unit',c.math.unit);return m;}
const record=m=>({attempts:[{value:cp(m)}]});
const rejects=(t,m)=>assert.equal(replay(t,m),null);
const originalButNotStrict=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejects(t,m);};

test('fixed source hashes, six original positions, four associated copies and two practice models are exact',()=>{
 for(const[file,sha]of Object.entries(fixture.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 for(const c of [...fixture.cases,...fixture.associated,...fixture.practice,...fixture.excluded]){assert.deepEqual(at(c),c.task);assert.equal(hash(at(c)),c.taskHash);}
 const native=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).flatMap((task,index)=>task.type==='x-m31-cubes'?[id+':'+index]:[]));
 const bridges=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).flatMap((task,index)=>task.type==='x-m31-cubes'?[id+':'+index]:[]));
 assert.deepEqual(native.sort(),fixture.cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(bridges.sort(),fixture.associated.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(Object.entries(PRACTICE).filter(([,t])=>t.type==='x-m31-cubes').map(([id])=>id).sort(),fixture.practice.map(c=>c.id).sort());
 assert.equal(native.length,6);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,4);assert.equal(bridges.length,4);assert.equal(fixture.practice.length,2);
});

for(const c of fixture.cases)test(c.id+':'+c.index+' preserves actual controls and independently fixed count/area/volume identities',()=>{
 const t=at(c),m=finish(c),before=cp(m),p=replay(t,m);assert.ok(p);assert.equal(M.inspect(t,m).correct,true);assert.deepEqual(m,before);
 const a=p.construction;assert.equal(a.total,c.math.total);assert.equal(a.perLayer,c.math.perLayer);assert.equal(a.layers,c.math.layers);assert.equal(a.edge.text,c.math.edge);
 assert.deepEqual(a.dimensions.map(q=>q.text),c.math.dimensions);assert.equal(a.oneCube.text,c.math.oneCube);assert.equal(a.base.text,c.math.base);assert.equal(a.volume.text,c.math.volume);
 assert.equal(a.countTimesCube.text,c.math.volume);assert.equal(a.baseTimesHeight.text,c.math.volume);assert.deepEqual(a.layerCounts,Array(c.math.layers).fill(c.math.perLayer));
 const coordinates=voxels({type:'cube-plan',dims:t.grid,build:true});assert.deepEqual(a.filledCells.map(x=>x.coordinate),coordinates);assert.deepEqual(a.filledCells.map(x=>x.index),coordinates.map((_,i)=>i));
 assert.equal(a.toolProvided,true);assert.equal(p.independentMultiplicationAssessed,false);assert.equal(p.physicalMeasurementAssessed,false);assert.equal(p.spatialMasteryAssessed,false);
 assert.equal(p.retainedHistoryOnly,true);assert.equal(p.historyAtCapacity,false);assert.equal(binding(t,context(c)).nodeId,c.nodeId);assert.equal(binding(t,context(c)).method,null);
 assert.ok(replay(t,M.example(t)),'unchanged original B31 example remains sufficient without a new audit helper');
});

test('full source identity is mandatory; a copied widget, changed wording or malformed position cannot self-authorize',()=>{
 for(const c of fixture.cases){const t=at(c);for(const v of [null,{},[],{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},{sessionId:c.id,index:c.index+.1},{sessionId:'__proto__',index:c.index}])assert.equal(binding(t,v),null);
  for(const mutate of [x=>x.prompt+=' changed',x=>x.grid=[1,1,1],x=>x.den*=2,x=>x.unit='ft',x=>x.extra=true]){const other=cp(t);mutate(other);assert.equal(binding(other,context(c)),null);rejects(other,finish(c));}}
 for(const c of [...fixture.associated,...fixture.practice]){const t=at(c),m=finish(c);assert.ok(replay(t,m));assert.equal(binding(t,context(c)),null);assert.equal(thinkingGuide(t,context(c)),null);assert.equal(thinkingFeedback(t,m,record(m),context(c)),null);}
 const c=fixture.excluded[0],t=at(c),m=M.initial(t);for(const step of c.plan)step.field?field(t,m,step.field,step.value):action(t,m,step.action);assert.equal(M.inspect(t,m).correct,true);rejects(t,m);assert.equal(binding(t,context(c)),null);
});

test('fill before the first spread can visibly fail plan, then correct without rewriting first fields or bad state',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);fill(t,m);plan(c,m);assert.equal(m.board.plan,null);assert.ok(m.issue);assert.equal(m.board.bad,true);const first=cp(m.board.first);
  const good=finish(c,m),p=replay(t,good);assert.ok(p);assert.equal(p.construction.failedPlans,1);assert.deepEqual(good.board.first.plan,first.plan);assert.equal(good.board.bad,true);assert.equal(good.issue,'');assert.equal(p.events.find(x=>x.action==='m31-plan').outcome,'visible-plan-failure');}
});

test('wrong or blank visible plan counts and edge-as-volume part mistakes survive genuine correction',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);fill(t,m);action(t,m,'m31-spread');action(t,m,'turn-extra');
  field(t,m,'perLayer','');field(t,m,'layers','99');field(t,m,'total','-1');action(t,m,'m31-plan');const firstPlan=cp(m.board.first.plan);assert.ok(m.issue);plan(c,m);
  field(t,m,'oneCube',c.math.edge);field(t,m,'base',c.math.base);action(t,m,'m31-part');const firstPart=cp(m.board.first.part);assert.ok(m.issue);assert.equal(m.board.part,null);finish(c,m);
  const p=replay(t,m);assert.ok(p);assert.equal(p.construction.failedPlans,1);assert.equal(p.construction.failedParts,1);assert.deepEqual(p.construction.first,{plan:firstPlan,part:firstPart});assert.equal(m.board.bad,true);
  const feedback=thinkingFeedback(t,m,record(m),context(c));assert.ok(JSON.stringify(feedback).includes('第一次填写'));assert.ok(JSON.stringify(feedback).includes('保存未通过'));}
});

test('empty remove is a visible recorded no-op and clears the current issue without erasing first failures',()=>{
 const c=fixture.cases[0],t=at(c),m=M.initial(t);action(t,m,'m31-remove');assert.equal(m.history.length,1);assert.deepEqual(m.board.filled,[]);finish(c,m);
 const p=replay(t,m);assert.ok(p);assert.equal(p.construction.emptyRemovals,1);assert.equal(p.events[0].outcome,'visible-empty-no-op');assert.equal(p.events[0].beforeCount,0);assert.equal(p.events[0].afterCount,0);
});

test('taking back a filled cell clears plan and part, preserves first data and exposes new saving only after rebuilding',()=>{
 for(const c of fixture.cases){const t=at(c),m=finish(c),first=cp(m.board.first),old=cp(m);action(t,m,'m31-remove');assert.equal(m.board.plan,null);assert.equal(m.board.part,null);assert.doesNotMatch(V.render(t,m),/data-x="m31-plan"|data-xfield="volume"/);rejects(t,m);
  assert.equal(m.perLayer,old.perLayer);assert.equal(m.oneCube,old.oneCube);finish(c,m);const p=replay(t,m);assert.ok(p);assert.deepEqual(m.board.first,first);assert.equal(p.events.filter(e=>e.outcome==='cell-removed').length,1);assert.equal(p.construction.total,c.math.total);}
});

test('a retained open then closed layer state is valid but any unsubmitted spread invalidates latest feedback',()=>{
 const c=fixture.cases[1],t=at(c),m=finish(c),r=record(m);assert.ok(thinkingFeedback(t,m,r,context(c)));action(t,m,'m31-spread');assert.equal(m.board.spread,false);assert.equal(m.board.opened,true);
 const p=replay(t,m);assert.ok(p);assert.equal(p.construction.currentlySpread,false);assert.equal(thinkingFeedback(t,m,r,context(c)),null);assert.equal(latestSubmissionMatches(m,r),false);
 r.attempts.push({value:cp(m)});assert.ok(JSON.stringify(thinkingFeedback(t,m,r,context(c))).includes('各层已合起'));
});

test('each turn is only a retained request; repeated turns do not fabricate camera coverage or a new cell',()=>{
 const c=fixture.cases[0],t=at(c),m=finish(c),cells=cp(m.board.filled);action(t,m,'turn-extra');action(t,m,'turn-extra');const p=replay(t,m);assert.ok(p);assert.equal(p.construction.turnRequests,3);assert.deepEqual(m.board.filled,cells);
 assert.equal(Object.hasOwn(p.construction,'facesSeen'),false);assert.equal(p.spatialMasteryAssessed,false);
});

test('nonsequential original canvas-callback cell identities retain exact grid/layer mapping without claiming real hit-testing',()=>{
 const c=fixture.cases[1],t=at(c),m=M.initial(t);for(let i=c.math.total-1;i>=0;i--)M.act(t,m,'m31-fill',{index:i});finish(c,m);const p=replay(t,m);assert.ok(p);
 assert.deepEqual(p.construction.filledCells.map(x=>x.index),Array.from({length:c.math.total},(_,i)=>c.math.total-1-i));assert.deepEqual(p.construction.layerCounts,Array(5).fill(6));
 action(t,m,'m31-remove');assert.equal(m.board.filled.includes(0),false);finish(c,m);assert.ok(replay(t,m));
});

test('hidden plan and part controls cannot create accepted strict events although the old validator retains such records',()=>{
 const c=fixture.cases[0],t=at(c);
 for(const early of ['m31-plan','m31-part']){const m=M.initial(t);assert.doesNotMatch(V.render(t,m),new RegExp('data-x="'+early+'"'));M.act(t,m,early);finish(c,m);originalButNotStrict(t,m);}
 for(const duplicate of ['m31-plan','m31-part']){const m=finish(c);assert.doesNotMatch(V.render(t,m),new RegExp('data-x="'+duplicate+'"'));M.act(t,m,duplicate);if(!m.board.part)M.act(t,m,'m31-part');originalButNotStrict(t,m);}
});

test('current hidden plan/part roots must match the last real save byte for byte',()=>{
 for(const c of fixture.cases)for(const key of ['perLayer','layers','total','oneCube','base']){const t=at(c),m=finish(c);assert.doesNotMatch(V.render(t,m),new RegExp('data-xfield="'+key+'"'));m[key]+=' ';originalButNotStrict(t,m);}
});

test('foreign B31 actions and noncanonical or duplicate fill indices remain compatible original data but receive no strict proof',()=>{
 const c=fixture.cases[0],t=at(c);
 for(const a of ['m31-clear','m31-add','m31-reset','m31-guess','m31-record','m31-meter']){const m=finish(c);M.act(t,m,a);originalButNotStrict(t,m);}
 for(const i of ['00','0.0','+0','','-1','8','1e0','1.2']){const m=M.initial(t);M.act(t,m,'m31-fill',{index:i});finish(c,m);originalButNotStrict(t,m);}
 const m=finish(c);M.act(t,m,'m31-fill',{index:0});originalButNotStrict(t,m);
});

test('replay checks issue, unused roots, exact board/event shapes and full types independently of the broad original validator',()=>{
 const c=fixture.cases[0],t=at(c),good=finish(c);
 for(const key of ['estimate','count','amount','step','reading']){const m=cp(good);m[key]='1';originalButNotStrict(t,m);}
 const issue=cp(good);issue.issue='unrecorded warning';originalButNotStrict(t,issue);
 for(const mutate of [m=>m.extra=1,m=>m.answers.push('1'),m=>m.answers.extra=1,m=>m.history[0].extra=1,m=>m.history[0].f.extra='',m=>m.history[0].i=0,m=>m.history[0].a=0,m=>m.history[0].f=[],m=>m.history.extra=1,m=>m.board.extra=1,m=>m.board.first.plan.extra='',m=>m.board.bad=true,m=>m.board.turned=false,m=>m.history.splice(0,1)]){
  const m=cp(good);mutate(m);rejects(t,m);
 }
 for(const m of [null,[],{},true,'1'])rejects(t,m);
});

test('exact original integer, decimal, fraction and mixed-number spellings preserve the submitted raw words',()=>{
 const c=fixture.cases[0],t=at(c),m=M.initial(t);fill(t,m);action(t,m,'m31-spread');action(t,m,'turn-extra');
 for(const[key,value]of Object.entries({perLayer:'4.0',layers:'2/1',total:'+8'}))field(t,m,key,value);action(t,m,'m31-plan');field(t,m,'oneCube','0.125');field(t,m,'base','01.0000');action(t,m,'m31-part');field(t,m,'volume','1 0/2');field(t,m,'product','+1');field(t,m,'unit','cm³');
 const p=replay(t,m);assert.ok(p);assert.deepEqual(p.construction.plan,{perLayer:'4.0',layers:'2/1',total:'+8'});assert.deepEqual(p.construction.part,{oneCube:'0.125',base:'01.0000'});assert.deepEqual(p.submittedValues.map(x=>x.raw),['1 0/2','+1']);
 for(const raw of ['1','1/1','+1','01.00000000','1 0/8',' 1.0 ']){const n=cp(m);field(t,n,'volume',raw);field(t,n,'product',raw);assert.ok(replay(t,n),raw);}
});

test('scientific notation, unbounded precision, improper mixed parts and approximate values never become exact volume claims',()=>{
 const c=fixture.cases[0],t=at(c),good=finish(c);
 for(const raw of ['1e0','Infinity','NaN','.1e1','1.000000000','0 8/8','1/0','1/100000001','1000000000001','0.99999999','−1','–1','1+0','1cm³']){const m=cp(good);field(t,m,'volume',raw);field(t,m,'product',raw);rejects(t,m);}
 for(const raw of ['7/2','3.7','3 1/2']){const c2=fixture.cases[1],t2=at(c2),m=finish(c2);field(t2,m,'volume',raw);rejects(t2,m);}
});

test('visible dimensionally wrong or empty unit selections remain real failures',()=>{
 for(const c of fixture.cases){const t=at(c),good=finish(c);for(const unit of ['','cm²','ft³','mL','kg']){const m=cp(good);field(t,m,'unit',unit);assert.equal(M.inspect(t,m).correct,false);rejects(t,m);}field(t,good,'unit','cm³');assert.ok(replay(t,good));}
});

test('the 1200-event ceiling keeps the actual enabled remove/spread/turn requests as complete original no-ops',()=>{
 const c=fixture.cases[0],t=at(c),m=finish(c);while(m.history.length<1200)action(t,m,'turn-extra');const before=cp(m),proof=replay(t,m);assert.ok(proof);assert.equal(proof.eventCount,1200);assert.equal(proof.historyAtCapacity,true);
 for(const a of ['m31-remove','m31-spread','turn-extra']){action(t,m,a);assert.deepEqual(m,before);assert.equal(replay(t,m).eventCount,1200);}
 field(t,m,'prose','上限后仍保留我当前写下的原话。');field(t,m,'volume','1/1');assert.ok(replay(t,m));assert.equal(m.history.length,1200);
 const extra=cp(m);extra.history.push(cp(extra.history.at(-1)));rejects(t,extra);
});

test('State keeps initial failure, corrected full values and retry attempts through exact v2 roundtrips',()=>{
 for(const c of fixture.cases){const t=at(c),lesson=State.freshLesson(c.id);lesson.index=c.index;let m=State.modelForLesson(lesson);const host={innerHTML:''};renderP3Flow(host,{atlas,id:c.id,record:lesson});assert.doesNotMatch(host.innerHTML,/data-do="p3-retry"/);
  fill(t,m);plan(c,m);assert.equal(State.submitLesson(lesson).correct,false);const first=cp(lesson.cases[c.index].attempts[0]);finish(c,m);assert.equal(State.submitLesson(lesson).correct,true);const saved=cp(lesson.cases);
  renderP3Flow(host,{atlas,id:c.id,record:lesson});assert.match(host.innerHTML,/data-do="p3-retry"/);lesson.models[c.index]=M.initial(t);m=State.modelForLesson(lesson);assert.deepEqual(lesson.cases,saved);assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],context(c)),null);finish(c,m);assert.equal(State.submitLesson(lesson).correct,true);assert.deepEqual(lesson.cases[c.index].attempts[0],first);
  const all=Core.fresh();all.lessons[c.id]=lesson;const backup=JSON.stringify(Core.backup(all)),packed=Storage.packText(JSON.stringify(all));assert.deepEqual(Core.validate(cp(all),atlas),all);assert.deepEqual(JSON.parse(Storage.unpackText(packed)),all);assert.deepEqual(Core.parseBackup(backup,atlas),all);assert.throws(()=>Core.parseBackup('{',atlas));
 }
});

test('one exact registration and feedback require current complete model, source and mathematics without MP inference',()=>{
 const adapter=EVIDENCE_ADAPTERS.filter(x=>x.id==='cubefraction');assert.equal(adapter.length,1);assert.equal(adapter[0].type,'x-m31-cubes');
 for(const c of fixture.cases){const t=at(c),m=finish(c),r=record(m),guide=thinkingGuide(t,context(c)),feedback=thinkingFeedback(t,m,r,context(c));assert.ok(guide&&feedback);assert.equal(feedback.method,null);assert.doesNotMatch(JSON.stringify(feedback),/MP\.\d/);assert.equal(adapter[0].binding(t,context(c)).nodeId,c.nodeId);assert.ok(adapter[0].replay(t,m));
  assert.equal(thinkingFeedback(t,m,null,context(c)),null);assert.equal(thinkingFeedback(t,m,r,{}),null);field(t,m,'prose','当前新原话');assert.equal(thinkingFeedback(t,m,r,context(c)),null);r.attempts.push({value:cp(m)});assert.ok(thinkingFeedback(t,m,r,context(c)));assert.equal(inspectTask(t,m).correct,true);
 }
});
