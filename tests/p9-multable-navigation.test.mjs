import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-multable-cases.cjs';
import navigationFixture from './fixtures/p9-multable-navigation.cjs';
import flows from './p9-multable-adapter-browser.cjs';
import {sessionTasks,sessionTaskFor,sessionMeta,sessionRoute,BRIDGES} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Daily from '../dist/learning/daily.js';
import * as Storage from '../dist/storage.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {renderExtra} from '../dist/learning/phase4/view-engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {multableBinding as binding,replayMultableEvidence as replay} from '../dist/learning/multable-evidence.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {learningStage,studyActionFocus,learningActionPlan} from '../dist/learning/workspace-flow.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import * as Core from '../dist/exploration-core.js';
await ensureB39Ready();
const{orderedMultableTargets,multableOperationPlan,multableBoundaryKindsFor,multableNativeFlow,multableBoundaryFlow}=flows;
const{navigation}=navigationFixture,cp=structuredClone,taskFor=c=>sessionTaskFor(c.id,c.index),context=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x))),attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const source=readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8'),start=source.indexOf('function widgets('),end=source.indexOf('\nfunction ',start+1);
assert.ok(start>=0&&end>start);
const btn=source.split('\n').find(line=>line.startsWith('const btn=')),num=source.split('\n').find(line=>line.startsWith('const num='));
const widgets=new Function('isExtra','renderExtra','voxels',btn+'\n'+num+'\nconst a={view:"task"},spread=0;return ('+source.slice(start,end)+');')(Engine.isExtra,renderExtra,Tasks.voxels);
const counters={fields:0,coreFields:0,actions:0,rangeEvents:0};
const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
const retryControls=record=>{const host={innerHTML:''};renderP3Flow(host,{atlas,id:record.id,record});return[...host.innerHTML.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]).filter(tag=>attrs(tag)['data-do']==='p3-retry');};
function apply(task,model,step){
 const html=widgets(task,model),field=step.field||step.coreField;
 if(field){
  const attribute=step.coreField?'data-field':'data-xfield',matches=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(m=>m[0]).filter(tag=>attrs(tag)[attribute]===field);
  assert.equal(matches.length,1,'one original field '+task.type+' '+field);const tag=matches[0],a=attrs(tag);assert.doesNotMatch(tag,/\bdisabled\b|\breadonly\b/);
  if(tag.startsWith('<select')){const from=html.indexOf(tag),body=html.slice(from,html.indexOf('</select>',from));assert.equal([...body.matchAll(/<option\b[^>]*>/g)].filter(m=>attrs(m[0]).value===String(step.value)).length,1,'original selectable value');}
  const update=raw=>{const numeric=['number','range'].includes(a.type)||(step.coreField?field==='choice':field.startsWith('pair.'));let value=numeric?(String(raw)===''?null:Number(raw)):String(raw);
   if(step.coreField){if(numeric&&value!==null)value=Math.max(0,Math.min(999,Math.trunc(value)));model[field]=value;}else{setField(model,field,value);Engine.fieldExtra(task,model,field);}};
  if(a.type==='range'){const min=Number(a.min),max=Number(a.max),stride=Number(a.step||1),to=Number(step.value);assert.ok(to>=min&&to<=max&&Number.isInteger((to-min)/stride));
   if(Number(field.split('.').reduce((v,k)=>v[k],model))!==min){update(min);counters.rangeEvents++;}for(let v=min+stride;v<=to;v+=stride){update(v);counters.rangeEvents++;}
  }else{if(a.maxlength)assert.ok(String(step.value).length<=Number(a.maxlength));update(step.value);}counters.fields++;if(step.coreField)counters.coreFields++;
 }else{
  const tags=[...html.matchAll(/<(?:button|g|path|rect|circle|polygon)\b[^>]*>/g)].map(m=>m[0]).filter(tag=>attrs(tag)['data-x']===step.action&&Object.entries(step.data||{}).every(([k,v])=>attrs(tag)['data-'+k]===String(v)));
  const buttons=tags.filter(tag=>tag.startsWith('<button')),matches=buttons.length?buttons:tags;assert.equal(matches.length,1,'one original action '+task.type+' '+step.action);assert.doesNotMatch(matches[0],/\bdisabled\b/);
  Engine.actExtra(task,model,step.action,step.data||{});counters.actions++;
 }
 assert.equal(Tasks.validModel(task,model),true,'original complete model after '+JSON.stringify(step));
}

