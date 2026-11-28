import test from 'node:test';
import fixture from './fixtures/p9-ruler-cases.cjs';
import navigationFixture from './fixtures/p9-ruler-navigation.cjs';
import flows from './p9-ruler-adapter-browser.cjs';
import {rulerBinding as binding,replayRulerEvidence as replay} from '../dist/learning/ruler-evidence.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
// Read-only investigation: execute unchanged original callbacks in Node.
// These are DOM stubs, not Chromium or trusted user input.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {constants as bufferConstants} from 'node:buffer';
import {createHash} from 'node:crypto';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import * as Daily from '../dist/learning/daily.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {controlsExtra} from '../dist/learning/phase4/view-engine.js';
const V={controls:controlsExtra};
import {BRIDGES,sessionTaskFor,sessionMeta,sessionTasks,sessionRoute} from '../dist/learning/bridges.js';
import {learningStage,studyActionFocus,learningActionPlan} from '../dist/learning/workspace-flow.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import {ensureB39Ready,prepareSessionRuntime} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();await prepareSessionRuntime('strategy39',{view:true});
const cp=structuredClone;
const root=new URL('../',import.meta.url),atlas=JSON.parse(fs.readFileSync(new URL('dist/data/atlas.json',root)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const source=fs.readFileSync(new URL('dist/learning/learn.js',root),'utf8'),line=prefix=>source.split('\n').find(x=>x.startsWith(prefix));
const update=line('function update('),edit=line('function edit('),extra=line("$('#lesson').addEventListener('click',e=>{const el=e.target.closest('[data-x]')"),input=line("$('#lesson').addEventListener('input',e=>{const el=e.target;if(!el.dataset.xfield");
const sharedStart=source.indexOf("$('#lesson').addEventListener('click',e=>{const b=e.target.closest('[data-do]')"),shared=source.slice(sharedStart,source.indexOf("\n$('#lesson').addEventListener(",sharedStart+1));
// Keep the actual V54 guard in the extracted controller. These legacy Node
// routes model the standalone presentation; the real V54 locks are covered
// separately in learning-workspace-browser.cjs.
const workbenchFlag=line('const v54Workbench=');
assert.ok([update,edit,extra,input,shared,workbenchFlag].every(Boolean));
const controllerSourceHashes=Object.fromEntries(Object.entries({update,edit,extra,input,shared}).map(([k,s])=>[k,createHash('sha256').update(s).digest('hex')]));
const factory=new Function('d',`
 const{localStorage,KEY,atlas,id,read,sessionRecord,assertNoConcurrentLessonOverwrite,mergeLesson,now,validateLesson,BRIDGES,rememberSession,sessionMeta,sessionRoute,validate,writeStored,notify,modelForLesson,freshLesson,enterUnifiedTask,taskFor,numericCompatibility,isExtra,actExtra,fieldExtra,setField,supportLesson,defaultModel,submitLesson,lessonSummary,currentSubmission,sessionTasks}=d;
 let all=read(),a=sessionRecord(all,id)||freshLesson(id),blocked=false,feedback='',spread=0,view=null,numericBackup=null,numericExportMessage='',savedNoteFeedback='',extraLab=null;
 const listeners={click:[],input:[]},warning={hidden:true,textContent:''};
 const dummy={hidden:false,textContent:'',value:'',remove(){},scrollIntoView(){}};
 const $=selector=>selector==='#lesson'?{addEventListener:(type,fn)=>listeners[type].push(fn)}:selector==='#storage-warning'?warning:dummy;
 const render=()=>{},sync=()=>{},window={scrollTo(){}},questionId=null;
 const document={body:{dataset:{}}};
 ${workbenchFlag}
 const task=()=>taskFor(id,a.index),model=()=>modelForLesson(a),numericReadOnly=()=>a?.view==='task'&&numericCompatibility(task(),model()),uiSnapshot=()=>structuredClone(a.ui);
 ${update}
 ${edit}
 ${shared}
 ${extra}
 ${input}
 return {open:()=>update(r=>{enterUnifiedTask(r);modelForLesson(r);}),update,
  extra:data=>listeners.click[1]({target:{closest:selector=>selector==='[data-x]'?{dataset:data}:null}}),
  shared:data=>listeners.click[0]({target:{closest:selector=>selector==='[data-do]'?{dataset:data}:null}}),
  field:(key,value,type)=>listeners.input[0]({target:{dataset:{xfield:key},value:String(value),type}}),
  get record(){return a},get state(){return all},get blocked(){return blocked},get warning(){return warning}};
`);
function retryTags(a){const host={innerHTML:''};renderP3Flow(host,{atlas,id:a.id,record:a});return[...host.innerHTML.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-do']==='p3-retry');}
function environment(initialState=Core.fresh()){
 const backing=new Map(),storage={getItem:key=>backing.get(key)??null,setItem:(key,value)=>backing.set(key,String(value))};let updates=0,clock=0;
 Storage.writeStored(Core.KEY,JSON.stringify(Core.validate(cp(initialState),atlas)),storage);
 const read=()=>Core.validate(JSON.parse(Storage.readStored(Core.KEY,storage)),atlas),stats={fields:0,actions:0,rangeEvents:0,checked:0,retries:0,next:0};
 const deps=id=>({localStorage:storage,KEY:Core.KEY,atlas,id,read,sessionRecord:Daily.sessionRecord,assertNoConcurrentLessonOverwrite:State.assertNoConcurrentLessonOverwrite,mergeLesson:State.mergeLesson,
  now:()=>new Date(Date.UTC(2026,10,16,8)+clock++).toISOString(),validateLesson:State.validateLesson,BRIDGES,rememberSession:Daily.rememberSession,sessionMeta,sessionRoute,validate:Core.validate,
  writeStored:(key,value)=>{updates++;Storage.writeStored(key,value,storage);},notify:()=>{},modelForLesson:State.modelForLesson,freshLesson:State.freshLesson,enterUnifiedTask:State.enterUnifiedTask,taskFor:sessionTaskFor,
  numericCompatibility:State.numericCompatibility,isExtra:Engine.isExtra,actExtra:Engine.actExtra,fieldExtra:Engine.fieldExtra,setField,supportLesson:State.supportLesson,defaultModel:Tasks.defaultModel,
  submitLesson:State.submitLesson,lessonSummary:State.lessonSummary,currentSubmission:State.currentSubmission,sessionTasks});
 function open(id){
  let page=factory(deps(id));assert.equal(page.open(),true);const model=()=>page.record.models[page.record.index],task=()=>sessionTaskFor(id,page.record.index);
  const api={get record(){return page.record},get model(){return model()},get blocked(){return page.blocked},get warning(){return page.warning},get updates(){return updates},get raw(){return storage.getItem(Core.KEY)},get state(){return read()},get seed(){return model().seed},get task(){return task()},
   html:()=>V.controls(task(),model()),
   field:(key,value,{allowBlocked=false}={})=>{
    const html=api.html(),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-xfield']===key);assert.equal(tags.length,1,'one original field '+key);const a=attrs(tags[0]);assert.doesNotMatch(tags[0],/\bdisabled\b|\breadonly\b/);
    if(tags[0].startsWith('<select')){const start=html.indexOf(tags[0]),part=html.slice(start,html.indexOf('</select>',start));assert.ok([...part.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)),'actual option '+key+':'+value);}
    const update=v=>page.field(key,v,a.type||'select');
    if(a.type==='range'){const min=Number(a.min),max=Number(a.max),step=Number(a.step||1),end=Number(value);assert.ok(end>=min&&end<=max&&Number.isInteger((end-min)/step));if(Number(model()[key])!==min){update(min);stats.rangeEvents++;}for(let v=min+step;v<=end;v+=step){update(v);stats.rangeEvents++;}}
    else update(String(value));stats.fields++;if(!allowBlocked)assert.equal(page.blocked,false,'field writes original valid state');assert.equal(Tasks.validModel(task(),model()),true);
   },
   action:(name,values={})=>{
    const data=typeof values==='object'?values:{index:String(values)};
    const candidates=[...api.html().matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-x']===name&&Object.entries(data).every(([k,v])=>attrs(x)['data-'+k]===String(v)));
    assert.equal(candidates.length,1,'one actual original action '+name+':'+JSON.stringify(data));assert.doesNotMatch(candidates[0],/\bdisabled\b/);page.extra({x:name,...Object.fromEntries(Object.entries(data).map(([k,v])=>[k,String(v)]))});stats.actions++;assert.equal(Tasks.validModel(task(),model()),true);
   },
   check:correct=>{
    const stage=learningStage(page.record,State.currentSubmission(page.record)),focus=studyActionFocus({stage,task:task(),model:model()}),plan=learningActionPlan({stage,hasNextTask:page.record.index<sessionTasks(id).length-1,readyToCheck:focus.readyToCheck});assert.ok([plan.primary,...plan.secondary].some(x=>x.action==='check'&&!x.disabled),'original Check is offered');
    const before=cp(page.record),i=before.index,m=cp(model());page.shared({do:'check'});assert.equal(page.blocked,false);assert.equal(Tasks.inspect(task(),m).correct,correct);assert.equal(page.record.cases[i].attempts.length,(before.cases[i]?.attempts.length||0)+1);assert.deepEqual(page.record.cases[i].attempts.slice(0,-1),before.cases[i]?.attempts||[]);assert.deepEqual(page.record.cases[i].attempts.at(-1).value,m);assert.deepEqual(model(),m);stats.checked++;return cp(page.record.cases[i].attempts.at(-1));
   },
   retry:()=>{
    const before=cp(page.record),tags=retryTags(before);assert.equal(tags.length,1);assert.doesNotMatch(tags[0],/\bdisabled\b/);page.shared({do:'p3-retry'});assert.equal(page.blocked,false);assert.deepEqual(page.record.cases,before.cases);assert.deepEqual(page.record.notes,before.notes);assert.equal(page.record.draft,before.draft);const initial=Tasks.defaultModel(task());initial.seed=model().seed;assert.deepEqual(model(),initial);stats.retries++;
   },
   next:()=>{
    const before=cp(page.record);assert.equal(State.currentSubmission(before).status,'correct');assert.equal(State.lessonSummary(before).cases[before.index].complete,true);page.shared({do:'next'});assert.equal(page.blocked,false);assert.equal(page.record.index,before.index+1);assert.deepEqual(page.record.cases,before.cases);assert.deepEqual(page.record.notes,before.notes);assert.equal(page.record.draft,before.draft);for(const[i,m]of Object.entries(before.models))assert.deepEqual(page.record.models[i],m);stats.next++;
   },
   reload:()=>{const before=cp(page.record);page=factory(deps(id));assert.equal(page.open(),true);assert.equal(page.blocked,false);assert.deepEqual(page.record.cases,before.cases);assert.deepEqual(page.record.notes,before.notes);assert.equal(page.record.draft,before.draft);for(const[i,m]of Object.entries(before.models))assert.deepEqual(page.record.models[i],m);},
   originalUpdate:fn=>page.update(fn),sharedOriginal:name=>page.shared({do:name}),rawField:(key,value,type)=>page.field(key,value,type),rawAction:data=>page.extra(data)
  };return api;
 }
 return{open,read,stats,storage,get updates(){return updates},get raw(){return storage.getItem(Core.KEY)}};
}

const digest=value=>createHash('sha256').update(value).digest('hex');
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
const hash=value=>digest(JSON.stringify(stable(value))),ctx=c=>({sessionId:c.id,index:c.index}),taskFor=c=>sessionTaskFor(c.id,c.index);
function proofHarness(env){
 const captures=[],checked=[],retries=[],names=new Set();let page,label='';
 const capture=(c,phase,strict,role,checkedAttempt=false)=>{
  const stem=label+'-'+phase;assert.ok(!names.has(stem),'one immutable raw/state path '+stem);names.add(stem);
  const a=page.record,m=cp(page.model),record=cp(a.cases[c.index]||null),task=taskFor(c),proof=replay(task,m),feedback=thinkingFeedback(task,m,record,ctx(c)),native=!!binding(task,ctx(c));
  assert.equal(native&&!!feedback,strict,stem);if(role!=='prerequisite')assert.equal(!!feedback,strict,stem);
  if(strict){assert.ok(proof);assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(feedback.method,null);}
  const row={id:c.id,index:c.index,label,phase,stem,role,checked:checkedAttempt,model:m,record,strict,proof,correct:Tasks.inspect(task,m).correct,raw:env.raw};captures.push(row);return row;
 };
 const check=(c,correct,strict,phase,role)=>{const attempt=page.check(correct),row=capture(c,phase,strict,role,true);row.attempt=attempt;checked.push(row);return row;};
 const retry=(c,kind)=>{const before=cp(page.record);page.retry();retries.push({id:c.id,index:c.index,kind,before,after:cp(page.record)});};
 const solve=(c,options)=>{for(const s of flows.rulerOperationPlan(c,page.model,options))s.field?page.field(s.field,s.value):page.action(s.action,s.data||{});};
 let blockedRaw,blockedModel;
 const api=(c,role)=>({field:(key,value)=>page.field(key,value),action:(name,data)=>page.action(name,data||{}),model:()=>cp(page.model),solve:options=>solve(c,options),
  capture:(phase,strict)=>capture(c,phase,strict,role),check:(correct,strict,phase)=>check(c,correct,strict,phase,role),retry:kind=>retry(c,kind),assert:(value,message)=>assert.ok(value,message),
  checkpoint:stage=>{if(['correct-unsubmitted','reselected','shared-retry'].includes(stage))assert.equal(thinkingFeedback(taskFor(c),page.model,page.record.cases[c.index],ctx(c)),null);if(['corrected','reselected','shared-retry'].includes(stage))page.reload();},
  overlongText:(key,value)=>{blockedRaw=env.raw;blockedModel=cp(page.model);page.field(key,value,{allowBlocked:true});assert.equal(page.blocked,true);assert.equal(page.warning.hidden,false);assert.match(page.warning.textContent,/已停止覆盖原记录/);assert.equal(env.raw,blockedRaw);assert.deepEqual(page.model,blockedModel);},
  blockedAction:name=>{assert.equal(page.blocked,true);if(['record','predict'].includes(name))page.action('m28-'+name);else{if(name==='retry')assert.equal(retryTags(page.record).length,1);page.sharedOriginal(name==='retry'?'p3-retry':'check');}assert.equal(env.raw,blockedRaw);assert.deepEqual(page.model,blockedModel);},
  blockedField:(key,value)=>{assert.equal(page.blocked,true);page.field(key,value,{allowBlocked:true});assert.equal(env.raw,blockedRaw);assert.deepEqual(page.model,blockedModel);},
  reloadBlocked:()=>{page.reload();assert.equal(page.blocked,false);assert.deepEqual(page.model,blockedModel);},reloadCap:()=>page.reload(),
  assertRetryAvailable:expected=>assert.equal(retryTags(page.record).length,expected?1:0),
  cappedAction:name=>{const before=cp(page.model),a=cp(page.record),raw=env.raw,writes=page.updates;page.action('m28-'+name,name==='tool'?{index:taskFor(c).tool}:{});assert.deepEqual(page.model,before);assert.equal(page.blocked,false);assert.equal(page.updates,writes+1);assert.notEqual(env.raw,raw,'real controller metadata writes are retained');assert.deepEqual(page.record.cases[c.index]?.attempts||[],a.cases[c.index]?.attempts||[]);if(before.board.bad||before.issue)assert.equal(page.record.cases[c.index].support,true);}
 });
 return{captures,checked,retries,api,capture,check,solve,retry,setLabel:x=>label=x,open:id=>(page=env.open(id)),get page(){return page}};
}

test('six literal prerequisites use unchanged original controls and exact task/controller pins',()=>{
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(new URL(file,root))),sha,file);
 assert.deepEqual(controllerSourceHashes,navigationFixture.controllerSourceHashes);const targets=flows.orderedRulerTargets(),needed=[];assert.equal(targets.length,27);assert.equal(new Set(targets.map(c=>c.id)).size,17);
 for(const id of new Set(targets.map(c=>c.id))){const group=targets.filter(c=>c.id===id);for(let i=0;i<=Math.max(...group.map(c=>c.index));i++)if(!group.some(c=>c.index===i))needed.push(id+':'+i);}
 assert.deepEqual(needed.sort(),navigationFixture.navigation.map(c=>c.id+':'+c.index).sort());assert.equal(needed.length,6);
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);assert.equal(c.strictRulerCoverage,false);assert.equal(binding(taskFor(c),ctx(c)),null);
  const state=Core.fresh(),a=State.freshLesson(c.id);a.index=c.index;(Object.hasOwn(BRIDGES,c.id)?state.daily.bridges:state.lessons)[c.id]=a;const env=environment(state),page=env.open(c.id);
  for(const s of c.steps)s.field?page.field(s.field,s.value):page.action(s.action,s.data||{});page.check(true);assert.equal(replay(taskFor(c),page.model),null);
 }
});

