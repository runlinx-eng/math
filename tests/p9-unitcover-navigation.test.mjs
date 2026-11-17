// Read-only investigation: execute unchanged original callbacks in Node.
// These are DOM stubs, not Chromium or trusted user input.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import * as Daily from '../dist/learning/daily.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import * as V from '../dist/learning/phase5/b28-view.js';
import {BRIDGES,sessionTaskFor,sessionMeta,sessionTasks,sessionRoute} from '../dist/learning/bridges.js';
import {learningStage,studyActionFocus,learningActionPlan} from '../dist/learning/workspace-flow.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import fixture from './fixtures/p9-unitcover-cases.cjs';
import navigationFixture from './fixtures/p9-unitcover-navigation.cjs';
import flows from './p9-unitcover-adapter-browser.cjs';
import {unitcoverBinding as binding,replayUnitcoverEvidence as replay} from '../dist/learning/unitcover-evidence.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
await ensureB39Ready();
const cp=structuredClone;
const root=new URL('../',import.meta.url),atlas=JSON.parse(fs.readFileSync(new URL('dist/data/atlas.json',root)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const source=fs.readFileSync(new URL('dist/learning/learn.js',root),'utf8'),line=prefix=>source.split('\n').find(x=>x.startsWith(prefix));
const update=line('function update('),edit=line('function edit('),extra=line("$('#lesson').addEventListener('click',e=>{const el=e.target.closest('[data-x]')"),input=line("$('#lesson').addEventListener('input',e=>{const el=e.target;if(!el.dataset.xfield");
const sharedStart=source.indexOf("$('#lesson').addEventListener('click',e=>{const b=e.target.closest('[data-do]')"),shared=source.slice(sharedStart,source.indexOf("\n$('#lesson').addEventListener(",sharedStart+1));
assert.ok([update,edit,extra,input,shared].every(Boolean));
const controllerSourceHashes=Object.fromEntries(Object.entries({update,edit,extra,input,shared}).map(([k,s])=>[k,createHash('sha256').update(s).digest('hex')]));
const factory=new Function('d',`
 const{localStorage,KEY,atlas,id,read,sessionRecord,assertNoConcurrentLessonOverwrite,mergeLesson,now,validateLesson,BRIDGES,rememberSession,sessionMeta,sessionRoute,validate,writeStored,notify,modelForLesson,freshLesson,enterUnifiedTask,taskFor,numericCompatibility,isExtra,actExtra,fieldExtra,setField,supportLesson,defaultModel,submitLesson,lessonSummary,currentSubmission,sessionTasks}=d;
 let all=read(),a=sessionRecord(all,id)||freshLesson(id),blocked=false,feedback='',spread=0,view=null,numericBackup=null,numericExportMessage='',savedNoteFeedback='',extraLab=null;
 const listeners={click:[],input:[]},warning={hidden:true,textContent:''};
 const dummy={hidden:false,textContent:'',value:'',remove(){},scrollIntoView(){}};
 const $=selector=>selector==='#lesson'?{addEventListener:(type,fn)=>listeners[type].push(fn)}:selector==='#storage-warning'?warning:dummy;
 const render=()=>{},sync=()=>{},window={scrollTo(){}},questionId=null;
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
  const api={get record(){return page.record},get model(){return model()},get blocked(){return page.blocked},get warning(){return page.warning},get updates(){return updates},get raw(){return storage.getItem(Core.KEY)},get state(){return read()},
   html:()=>V.controls(task(),model()),
   field:(key,value,{allowBlocked=false}={})=>{
    const html=api.html(),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-xfield']===key);assert.equal(tags.length,1,'one original field '+key);const a=attrs(tags[0]);assert.doesNotMatch(tags[0],/\bdisabled\b|\breadonly\b/);
    if(tags[0].startsWith('<select')){const start=html.indexOf(tags[0]),part=html.slice(start,html.indexOf('</select>',start));assert.ok([...part.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)),'actual option '+key+':'+value);}
    const update=v=>page.field(key,v,a.type||'select');
    if(a.type==='range'){const min=Number(a.min),max=Number(a.max),step=Number(a.step||1),end=Number(value);assert.ok(end>=min&&end<=max&&Number.isInteger((end-min)/step));if(Number(model()[key])!==min){update(min);stats.rangeEvents++;}for(let v=min+step;v<=end;v+=step){update(v);stats.rangeEvents++;}}
    else update(String(value));stats.fields++;if(!allowBlocked)assert.equal(page.blocked,false,'field writes original valid state');assert.equal(Tasks.validModel(task(),model()),true);
   },
   action:(name,index)=>{
    const candidates=[...api.html().matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-x']===name&&(index===undefined?attrs(x)['data-index']===undefined:attrs(x)['data-index']===String(index)));
    assert.equal(candidates.length,1,'one actual original action '+name+':'+index);assert.doesNotMatch(candidates[0],/\bdisabled\b/);const data={x:name,...(index===undefined?{}:{index:String(index)})};page.extra(data);stats.actions++;assert.equal(Tasks.validModel(task(),model()),true);
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
   originalUpdate:fn=>page.update(fn),sharedOriginal:name=>page.shared({do:name})
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
  const a=page.record,m=cp(page.model),record=cp(a.cases[c.index]||null),task=taskFor(c),proof=replay(task,m),feedback=thinkingFeedback(task,m,record,ctx(c));
  assert.equal(!!feedback,strict,stem);if(strict){assert.ok(proof);assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(feedback.method,null);}
  const row={id:c.id,index:c.index,label,phase,stem,role,checked:checkedAttempt,model:m,record,strict,proof,correct:Tasks.inspect(task,m).correct,raw:env.raw};captures.push(row);return row;
 };
 const check=(c,correct,strict,phase,role)=>{const attempt=page.check(correct),row=capture(c,phase,strict,role,true);row.attempt=attempt;checked.push(row);return row;};
 const retry=(c,kind)=>{const before=cp(page.record);page.retry();retries.push({id:c.id,index:c.index,kind,before,after:cp(page.record)});};
 const solve=c=>{for(const s of flows.unitcoverOperationPlan(c,page.model))s.field?page.field(s.field,s.value):page.action(s.action,s.data?.index);};
 let blockedRaw,blockedModel;
 const api=(c,role)=>({field:(key,value)=>page.field(key,value),action:(name,data)=>page.action(name,data?.index),model:()=>cp(page.model),solve:()=>solve(c),
  capture:(phase,strict)=>capture(c,phase,strict,role),check:(correct,strict,phase)=>check(c,correct,strict,phase,role),retry:kind=>retry(c,kind),assert:(value,message)=>assert.ok(value,message),
  checkpoint:stage=>{if(['correct-unsubmitted','clear','shared-retry'].includes(stage))assert.equal(thinkingFeedback(taskFor(c),page.model,page.record.cases[c.index],ctx(c)),null);},
  overlongText:(key,value)=>{blockedRaw=env.raw;blockedModel=cp(page.model);page.field(key,value,{allowBlocked:true});assert.equal(page.blocked,true);assert.equal(env.raw,blockedRaw);assert.deepEqual(page.model,blockedModel);},
  blockedAction:name=>{assert.equal(page.blocked,true);if(name==='clear')page.action('m28-clear');else{if(name==='retry')assert.equal(retryTags(page.record).length,1);page.sharedOriginal(name==='retry'?'p3-retry':'check');}assert.equal(env.raw,blockedRaw);assert.deepEqual(page.model,blockedModel);},
  reloadBlocked:()=>{page.reload();assert.equal(page.blocked,false);assert.deepEqual(page.model,blockedModel);},
  assertRetryAvailable:expected=>assert.equal(retryTags(page.record).length,expected?1:0),
  cappedAction:name=>{const before=cp(page.model),a=cp(page.record),raw=env.raw,writes=page.updates;page.action('m28-'+name,name==='place'?'0':undefined);assert.deepEqual(page.model,before);assert.equal(page.blocked,false);assert.equal(page.updates,writes+1);assert.notEqual(env.raw,raw,'real controller metadata writes are retained');assert.deepEqual(page.record.cases[c.index]?.attempts||[],a.cases[c.index]?.attempts||[]);if(before.board.bad||before.issue)assert.equal(page.record.cases[c.index].support,true);}
 });
 return{captures,checked,retries,api,capture,check,solve,retry,setLabel:x=>label=x,open:id=>(page=env.open(id)),get page(){return page}};
}

test('four exact original prerequisites use real range/select/button handlers and all 21 source pins',()=>{
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(new URL(file,root))),sha,file);
 assert.deepEqual(controllerSourceHashes,navigationFixture.controllerSourceHashes);
 const targets=flows.orderedUnitcoverTargets(),needed=[];assert.equal(targets.length,11);assert.equal(new Set(targets.map(c=>c.id)).size,7);
 for(const id of new Set(targets.map(c=>c.id))){const group=targets.filter(c=>c.id===id);for(let i=0;i<=Math.max(...group.map(c=>c.index));i++)if(!group.some(c=>c.index===i))needed.push(id+':'+i);}
 assert.deepEqual(needed.sort(),navigationFixture.navigation.map(c=>c.id+':'+c.index).sort());assert.equal(needed.length,4);
 let rangeEvents=0;
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);assert.equal(c.strictUnitcoverCoverage,false);assert.equal(binding(taskFor(c),ctx(c)),null);
  const s=Core.fresh(),a=State.freshLesson(c.id);a.index=c.index;(Object.hasOwn(BRIDGES,c.id)?s.daily.bridges:s.lessons)[c.id]=a;const env=environment(s),page=env.open(c.id);
  for(const step of c.steps)step.field?page.field(step.field,step.value):page.action(step.action,step.data?.index);page.check(true);assert.equal(replay(taskFor(c),page.model),null);rangeEvents+=env.stats.rangeEvents;
 }
 assert.equal(rangeEvents,16);
});

test('the entire cumulative source route uses original Next, Check, support and shared retry callbacks',async()=>{
 const env=environment(),h=proofHarness(env);let currentId=null,prerequisites=0,boundaries=0;
 for(const c of flows.orderedUnitcoverTargets()){
  h.setLabel(c.role+'-'+c.id+'-'+c.index);if(c.id!==currentId){h.open(c.id);currentId=c.id;}
  while(h.page.record.index<c.index){
   const index=h.page.record.index,previous={id:c.id,index},task=taskFor(previous);
   if(!h.page.record.cases[index]?.attempts?.some(a=>Tasks.inspect(task,a.value).correct)){
    const prep=navigationFixture.navigation.find(x=>x.id===c.id&&x.index===index);assert.ok(prep);for(const step of prep.steps)step.field?h.page.field(step.field,step.value):h.page.action(step.action,step.data?.index);
    h.check(previous,true,false,'navigation-prerequisite-'+index,'prerequisite');prerequisites++;
   }
   h.page.next();
  }
  assert.equal(h.page.record.index,c.index);assert.equal(h.page.record.cases[c.index]?.attempts?.length||0,0);assert.equal(retryTags(h.page.record).length,0);const fresh=Tasks.defaultModel(taskFor(c));fresh.seed=h.page.model.seed;assert.deepEqual(h.page.model,fresh);
  if(c.role==='native'){
   h.page.originalUpdate(a=>State.supportLesson(a));const phases=await flows.unitcoverNativeFlow(c,h.api(c,'native'));assert.equal(phases.filter(x=>x.checked).length,17+(c.task.size===2?1:0));assert.equal(phases.length,23+(c.task.size===2?1:0));assert.deepEqual(h.page.record.cases[c.index].attempts,phases.filter(x=>x.checked).map(x=>x.attempt));
   for(const kind of flows.unitcoverBoundaryKindsFor(c)){h.setLabel('boundary-'+c.id+'-'+c.index+'-'+kind);h.retry(c,'boundary-'+kind);h.capture(c,'boundary-retry',false,'boundary');await flows.unitcoverBoundaryFlow(kind,c,h.api(c,'boundary'));assert.equal(State.currentSubmission(h.page.record).status,'correct');assert.ok(replay(taskFor(c),h.page.model));boundaries++;}
  }else{h.capture(c,'associated-initial',false,'associated');h.solve(c);h.capture(c,'associated-unsubmitted',false,'associated');const row=h.check(c,true,false,'associated-checked','associated');assert.ok(row.proof);assert.equal(binding(taskFor(c),ctx(c)),null);}
 }
 assert.equal(prerequisites,4);assert.equal(boundaries,4);assert.equal(env.stats.next,8);assert.equal(env.stats.rangeEvents,16);assert.equal(h.checked.length,128);assert.equal(h.captures.length,184);assert.equal(h.retries.length,11);
 assert.deepEqual(Object.fromEntries(['native','boundary','associated','prerequisite'].map(role=>[role,h.checked.filter(x=>x.role===role).length])),{native:105,boundary:14,associated:5,prerequisite:4});
 const all=env.read(),positions=[...new Set(h.checked.map(x=>x.id+':'+x.index))];assert.equal(positions.length,15);
 for(const key of positions){const rows=h.checked.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),a=(Object.hasOwn(BRIDGES,last.id)?all.daily.bridges:all.lessons)[last.id];assert.deepEqual(a.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(a.models[last.index],last.model);}
 for(const row of h.captures){const a=(Object.hasOwn(BRIDGES,row.id)?all.daily.bridges:all.lessons)[row.id],old=row.record?.attempts||[];assert.deepEqual(a.cases[row.index].attempts.slice(0,old.length),old);}
 for(const c of fixture.cases)assert.ok(replay(taskFor(c),all.lessons[c.id].models[c.index]));
 assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(cp(all))),atlas),all);const empty=Core.fresh(),incoming=Core.parseBackup(JSON.stringify(Core.backup(cp(all))),atlas),first=Core.merge(empty,incoming);assert.deepEqual(first,all);assert.deepEqual(Core.merge(cp(first),incoming),first);
 console.log('UNITCOVER_ORIGINAL_CONTINUOUS_ROUTE',JSON.stringify({targets:11,sessions:7,positions:15,prerequisites,boundaries,checked:h.checked.length,captures:h.captures.length,retries:h.retries.length,...env.stats,actualChromium:false}));
});

test('six isolated cap fixtures retain full models while the original controller writes metadata and preserves all attempts',async()=>{
 const c=fixture.cases[0],task=taskFor(c),totals={checked:0,captures:0,retries:0};
 for(const mode of flows.unitcoverCapacityModes()){
  const f=flows.constructUnitcoverCapacityFixture(c,mode,{Tasks,State,Core,Engine,setField,task}),a=f.state.lessons[c.id],m=a.models[c.index];
  assert.equal(f.constructedCompatibilityFixture,true);assert.equal(m.history.length,2000);assert.equal(Tasks.validModel(task,m),true);assert.equal(Tasks.inspect(task,m).correct,true);assert.ok(replay(task,m));assert.equal(m.board.bad,mode.kind==='bad');assert.equal(!!m.issue,mode.kind==='issue');assert.equal(a.cases[c.index]?.attempts.length||0,mode.prior);
  const env=environment(f.state),h=proofHarness(env);h.open(c.id);h.setLabel('cap-'+mode.id);const phases=await flows.unitcoverCapacityFlow(mode,c,h.api(c,'capacity'));
  assert.equal(h.checked.length,5);assert.equal(h.captures.length,14);assert.equal(h.retries.length,1);assert.equal(h.page.blocked,false);assert.equal(h.page.record.cases[c.index].attempts.length,mode.prior+5);assert.deepEqual(h.page.record.cases[c.index].attempts.slice(0,mode.prior),a.cases[c.index]?.attempts||[]);
  assert.deepEqual(h.page.record.notes,a.notes);assert.equal(h.page.record.draft,a.draft);assert.deepEqual(phases.at(-1).model,h.page.model);assert.equal(h.page.model.history.length,c.math.count+1);assert.ok(replay(task,h.page.model));
  const final=env.read(),backup=JSON.stringify(Core.backup(cp(final)));assert.deepEqual(Core.parseBackup(backup,atlas),final);assert.deepEqual(Core.merge(Core.fresh(),Core.parseBackup(backup,atlas)),final);
  const before=env.raw,invalid=cp(final);invalid.lessons[c.id].models[c.index].history=Array.from({length:2001},()=>({a:'clear',d:{},f:{}}));assert.throws(()=>Core.parseBackup(JSON.stringify(Core.backup(invalid)),atlas));assert.equal(env.raw,before);
  for(const key of Object.keys(totals))totals[key]+=h[key].length;
 }
 assert.deepEqual(totals,{checked:30,captures:84,retries:6});console.log('UNITCOVER_ORIGINAL_CAPACITY_ROUTE',JSON.stringify({...totals,modes:6,constructedCompatibilityFixture:true,actualChromium:false}));
});

test('three old practice models remain explicitly constructed compatibility data with no native claims',()=>{
 const s=Core.fresh();for(const c of fixture.practice){const t=taskFor(c),m=Tasks.defaultModel(t);for(const step of flows.unitcoverOperationPlan(c,m))if(step.field){setField(m,step.field,step.value);Engine.fieldExtra(t,m,step.field);}else Engine.actExtra(t,m,step.action,step.data||{});
  assert.equal(Tasks.inspect(t,m).correct,true);assert.ok(replay(t,m));assert.equal(binding(t,ctx(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:cp(m)}]},ctx(c)),null);const a=s.lessons[c.id]||=State.freshLesson(c.id);a.models[-1]=m;assert.deepEqual(a.cases,{});}
 assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(cp(s))),atlas),s);
});