test('nine literal prerequisites use actual original controls, handlers and exact sources',()=>{
 const targets=orderedMultableTargets(),needed=[];assert.equal(targets.length,28);assert.equal(new Set(targets.map(c=>c.id)).size,20);
 for(const id of new Set(targets.map(c=>c.id))){const group=targets.filter(c=>c.id===id),last=Math.max(...group.map(c=>c.index));for(let index=0;index<=last;index++)if(!group.some(c=>c.index===index))needed.push(id+':'+index);}
 assert.deepEqual(needed.sort(),navigation.map(c=>c.id+':'+c.index).sort());assert.equal(navigation.length,9);
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 const before={...counters};
 for(const c of navigation){const task=taskFor(c);assert.deepEqual(task,c.task);assert.equal(hash(task),c.taskHash);assert.equal(binding(task,context(c)),null);assert.equal(c.strictMultableCoverage,false);
  const model=Tasks.defaultModel(task);for(const step of c.steps)apply(task,model,step);assert.equal(Tasks.inspect(task,model).correct,true,c.id+':'+c.index);assert.equal(replay(task,model),null);}
 const measured=Object.fromEntries(Object.entries(counters).map(([key,value])=>[key,value-before[key]]));
 assert.deepEqual(measured,{fields:52,coreFields:0,actions:41,rangeEvents:26});
 console.log('MULTABLE_ORIGINAL_PREREQUISITES',JSON.stringify(measured));
});

function harness(records){
 const checked=[],captures=[],retries=[],names=new Set();let label='';
 const lesson=c=>records[c.id],model=c=>State.modelForLesson(lesson(c));
 const field=(c,key,value)=>apply(taskFor(c),model(c),{field:key,value:String(value)}),action=(c,name,data)=>apply(taskFor(c),model(c),{action:name,data});
 const solve=c=>{for(const step of multableOperationPlan(c,model(c)))apply(taskFor(c),model(c),step);};
 const capture=(c,phase,strict,{role,checkedAttempt=false}={})=>{
  const stem=label+'-'+phase;assert.ok(!names.has(stem),'unique raw/state snapshot stem '+stem);names.add(stem);
  const a=lesson(c),record=cp(a.cases[c.index]||null),current=cp(model(c)),task=taskFor(c),proof=replay(task,current),feedback=thinkingFeedback(task,current,record,context(c));
  const isNative=!!binding(task,context(c));assert.equal(isNative&&!!feedback,strict,stem);
  if(role!=='prerequisite')assert.equal(!!feedback,strict,'associated/excluded models do not get a native multable claim');
  if(strict){assert.ok(proof&&isNative);assert.deepEqual(record.attempts.at(-1).value,current);assert.equal(feedback.method,null);}
  const value={id:c.id,index:c.index,phase,role,stem,checked:checkedAttempt,model:current,record,proof,strict,existingOtherFeedback:!isNative&&!!feedback,correct:Tasks.inspect(task,current).correct,words:feedback?JSON.stringify(feedback):null};captures.push(value);return value;
 };
 const check=(c,correct,strict,phase,role)=>{
  const a=lesson(c),task=taskFor(c),before=cp(a.cases[c.index]?.attempts||[]),m=cp(model(c)),stage=learningStage(a,State.currentSubmission(a)),focus=studyActionFocus({stage,task,model:m});
  const plan=learningActionPlan({stage,hasNextTask:a.index<sessionTasks(c.id).length-1,readyToCheck:focus.readyToCheck}),button=[plan.primary,...plan.secondary].find(x=>x.action==='check');assert.ok(button&&!button.disabled,'original Check available '+c.id+':'+c.index+' '+phase);
  assert.equal(State.submitLesson(a).correct,correct);assert.equal(State.currentSubmission(a).status,correct?'correct':'revise');assert.deepEqual(a.cases[c.index].attempts.slice(0,-1),before);assert.deepEqual(a.cases[c.index].attempts.at(-1).value,m);
  assert.deepEqual(State.validateLesson(cp(a),c.id,{allowBridge:true}),a);const value=capture(c,phase,strict,{role,checkedAttempt:true});value.attempt=cp(a.cases[c.index].attempts.at(-1));checked.push(value);return value;
 };
 const retry=(c,kind,role)=>{const a=lesson(c),before=cp(a),buttons=retryControls(a);assert.equal(buttons.length,1,'actual P3 retry control exists');assert.doesNotMatch(buttons[0],/\bdisabled\b/);
  a.models[c.index]=Tasks.defaultModel(taskFor(c));assert.deepEqual(a.cases,before.cases);assert.deepEqual(a.notes,before.notes);assert.equal(a.draft,before.draft);for(const[index,m]of Object.entries(before.models))if(Number(index)!==c.index)assert.deepEqual(a.models[index],m);
  assert.equal(thinkingFeedback(taskFor(c),model(c),a.cases[c.index],context(c)),null);retries.push({id:c.id,index:c.index,kind,before,after:cp(a)});if(kind!=='native')capture(c,'retry-'+kind,false,{role});};
 const api=(c,role)=>({field:(key,value)=>field(c,key,value),action:(name,data)=>action(c,name,data),solve:()=>solve(c),model:()=>cp(model(c)),check:(correct,strict,phase)=>check(c,correct,strict,phase,role),capture:(phase,strict)=>capture(c,phase,strict,{role}),retry:kind=>retry(c,kind,role),
  checkpoint:stage=>{if(['correct-unsubmitted','modified-result','reset','shared-retry'].includes(stage))assert.equal(thinkingFeedback(taskFor(c),model(c),aRecord(c),context(c)),null);},assert:(value,message)=>assert.ok(value,message)});
 const aRecord=c=>lesson(c).cases[c.index];
 return{records,checked,captures,retries,field,action,solve,model,capture,check,retry,api,label:value=>label=value};
}