test('the 17-course source route keeps every original Next, attempt, correction, source boundary and complete snapshot',async()=>{
 const env=environment(),h=proofHarness(env);let currentId=null,prerequisites=0,boundaries=0;
 for(const c of flows.orderedRulerTargets()){
  h.setLabel(c.role+'-'+c.id+'-'+c.index);if(c.id!==currentId){h.open(c.id);currentId=c.id;}
  while(h.page.record.index<c.index){const index=h.page.record.index,previous={id:c.id,index},task=taskFor(previous);
   if(!h.page.record.cases[index]?.attempts?.some(a=>Tasks.inspect(task,a.value).correct)){const prep=navigationFixture.navigation.find(x=>x.id===c.id&&x.index===index);assert.ok(prep);for(const s of prep.steps)s.field?h.page.field(s.field,s.value):h.page.action(s.action,s.data||{});h.check(previous,true,false,'navigation-prerequisite-'+index,'prerequisite');prerequisites++;}
   h.page.next();
  }
  assert.equal(h.page.record.index,c.index);assert.equal(h.page.record.cases[c.index]?.attempts?.length||0,0);assert.equal(retryTags(h.page.record).length,0);const fresh=Tasks.defaultModel(taskFor(c));fresh.seed=h.page.model.seed;assert.deepEqual(h.page.model,fresh);
  if(c.role==='native'){
   h.page.originalUpdate(a=>State.supportLesson(a));const phases=await flows.rulerNativeFlow(c,h.api(c,'native'));assert.equal(phases.filter(x=>x.checked).length,flows.rulerNativeCheckCount(c),c.id+':'+c.index);assert.equal(phases.length,flows.rulerNativeCaptureCount(c),c.id+':'+c.index);assert.deepEqual(h.page.record.cases[c.index].attempts,phases.filter(x=>x.checked).map(x=>x.attempt));
   for(const kind of flows.rulerBoundaryKindsFor(c)){h.setLabel('boundary-'+c.id+'-'+c.index+'-'+kind);h.retry(c,'boundary-'+kind);h.capture(c,'boundary-retry',false,'boundary');await flows.rulerBoundaryFlow(kind,c,h.api(c,'boundary'));assert.equal(State.currentSubmission(h.page.record).status,'correct');assert.ok(replay(taskFor(c),h.page.model));boundaries++;}
  }else{h.capture(c,'associated-initial',false,'associated');h.solve(c);h.capture(c,'associated-unsubmitted',false,'associated');const row=h.check(c,true,false,'associated-checked','associated');assert.ok(row.proof);assert.equal(binding(taskFor(c),ctx(c)),null);}
 }
 assert.equal(prerequisites,6);assert.equal(boundaries,6);assert.equal(env.stats.next,16);assert.ok(env.stats.rangeEvents>0);assert.equal(h.checked.length,329);assert.equal(h.captures.length,476);assert.equal(h.retries.length,22);
 assert.deepEqual(Object.fromEntries(['native','boundary','associated','prerequisite'].map(role=>[role,h.checked.filter(x=>x.role===role).length])),{native:291,boundary:21,associated:11,prerequisite:6});
 const all=env.read(),positions=[...new Set(h.checked.map(x=>x.id+':'+x.index))];assert.equal(positions.length,33);
 for(const key of positions){const rows=h.checked.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),a=(Object.hasOwn(BRIDGES,last.id)?all.daily.bridges:all.lessons)[last.id];assert.deepEqual(a.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(a.models[last.index],last.model);}
 for(const row of h.captures){const a=(Object.hasOwn(BRIDGES,row.id)?all.daily.bridges:all.lessons)[row.id],old=row.record?.attempts||[];assert.deepEqual(a.cases[row.index].attempts.slice(0,old.length),old);}
 for(const c of fixture.cases)assert.ok(replay(taskFor(c),all.lessons[c.id].models[c.index]));
 const incoming=Core.parseBackup(JSON.stringify(Core.backup(cp(all))),atlas);assert.deepEqual(incoming,all);const restored=Core.merge(Core.fresh(),incoming,atlas);assert.deepEqual(restored,all);assert.deepEqual(Core.merge(cp(restored),incoming,atlas),restored);
 console.log('RULER_ORIGINAL_CONTINUOUS_ROUTE',JSON.stringify({targets:27,sessions:17,positions:33,prerequisites,boundaries,checked:h.checked.length,captures:h.captures.length,retries:h.retries.length,...env.stats,actualChromium:false}));
});

