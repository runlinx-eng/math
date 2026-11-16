import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import fixture from './fixtures/p9-area-cases.cjs';
import navigationFixture from './fixtures/p9-area-navigation.cjs';
import {sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready,prepareSessionRuntime} from '../dist/learning/phase4/async-batches.js';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {renderExtra} from '../dist/learning/phase4/view-engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {areaBinding} from '../dist/learning/area-evidence.js';
import {studyActionFocus,learningActionPlan,learningStage} from '../dist/learning/workspace-flow.js';
const {orderedAreaTargets}=createRequire(import.meta.url)('./p9-area-adapter-browser.cjs');
await ensureB39Ready();await prepareSessionRuntime('tools39',{view:true});
const {navigation}=navigationFixture;
const source=readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8');
const start=source.indexOf('function widgets('),end=source.indexOf('\nfunction ',start+1);
assert.ok(start>=0&&end>start,'original widgets function remains identifiable');
const btn=source.split('\n').find(line=>line.startsWith('const btn=')),num=source.split('\n').find(line=>line.startsWith('const num='));
// These three core prerequisites use the actual committed widgets function;
// they are not replaced by a test-only reconstruction of its HTML.
const widgets=new Function('isExtra','renderExtra','voxels',btn+'\n'+num+'\nconst a={view:"task"},spread=0;return ('+source.slice(start,end)+');')(Engine.isExtra,renderExtra,Tasks.voxels);
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>createHash('sha256').update(value).digest('hex'),hash=value=>digest(JSON.stringify(stable(value)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match=>[match[1],match[2]]));
const selected=[...fixture.cases,...fixture.associatedCases,...fixture.excludedCases],key=spec=>spec.id+':'+spec.index;

function apply(task,model,step,stats){
 const html=widgets(task,model),field=step.field||step.coreField;
 if(field){
  const attribute=step.coreField?'data-field':'data-xfield';
  const tags=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(match=>match[0]).filter(tag=>attrs(tag)[attribute]===field);
  assert.equal(tags.length,1,task.type+' '+attribute+' '+field+' must have one original visible control');
  const tag=tags[0],properties=attrs(tag);assert.doesNotMatch(tag,/\bdisabled\b|\breadonly\b/);
  if(tag.startsWith('<select'))assert.ok(html.slice(html.indexOf(tag),html.indexOf('</select>',html.indexOf(tag))).includes(`value="${step.value}"`),field+' actual selectable value '+step.value);
  const write=raw=>{
   const numeric=['number','range'].includes(properties.type)||(step.coreField?field==='choice':field.startsWith('pair.'));
   let value=numeric?(String(raw)===''?null:Number(raw)):String(raw);
   if(step.coreField){if(numeric&&value!==null)value=Math.max(0,Math.min(999,Math.trunc(value)));model[field]=value;}
   else{setField(model,field,value);Engine.fieldExtra(task,model,field);}
  };
  if(properties.type==='range'){
   const min=Number(properties.min??0),max=Number(properties.max??100),stepSize=Number(properties.step??1),target=Number(step.value),steps=Math.round((target-min)/stepSize);
   assert.ok(stepSize>0&&target>=min&&target<=max&&Math.abs(min+steps*stepSize-target)<1e-9,'original range target is keyboard reachable');
   const current=Number(field.split('.').reduce((value,key)=>value[key],model));
   if(current!==min){write(min);stats.rangeEvents++;}
   for(let i=1;i<=steps;i++){write(min+i*stepSize);stats.rangeEvents++;}
  }else write(step.value);
  stats.fields++;if(step.coreField)stats.coreFields++;
 }else{
  let tags=[...html.matchAll(/<(?:button|g|path|rect|circle|polygon)\b[^>]*>/g)].map(match=>match[0]).filter(tag=>attrs(tag)['data-x']===step.action&&Object.entries(step.data||{}).every(([key,value])=>attrs(tag)['data-'+key]===String(value)));
  const buttons=tags.filter(tag=>tag.startsWith('<button'));if(buttons.length)tags=buttons;
  assert.equal(tags.length,1,task.type+' '+step.action+' has one original control after preferring its explicit button');assert.doesNotMatch(tags[0],/\bdisabled\b/);
  const oldHistory=Array.isArray(model.history)?structuredClone(model.history):null;
  Engine.actExtra(task,model,step.action==='turn-extra'?'a30-turn':step.action,step.data||{});
  if(oldHistory)assert.deepEqual(model.history.slice(0,oldHistory.length),oldHistory,'original action keeps its prior history');
  stats.actions++;
 }
 assert.equal(Tasks.validModel(task,model),true,task.type+' original model after '+JSON.stringify(step));stats.controlSteps++;
}
const newStats=()=>({controlSteps:0,fields:0,coreFields:0,actions:0,rangeEvents:0});
function submit(lesson){
 const task=sessionTasks(lesson.id)[lesson.index],model=State.modelForLesson(lesson),before=structuredClone(lesson);
 const stage=learningStage(lesson,State.currentSubmission(lesson)),focus=studyActionFocus({stage,task,model});
 const plan=learningActionPlan({stage,readyToCheck:focus.readyToCheck}),button=[plan.primary,...plan.secondary].find(value=>value.action==='check');
 assert.ok(button&&!button.disabled,'unchanged original Check control is available');
 assert.equal(State.submitLesson(lesson).correct,true);assert.equal(State.currentSubmission(lesson).status,'correct');
 assert.deepEqual(lesson.cases[lesson.index].attempts.slice(0,-1),before.cases[lesson.index]?.attempts||[]);
 assert.deepEqual(lesson.cases[lesson.index].attempts.at(-1).value,model);
 for(const [index,value]of Object.entries(before.models))assert.deepEqual(lesson.models[index],value);
 assert.deepEqual(State.validateLesson(lesson,lesson.id,{allowBridge:true}),lesson);
}