test('28 targets retain their original 20-session cumulative route, real retry and all current boundaries',async()=>{
 const records={},h=harness(records),before={...counters};let nextCount=0,prerequisites=0,boundaryCount=0;
 for(const c of orderedMultableTargets()){
  const a=records[c.id]??=State.freshLesson(c.id);State.modelForLesson(a);h.label(c.role+'-'+c.id+'-'+c.index);
  while(a.index<c.index){
   const previous={id:c.id,index:a.index},task=taskFor(previous);
   if(!a.cases[a.index]?.attempts?.some(x=>Tasks.inspect(task,x.value).correct)){
    const prep=navigation.find(x=>x.id===c.id&&x.index===a.index);assert.ok(prep);for(const step of prep.steps)apply(task,h.model(previous),step);
    h.check(previous,true,false,'navigation-prerequisite-'+a.index,'prerequisite');prerequisites++;
   }
   assert.equal(State.currentSubmission(a).status,'correct');assert.equal(State.lessonSummary(a).cases[a.index].complete,true);
   const stage=learningStage(a,State.currentSubmission(a)),plan=learningActionPlan({stage,hasNextTask:true,readyToCheck:true});assert.ok([plan.primary,...plan.secondary].some(x=>x.action==='next'&&!x.disabled));
   const prior=cp(a);a.index++;State.modelForLesson(a);assert.deepEqual(a.cases,prior.cases);assert.deepEqual(a.notes,prior.notes);assert.equal(a.draft,prior.draft);for(const[index,m]of Object.entries(prior.models))assert.deepEqual(a.models[index],m);nextCount++;
  }
  assert.equal(a.index,c.index);assert.equal(a.cases[c.index]?.attempts?.length??0,0);assert.deepEqual(h.model(c),Tasks.defaultModel(taskFor(c)));assert.equal(retryControls(a).length,0,'first empty position has no P3 retry');assert.equal(hash(taskFor(c)),c.taskHash);
  if(c.role==='native'){
   State.supportLesson(a);const phases=await multableNativeFlow(c,h.api(c,'native'));assert.equal(phases.filter(x=>x.checked).length,13);assert.equal(phases.length,17);assert.deepEqual(a.cases[c.index].attempts,phases.filter(x=>x.checked).map(x=>x.attempt));
   for(const kind of multableBoundaryKindsFor(c)){h.label('boundary-'+c.id+'-'+c.index+'-'+kind);h.retry(c,'boundary-'+kind,'boundary');await multableBoundaryFlow(kind,c,h.api(c,'boundary'));assert.equal(State.currentSubmission(a).status,'correct');assert.ok(replay(taskFor(c),h.model(c)));boundaryCount++;}
  }else{h.solve(c);const row=h.check(c,true,false,c.role+'-checked',c.role);assert.equal(!!row.proof,c.math.trades>0);assert.equal(binding(taskFor(c),context(c)),null);}
 }
 assert.equal(prerequisites,9);assert.equal(nextCount,17);assert.equal(Object.keys(records).length,20);assert.equal(boundaryCount,7);assert.equal(h.checked.length,172);assert.equal(h.captures.length,222);assert.equal(h.retries.length,17);
 assert.deepEqual(Object.fromEntries(['native','boundary','associated','excluded','prerequisite'].map(role=>[role,h.checked.filter(x=>x.role===role).length])),{native:130,boundary:15,associated:17,excluded:1,prerequisite:9});
 const positions=[...new Set(h.checked.map(x=>x.id+':'+x.index))];assert.equal(positions.length,37);
 for(const key of positions){const rows=h.checked.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),a=records[last.id];assert.deepEqual(a.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(a.models[last.index],last.model);}
 for(const row of h.captures){const prior=row.record?.attempts||[];assert.deepEqual(records[row.id].cases[row.index].attempts.slice(0,prior.length),prior);}
 for(const c of fixture.cases)assert.ok(replay(taskFor(c),records[c.id].models[c.index]));
 const all=Core.fresh();for(const[id,a]of Object.entries(records))(Object.hasOwn(BRIDGES,id)?all.daily.bridges:all.lessons)[id]=a;assert.deepEqual(Core.validate(cp(all),atlas),all);assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(all)),atlas),all);
 console.log('MULTABLE_ORIGINAL_CONTINUOUS_ROUTE',JSON.stringify({targets:28,sessions:20,positions:37,prerequisites,next:nextCount,boundaries:boundaryCount,checked:h.checked.length,captures:h.captures.length,retries:h.retries.length,existingOtherEvidenceChecks:h.checked.filter(x=>x.existingOtherFeedback).length,...Object.fromEntries(Object.entries(counters).map(([key,value])=>[key,value-before[key]])),actualChromium:false}));
});