test('ten constructed 2000-history modes keep raw saved pairs, expose root/board separation and retain old records through actual retry callbacks',async()=>{
 const totals={checked:0,captures:0,retries:0};
 for(const mode of flows.rulerCapacityModes()){
  const c=flows.rulerModeSpec(mode),task=taskFor(c),f=flows.constructRulerCapacityFixture(c,mode,{State,Core,Engine,setField,task}),a=f.state.lessons[c.id],m=a.models[c.index],unpredicted=mode.kind==='unpredicted';
  assert.equal(f.constructedCompatibilityFixture,true);assert.equal(m.history.length,2000);assert.equal(Tasks.validModel(task,m),true);assert.equal(Tasks.inspect(task,m).correct,!unpredicted);assert.equal(!!replay(task,m),!unpredicted);assert.equal(m.board.bad,mode.kind==='bad');assert.equal(!!m.issue,mode.kind==='issue');assert.equal(a.cases[c.index]?.attempts.length||0,mode.prior);
  const env=environment(f.state),h=proofHarness(env);h.open(c.id);h.setLabel('cap-'+mode.id);const phases=await flows.rulerCapacityFlow(mode,c,h.api(c,'capacity')),checks=unpredicted?2:6;
  assert.equal(h.checked.length,checks);assert.equal(h.retries.length,1);assert.equal(h.page.blocked,false);assert.equal(h.page.record.cases[c.index].attempts.length,mode.prior+checks);assert.deepEqual(h.page.record.cases[c.index].attempts.slice(0,mode.prior),a.cases[c.index]?.attempts||[]);
  assert.deepEqual(h.page.record.notes,a.notes);assert.equal(h.page.record.draft,a.draft);assert.deepEqual(phases.at(-1).model,h.page.model);assert.ok(replay(task,h.page.model));assert.ok(h.page.model.history.length<2000);
  if(!unpredicted){const split=h.captures.find(x=>x.phase==='original-grade-ignores-cap-root-offset');assert.equal(split.correct,true);assert.equal(split.strict,false);assert.equal(split.proof,null);assert.equal(split.model.offset,'1');assert.equal(split.model.board.offset,0);assert.deepEqual(split.model.history,m.history);assert.deepEqual(split.model.board.saved,m.board.saved);}
  const final=env.read();assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(cp(final))),atlas),final);assert.deepEqual(Core.merge(Core.fresh(),Core.parseBackup(JSON.stringify(Core.backup(cp(final))),atlas),atlas),final);
  const before=env.raw,invalid=cp(final);invalid.lessons[c.id].models[c.index].history=Array.from({length:2001},()=>({a:'align',d:{},f:{offset:'0'}}));assert.throws(()=>Core.parseBackup(JSON.stringify(Core.backup(invalid)),atlas));assert.equal(env.raw,before);
  for(const key of Object.keys(totals))totals[key]+=h[key].length;
 }
 assert.equal(totals.checked,56);assert.equal(totals.captures,137);assert.equal(totals.retries,10);console.log('RULER_ORIGINAL_CAPACITY_ROUTE',JSON.stringify({...totals,modes:10,constructedCompatibilityFixture:true,actualChromium:false}));
});