test('24 frozen preceding positions use the actual original controls and remain outside strict area coverage',()=>{
 assert.equal(navigation.length,24);
 const needed=[];
 for(const id of new Set(selected.map(spec=>spec.id))){const entries=selected.filter(spec=>spec.id===id),max=Math.max(...entries.map(spec=>spec.index));for(let index=0;index<=max;index++)if(!entries.some(spec=>spec.index===index))needed.push(id+':'+index);}
 assert.deepEqual(needed.sort(),navigation.map(key).sort());
 for(const [file,sha]of Object.entries({...fixture.sourceFiles,...navigationFixture.sourceHashes}))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file+' original bytes');
 const stats=newStats();
 for(const spec of navigation){
  const task=sessionTasks(spec.id)[spec.index];assert.deepEqual(task,spec.task);assert.equal(hash(task),spec.taskHash);assert.equal(spec.strictAreaCoverage,false);
  assert.equal(areaBinding(task,{sessionId:spec.id,index:spec.index}),null);
  const model=Tasks.defaultModel(task);for(const step of spec.steps)apply(task,model,step,stats);assert.equal(Tasks.inspect(task,model).correct,true,key(spec)+' original mathematical completion');
 }
 assert.equal(stats.controlSteps,146);assert.equal(stats.rangeEvents,75);assert.equal(stats.coreFields,11);
 console.log('AREA_ORIGINAL_PREREQUISITES',JSON.stringify({positions:24,...stats,originalCoreRenderEvaluated:true,actualChromium:false}));
});

test('all 87 target positions have one forward original lesson path retaining every prerequisite and completed target',()=>{
 const originalFixtures=structuredClone(selected),ordered=orderedAreaTargets(),records={},stats=newStats();let prerequisites=0,checked=0,next=0;
 assert.equal(ordered.length,87);assert.equal(new Set(ordered.map(key)).size,87);assert.deepEqual(ordered.map(key).sort(),selected.map(key).sort());
 assert.deepEqual(Object.fromEntries(['native','associated','excluded'].map(role=>[role,ordered.filter(spec=>spec.role===role).length])),{native:17,associated:44,excluded:26});
 for(const spec of ordered){
  const lesson=records[spec.id]??=State.freshLesson(spec.id);assert.ok(lesson.index<=spec.index,'the schedule never revisits an earlier index');
  while(lesson.index<spec.index){
   const task=sessionTasks(spec.id)[lesson.index],attempts=lesson.cases[lesson.index]?.attempts||[];
   if(!attempts.some(attempt=>Tasks.inspect(task,attempt.value).correct)){
    const prep=navigation.find(value=>value.id===spec.id&&value.index===lesson.index);assert.ok(prep,'every missing earlier position has one frozen ordinary plan');
    for(const step of prep.steps)apply(task,State.modelForLesson(lesson),step,stats);submit(lesson);prerequisites++;checked++;
   }
   assert.equal(State.currentSubmission(lesson).status,'correct');assert.equal(State.lessonSummary(lesson).cases[lesson.index].complete,true);
   const before=structuredClone(lesson);lesson.index++;State.modelForLesson(lesson);
   assert.deepEqual(lesson.cases,before.cases);assert.deepEqual(lesson.notes,before.notes);for(const [index,model]of Object.entries(before.models))assert.deepEqual(lesson.models[index],model);next++;
  }
  assert.equal(lesson.index,spec.index);const task=sessionTasks(spec.id)[spec.index],model=State.modelForLesson(lesson);
  assert.equal(hash(task),spec.taskHash);for(const step of spec.actions)apply(task,model,step,stats);submit(lesson);checked++;
 }
 assert.equal(prerequisites,24);assert.equal(checked,111);assert.equal(Object.keys(records).length,49);assert.equal(next,62);
 const allCases=Object.values(records).flatMap(record=>Object.values(record.cases));assert.equal(allCases.length,111);assert.equal(allCases.reduce((sum,entry)=>sum+entry.attempts.length,0),111);
 assert.deepEqual(selected,originalFixtures,'pure target ordering and UI plans never mutate the frozen fixtures');
 console.log('AREA_ORIGINAL_NAVIGATION',JSON.stringify({positions:87,courses:49,prerequisites,checked,next,...stats,actualChromium:false}));
});