test('three old practice models remain separate constructed compatibility data without native claims',()=>{
 const all=Core.fresh();assert.equal(fixture.practice.length,3);
 for(const c of fixture.practice){const task=taskFor(c),model=Tasks.defaultModel(task);for(const step of multableOperationPlan(c,model))apply(task,model,step);assert.equal(Tasks.inspect(task,model).correct,true);assert.equal(!!replay(task,model),c.math.trades>0);assert.equal(binding(task,context(c)),null);
  const a=all.lessons[c.id]??=State.freshLesson(c.id);a.models[-1]=model;assert.deepEqual(a.cases,{});assert.equal(a.index,0);}
 assert.deepEqual(Core.validate(cp(all),atlas),all);assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(all)),atlas),all);assert.throws(()=>Core.parseBackup('{',atlas));
});

test('the isolated capacity flows use original write validation, blocked-page preservation, reload and real retry availability',async()=>{
 const c=fixture.cases[0],task=taskFor(c),body=source.split('\n').find(line=>line.startsWith('function update('));assert.ok(body);
 assert.ok(source.includes("if(blocked){if(b.dataset.do==='save-note')showNoteSaveFailure();return;}"));
 assert.ok(source.includes("if(!el||blocked||a.view==='summary'||!isExtra(task())||numericReadOnly())return;"));
 const factory=new Function('d',`const {localStorage,KEY,atlas,id,read,sessionRecord,assertNoConcurrentLessonOverwrite,mergeLesson,uiSnapshot,now,validateLesson,BRIDGES,rememberSession,questionId,sessionMeta,sessionRoute,validate,writeStored,notify,$}=d;let all=read(),a=sessionRecord(all,id),blocked=false;${body};return {update,get blocked(){return blocked},get all(){return all},get record(){return a}};`);
 for(const mode of ['empty','saved']){
  const fixture=flows.constructMultableCapacityFixture(c,mode,{Tasks,State,Core,Engine,setField,task}),a=fixture.state.lessons[c.id],m=a.models[c.index];
  assert.equal(fixture.constructedCompatibilityFixture,true);assert.equal(m.history.length,3000);assert.equal(Tasks.validModel(task,m),true);assert.equal(Tasks.inspect(task,m).correct,mode==='saved');assert.equal(!!replay(task,m),mode==='saved');
  assert.equal(a.cases[c.index]?.attempts.length||0,mode==='saved'?1:0);assert.equal(retryControls(a).length,mode==='saved'?1:0);assert.equal(thinkingFeedback(task,m,a.cases[c.index],context(c)),null);
  assert.deepEqual(Core.validate(cp(fixture.state),atlas),fixture.state);assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(fixture.state)),atlas),fixture.state);
  const overflow=cp(m);Engine.actExtra(task,overflow,'b14-reset',{});assert.equal(overflow.history.length,3001);assert.equal(Tasks.validModel(task,overflow),false);assert.equal(replay(task,overflow),null);
  const corrupt=cp(fixture.state);corrupt.lessons[c.id].models[c.index]=overflow;assert.throws(()=>Core.validate(corrupt,atlas));assert.equal(m.history.length,3000);
  const backing=new Map(),storage={getItem:key=>backing.get(key)??null,setItem:(key,value)=>backing.set(key,String(value))};Storage.writeStored(Core.KEY,JSON.stringify(fixture.state),storage);
  const warning={hidden:true,textContent:''},snapshots=[],checked=[],names=new Set();let writes=0,retries=0,page,beforeOverflow,rawBeforeOverflow;
  const create=()=>factory({localStorage:storage,KEY:Core.KEY,atlas,id:c.id,read:()=>Core.validate(JSON.parse(Storage.readStored(Core.KEY,storage)),atlas),sessionRecord:Daily.sessionRecord,assertNoConcurrentLessonOverwrite:State.assertNoConcurrentLessonOverwrite,mergeLesson:State.mergeLesson,uiSnapshot:()=>cp(a.ui),now:Core.now,validateLesson:State.validateLesson,BRIDGES,rememberSession:Daily.rememberSession,questionId:null,sessionMeta,sessionRoute,validate:Core.validate,writeStored:(k,v)=>{writes++;Storage.writeStored(k,v,storage);},notify:()=>{},$:()=>warning});
  page=create();
  const capture=(phase,strict)=>{
   const stem=mode+'-'+phase;assert.ok(!names.has(stem));names.add(stem);const record=cp(page.record.cases[c.index]||null),model=cp(page.record.models[c.index]),feedback=thinkingFeedback(task,model,record,context(c));assert.equal(!!feedback,strict,stem);
   assert.equal(Tasks.validModel(task,model),true);const item={phase,record,model,proof:replay(task,model),strict,raw:storage.getItem(Core.KEY)};snapshots.push(item);return item;
  };
  const checkControl=()=>{const stage=learningStage(page.record,State.currentSubmission(page.record)),focus=studyActionFocus({stage,task,model:page.record.models[c.index]}),plan=learningActionPlan({stage,hasNextTask:false,readyToCheck:focus.readyToCheck});assert.ok([plan.primary,...plan.secondary].some(x=>x.action==='check'&&!x.disabled));};
  const resetControl=()=>{const tags=[...widgets(task,page.record.models[c.index]).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(tag=>attrs(tag)['data-x']==='b14-reset');assert.equal(tags.length,1);assert.doesNotMatch(tags[0],/\bdisabled\b/);};
  await flows.multableCapacityRecoveryFlow(mode,{
   capture,
   assertRetryAvailable:expected=>assert.equal(retryControls(page.record).length,expected?1:0),
   check:(correct,strict,phase)=>{checkControl();const before=cp(page.record),model=cp(page.record.models[c.index]);let result;assert.equal(page.update(r=>result=State.submitLesson(r)),true);assert.equal(result.correct,correct);assert.deepEqual(page.record.models[c.index],model);assert.deepEqual(page.record.cases[c.index].attempts.slice(0,-1),before.cases[c.index]?.attempts||[]);const row=capture(phase,strict);row.attempt=cp(page.record.cases[c.index].attempts.at(-1));row.checked=true;checked.push(row);return row;},
   overflow:()=>{resetControl();beforeOverflow=cp(page.record);rawBeforeOverflow=storage.getItem(Core.KEY);const beforeWrites=writes;assert.equal(page.update(r=>Engine.actExtra(task,State.modelForLesson(r),'b14-reset',{})),false);assert.equal(page.blocked,true);assert.equal(writes,beforeWrites);assert.equal(storage.getItem(Core.KEY),rawBeforeOverflow);assert.deepEqual(page.record,beforeOverflow);assert.match(warning.textContent,/已停止覆盖原记录/);},
   blockedAction:name=>{if(name==='check')checkControl();else if(name==='reset')resetControl();else assert.equal(retryControls(page.record).length,1);const beforeWrites=writes;assert.equal(page.update(r=>{if(name==='check')State.submitLesson(r);else if(name==='reset')Engine.actExtra(task,State.modelForLesson(r),'b14-reset',{});else r.models[r.index]=Tasks.defaultModel(task);}),false);assert.equal(writes,beforeWrites);assert.equal(storage.getItem(Core.KEY),rawBeforeOverflow);assert.deepEqual(page.record,beforeOverflow);},
   reload:()=>{page=create();warning.hidden=true;assert.equal(page.blocked,false);assert.deepEqual(page.record,beforeOverflow);assert.equal(page.update(()=>{}),true);},
   retry:kind=>{assert.equal(retryControls(page.record).length,1);const before=cp(page.record);assert.equal(page.update(r=>{r.view='task';r.models[r.index]=Tasks.defaultModel(task);}),true);assert.deepEqual(page.record.cases,before.cases);assert.deepEqual(page.record.notes,before.notes);assert.equal(page.record.draft,before.draft);capture('retry-'+kind,false);retries++;},
   solve:()=>{for(const step of multableOperationPlan(c,page.record.models[c.index]))assert.equal(page.update(r=>apply(task,State.modelForLesson(r),step)),true);}
  });
  assert.equal(checked.length,2);assert.equal(retries,1);assert.equal(snapshots.length,mode==='saved'?9:8);assert.equal(page.record.cases[c.index].attempts.length,fixture.constructedSubmissions+2);assert.equal(page.record.models[c.index].history.length,fixture.completionEvents);
  assert.deepEqual(page.record.notes,a.notes);assert.equal(page.record.draft,a.draft);assert.deepEqual(page.record.cases[c.index].attempts.slice(0,fixture.constructedSubmissions),a.cases[c.index]?.attempts||[]);
  for(const row of snapshots){const prefix=row.record?.attempts||[];assert.deepEqual(page.record.cases[c.index].attempts.slice(0,prefix.length),prefix);if(row.checked)assert.deepEqual(row.model,row.attempt.value);}
  assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(page.all)),atlas),page.all);
  console.log('MULTABLE_CONSTRUCTED_CAPACITY_RECOVERY',JSON.stringify({mode,constructedSubmissions:fixture.constructedSubmissions,actualChecksAfterImport:checked.length,currentCaptures:snapshots.length,retryAfterReload:retries,originalUpdateWrites:writes,actualChromium:false}));
 }
});