test('six constructed 1201-text modes keep old bytes while blocked and restore original retry qualification after reload',async()=>{
 const totals={checked:0,captures:0,retries:0};
 for(const mode of flows.rulerTextModes()){
  const c=flows.rulerModeSpec(mode),task=taskFor(c),f=flows.constructRulerTextFixture(c,mode,{State,Core,Engine,setField,task}),a=f.state.lessons[c.id],m=a.models[c.index];assert.equal(m[mode.field].length,1200);assert.equal(!!replay(task,m),mode.field!=='estimate');assert.equal(a.cases[c.index]?.attempts?.length||0,mode.prior);
  const env=environment(f.state),h=proofHarness(env);h.open(c.id);h.setLabel(mode.id);const phases=await flows.rulerTextFlow(mode,c,h.api(c,'text-limit'));
  assert.equal(h.checked.length,mode.prior?1:2);assert.equal(h.captures.length,9);assert.equal(h.retries.length,1);assert.equal(h.page.blocked,false);assert.deepEqual(h.page.record.cases[c.index].attempts.slice(0,mode.prior),a.cases[c.index]?.attempts||[]);assert.deepEqual(h.page.record.notes,a.notes);assert.equal(h.page.record.draft,a.draft);assert.deepEqual(phases.at(-1).model,h.page.model);assert.ok(replay(task,h.page.model));
  const all=env.read();assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(cp(all))),atlas),all);for(const row of h.captures){const record=all.lessons[c.id].cases[c.index];assert.deepEqual(record.attempts.slice(0,row.record?.attempts?.length||0),row.record?.attempts||[]);}for(const key of Object.keys(totals))totals[key]+=h[key].length;
 }
 assert.deepEqual(totals,{checked:9,captures:54,retries:6});console.log('RULER_ORIGINAL_TEXT_ROUTE',JSON.stringify({...totals,modes:6,constructedCompatibilityFixture:true,actualChromium:false}));
});

