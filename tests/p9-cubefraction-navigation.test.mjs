import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-cubefraction-cases.cjs';
import navigationFixture from './fixtures/p9-cubefraction-navigation.cjs';
import flows from './p9-cubefraction-adapter-browser.cjs';
import {sessionTasks,sessionTaskFor,BRIDGES} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {renderExtra} from '../dist/learning/phase4/view-engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {cubeFractionBinding as binding,replayCubeFractionEvidence as replay} from '../dist/learning/cubefraction-evidence.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {learningStage,studyActionFocus,learningActionPlan} from '../dist/learning/workspace-flow.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import * as Core from '../dist/exploration-core.js';
await ensureB39Ready();
const{orderedCubeFractionTargets,cubeFractionOperationPlan,cubeFractionBoundaryKindsFor,cubeFractionNativeFlow,cubeFractionBoundaryFlow}=flows;
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
  Engine.actExtra(task,model,step.action==='turn-extra'?'m31-turn':step.action,step.data||{});counters.actions++;
 }
 assert.equal(Tasks.validModel(task,model),true,'original complete model after '+JSON.stringify(step));
}

test('ten literal prerequisites use actual original widgets, exact sources, number and range handlers',()=>{
 const targets=orderedCubeFractionTargets(),needed=[];assert.equal(targets.length,11);assert.equal(new Set(targets.map(c=>c.id)).size,8);
 for(const id of new Set(targets.map(c=>c.id))){const group=targets.filter(c=>c.id===id),last=Math.max(...group.map(c=>c.index));for(let index=0;index<=last;index++)if(!group.some(c=>c.index===index))needed.push(id+':'+index);}
 assert.deepEqual(needed.sort(),navigation.map(c=>c.id+':'+c.index).sort());assert.equal(navigation.length,10);
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 const before={...counters};
 for(const c of navigation){const task=taskFor(c);assert.deepEqual(task,c.task);assert.equal(hash(task),c.taskHash);assert.equal(binding(task,context(c)),null);assert.equal(c.strictCubefractionCoverage,false);
  const model=Tasks.defaultModel(task);for(const step of c.steps)apply(task,model,step);assert.equal(Tasks.inspect(task,model).correct,true,c.id+':'+c.index);assert.equal(replay(task,model),null);}
 const measured=Object.fromEntries(Object.entries(counters).map(([key,value])=>[key,value-before[key]]));assert.deepEqual(measured,{fields:43,coreFields:3,actions:65,rangeEvents:66});
 console.log('CUBEFRACTION_ORIGINAL_PREREQUISITES',JSON.stringify(measured));
});

function harness(records){
 const checked=[],captures=[],retries=[],names=new Set();let label='';
 const lesson=c=>records[c.id],model=c=>State.modelForLesson(lesson(c));
 const field=(c,key,value)=>apply(taskFor(c),model(c),{field:key,value:String(value)}),action=(c,name,data)=>apply(taskFor(c),model(c),{action:name,data});
 const solve=c=>{for(const step of cubeFractionOperationPlan(c,model(c)))apply(taskFor(c),model(c),step);};
 const capture=(c,phase,strict,{role,checkedAttempt=false}={})=>{
  const stem=label+'-'+phase;assert.ok(!names.has(stem),'unique raw/state snapshot stem '+stem);names.add(stem);
  const a=lesson(c),record=cp(a.cases[c.index]||null),current=cp(model(c)),task=taskFor(c),proof=replay(task,current),feedback=thinkingFeedback(task,current,record,context(c));
  const isNative=!!binding(task,context(c));assert.equal(isNative&&!!feedback,strict,stem);
  if(role!=='prerequisite')assert.equal(!!feedback,strict,'associated/excluded models do not get a native cubefraction claim');
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
  checkpoint:stage=>{if(['correct-unsubmitted','modified-prose','closed-unsubmitted','shared-retry'].includes(stage))assert.equal(thinkingFeedback(taskFor(c),model(c),aRecord(c),context(c)),null);},assert:(value,message)=>assert.ok(value,message)});
 const aRecord=c=>lesson(c).cases[c.index];
 return{records,checked,captures,retries,field,action,solve,model,capture,check,retry,api,label:value=>label=value};
}