test('both original practice positions remain compatibility data without a fabricated native attempt',()=>{
 const s=Core.fresh();for(const c of fixture.practice){const t=taskFor(c),m=Tasks.defaultModel(t);for(const step of flows.rulerOperationPlan(c,m))if(step.field){setField(m,step.field,step.value);Engine.fieldExtra(t,m,step.field);}else Engine.actExtra(t,m,step.action,step.data||{});
  assert.equal(Tasks.inspect(t,m).correct,true);assert.ok(replay(t,m));assert.equal(binding(t,ctx(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:cp(m)}]},ctx(c)),null);const a=s.lessons[c.id]||=State.freshLesson(c.id);a.models[-1]=m;assert.deepEqual(a.cases,{});}
 Core.validate(s,atlas);assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(cp(s))),atlas),s);
});

test('full cap captures archive once with verifiable references beyond the monolithic JSON string limit',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ruler-full-capture-'));
 try{
  const captures=[],states=[];
  for(const id of ['plain-clean-1','tool-bad-1','estimate-clean-0']){
   const mode=flows.rulerCapacityModes().find(x=>x.id===id),c=flows.rulerModeSpec(mode),task=taskFor(c),f=flows.constructRulerCapacityFixture(c,mode,{State,Core,Engine,setField,task});
   const model=cp(f.state.lessons[c.id].models[c.index]),record=cp(f.state.lessons[c.id].cases[c.index]||null),proof=replay(task,model),checked=mode.prior>0;
   assert.ok(proof);assert.equal(proof.eventCount,2000);states.push(f.state);
   const row={id:c.id,index:c.index,mode:id,phase:'constructed-archive-stress',checked,model,record,proof,storage:{raw:id+'-raw.json',state:id+'-state.json'},constructedCompatibilityFixture:true};
   if(checked)row.attempt=cp(record.attempts.at(-1));captures.push(row);
  }
  const unsubmitted={...cp(captures[0]),phase:'unsubmitted-current-work',checked:false};delete unsubmitted.attempt;unsubmitted.model.prose='这份当前草稿没有成为历史提交';captures.push(unsubmitted);
  const repeated=Array(400).fill(captures[0]),proofCharacters=JSON.stringify(captures[0].proof,null,2).length;
  assert.ok(proofCharacters*repeated.length>bufferConstants.MAX_STRING_LENGTH,'the old repeated proof shape alone exceeds V8 single-string capacity');
  const original={actualChromium:false,syntheticArchiveStressFixture:true,captures,checkedLedger:captures.filter(x=>x.checked),observations:[{phases:repeated}],
   boundaries:[{phases:captures}],isolated:[{snapshot:captures[2]}],preparations:[{checked:captures[0]}],capacity:[{phases:captures,originalState:states[0]}],
   textLimits:[{phases:[unsubmitted]}],backups:[{phases:captures,originalState:states[0]}]};
  const before=captures.map(x=>JSON.stringify(x)),receipt=flows.writeRulerReport(directory,original),bytes=fs.readFileSync(path.join(directory,'results.json')),report=JSON.parse(bytes);
  assert.equal(receipt.sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(receipt.bytes,bytes.length);assert.equal(receipt.completeCaptureCount,4);
  assert.ok(receipt.bytes<5_000_000,'the index keeps complete evidence in referenced files');assert.deepEqual(captures.map(x=>JSON.stringify(x)),before,'archiving does not mutate any current or historical record');
  const entries=report.captureArchive.entries,byId=new Map(entries.map(e=>[e.captureId,e])),counts=new Map();assert.equal(entries.length,4);
  const resolve=value=>{
   if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.hasOwn(value,'captureId')){
    const entry=byId.get(value.captureId);assert.ok(entry);assert.deepEqual(value,{captureId:entry.captureId,file:entry.file,sha256:entry.sha256,bytes:entry.bytes});
    const content=fs.readFileSync(path.join(directory,entry.file));assert.equal(content.length,entry.bytes);assert.equal(createHash('sha256').update(content).digest('hex'),entry.sha256);
    counts.set(entry.captureId,(counts.get(entry.captureId)||0)+1);return JSON.parse(content);
   }
   return Array.isArray(value)?value.map(resolve):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolve(v)])):value;
  };
  // Resolve each distinct path shape without inflating the deliberately repeated
  // 400-proof stress array into a second monolithic in-memory fixture.
  for(const key of Object.keys(original).filter(k=>k!=='observations'))assert.deepEqual(resolve(report[key]),original[key],key+' full snapshots survive');
  assert.equal(report.observations[0].phases.length,400);for(const reference of report.observations[0].phases)assert.deepEqual(reference,report.captures[0]);
  counts.set(entries[0].captureId,(counts.get(entries[0].captureId)||0)+400);
  for(const entry of entries)assert.equal(entry.references,counts.get(entry.captureId));
  const unchecked=JSON.parse(fs.readFileSync(path.join(directory,entries[3].file)));assert.equal(unchecked.checked,false);assert.equal(Object.hasOwn(unchecked,'attempt'),false);assert.notDeepEqual(unchecked.model,unchecked.record.attempts.at(-1).value);
  assert.deepEqual(flows.writeRulerReport(directory,original),receipt,'identical re-archiving verifies existing bytes');
  const first=path.join(directory,entries[0].file),retained=fs.readFileSync(first);fs.writeFileSync(first,'{}');assert.throws(()=>flows.writeRulerReport(directory,original),/immutable capture/);assert.equal(fs.readFileSync(first,'utf8'),'{}','a mismatched retained file is not overwritten');fs.writeFileSync(first,retained);
  assert.throws(()=>flows.writeRulerReport(path.join(directory,'bad-ledger'),{captures:[],checkedLedger:[captures[0]]}),/archived capture/);
  const partial=flows.writeRulerReport(path.join(directory,'failure-report'),{captures:[captures[0]],checkedLedger:[captures[0]],error:'original failure'});assert.equal(partial.completeCaptureCount,1);assert.equal(JSON.parse(fs.readFileSync(path.join(directory,'failure-report/results.json'))).error,'original failure');
  console.log('RULER_CAPTURE_ARCHIVE_STRESS',JSON.stringify({originalProofLowerBoundCharacters:proofCharacters*400,maxStringLength:bufferConstants.MAX_STRING_LENGTH,indexBytes:receipt.bytes,completeCaptures:4,fullCaptureBytes:receipt.fullCaptureBytes,actualChromium:false}));
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