test('all eleven targets and ten prerequisites retain one cumulative original Next/retry route and every cube boundary',async()=>{
 const records={},h=harness(records),before={...counters};let nextCount=0,prerequisites=0,boundaryCount=0;
 for(const c of orderedCubeFractionTargets()){
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
  assert.equal(a.index,c.index);assert.equal(a.cases[c.index]?.attempts?.length??0,0);assert.deepEqual(h.model(c),Tasks.defaultModel(taskFor(c)));assert.equal(retryControls(a).length,0,'new empty position has no P3 retry');assert.equal(hash(taskFor(c)),c.taskHash);
  if(c.role==='native'){
   State.supportLesson(a);const phases=await cubeFractionNativeFlow(c,h.api(c,'native'));assert.equal(phases.filter(x=>x.checked).length,10);assert.equal(phases.length,14);assert.deepEqual(a.cases[c.index].attempts,phases.filter(x=>x.checked).map(x=>x.attempt));
   for(const kind of cubeFractionBoundaryKindsFor(c)){h.label('boundary-'+c.id+'-'+c.index+'-'+kind);h.retry(c,'boundary-'+kind,'boundary');await cubeFractionBoundaryFlow(kind,c,h.api(c,'boundary'));assert.equal(State.currentSubmission(a).status,'correct');assert.ok(replay(taskFor(c),h.model(c)));boundaryCount++;}
  }else{h.solve(c);const row=h.check(c,true,false,c.role+'-checked',c.role);assert.equal(!!row.proof,c.role==='associated');assert.equal(binding(taskFor(c),context(c)),null);}
 }
 assert.equal(prerequisites,10);assert.equal(nextCount,13);assert.equal(Object.keys(records).length,8);assert.equal(boundaryCount,6);assert.equal(h.checked.length,95);assert.equal(h.captures.length,130);assert.equal(h.retries.length,12);
 assert.deepEqual(Object.fromEntries(['native','boundary','associated','excluded','prerequisite'].map(role=>[role,h.checked.filter(x=>x.role===role).length])),{native:60,boundary:20,associated:4,excluded:1,prerequisite:10});
 const positions=[...new Set(h.checked.map(x=>x.id+':'+x.index))];assert.equal(positions.length,21);
 for(const key of positions){const rows=h.checked.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),a=records[last.id];assert.deepEqual(a.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(a.models[last.index],last.model);}
 for(const row of h.captures){const prior=row.record?.attempts||[];assert.deepEqual(records[row.id].cases[row.index].attempts.slice(0,prior.length),prior);}
 for(const c of fixture.cases)assert.ok(replay(taskFor(c),records[c.id].models[c.index]));
 const all=Core.fresh();for(const[id,a]of Object.entries(records))(Object.hasOwn(BRIDGES,id)?all.daily.bridges:all.lessons)[id]=a;assert.deepEqual(Core.validate(cp(all),atlas),all);assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(all)),atlas),all);
 console.log('CUBEFRACTION_ORIGINAL_CONTINUOUS_ROUTE',JSON.stringify({targets:11,sessions:8,positions:21,prerequisites,next:nextCount,boundaries:boundaryCount,checked:h.checked.length,captures:h.captures.length,retries:h.retries.length,existingOtherEvidenceChecks:h.checked.filter(x=>x.existingOtherFeedback).length,...Object.fromEntries(Object.entries(counters).map(([key,value])=>[key,value-before[key]])),actualChromium:false}));
});

test('two old practice models remain explicitly constructed compatibility records, separate from native work',()=>{
 const all=Core.fresh();assert.equal(fixture.practice.length,2);
 for(const c of fixture.practice){const task=taskFor(c),model=Tasks.defaultModel(task);for(const step of cubeFractionOperationPlan(c,model))apply(task,model,step);assert.equal(Tasks.inspect(task,model).correct,true);assert.ok(replay(task,model));assert.equal(binding(task,context(c)),null);
  const a=all.lessons[c.id]??=State.freshLesson(c.id);a.models[-1]=model;assert.deepEqual(a.cases,{});assert.equal(a.index,0);}
 assert.deepEqual(Core.validate(cp(all),atlas),all);assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(all)),atlas),all);assert.throws(()=>Core.parseBackup('{',atlas));
});

test('taking back and rebuilding before the first check does not invent an earlier submission in feedback',()=>{
 const c=fixture.cases[0],task=taskFor(c),lesson=State.freshLesson(c.id),model=State.modelForLesson(lesson);
 for(const step of cubeFractionOperationPlan(c,model))apply(task,model,step);apply(task,model,{action:'m31-remove'});
 for(const step of cubeFractionOperationPlan(c,model))apply(task,model,step);assert.equal(lesson.cases[c.index]?.attempts?.length??0,0);
 assert.equal(State.submitLesson(lesson).correct,true);assert.equal(lesson.cases[c.index].attempts.length,1);
 const feedback=thinkingFeedback(task,model,lesson.cases[c.index],context(c));assert.ok(feedback);
 const words=JSON.stringify(feedback);assert.match(words,/历史保留了 1 次实际取回/);assert.doesNotMatch(words,/先前提交|此前提交/);
});
