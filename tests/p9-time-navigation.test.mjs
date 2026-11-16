import test from 'node:test';
import {createRequire} from 'node:module';
const {orderedTimeTargets}=createRequire(import.meta.url)('./p9-time-adapter-browser.cjs');
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import fixture from './fixtures/p9-time-cases.cjs';
import navigationFixture from './fixtures/p9-time-navigation.cjs';
import {sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {renderExtra} from '../dist/learning/phase4/view-engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {timeBinding} from '../dist/learning/time-evidence.js';
import {studyActionFocus,learningActionPlan,learningStage} from '../dist/learning/workspace-flow.js';
await ensureB39Ready();
const {navigation,excludedRepresentatives}=navigationFixture;
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const selected=[...fixture.cases,...fixture.associatedCases,...fixture.excludedCases.filter(c=>excludedRepresentatives.includes(c.id+':'+c.index))];
const ordered=orderedTimeTargets();
let controlSteps=0,rangeEvents=0;
function apply(t,m,step){
 const html=renderExtra(t,m);
 if(step.field){
  const tags=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(x=>x[0]).filter(tag=>attrs(tag)['data-xfield']===step.field);
  assert.equal(tags.length,1,step.field+' must have one original control');const tag=tags[0],a=attrs(tag);
  assert.doesNotMatch(tag,/\bdisabled\b|\breadonly\b/);
  if(tag.startsWith('<select'))assert.ok(html.slice(html.indexOf(tag),html.indexOf('</select>',html.indexOf(tag))).includes(`value="${step.value}"`));
  if(a.type==='range'){
   const start=Number(a.min),end=Number(step.value),stride=Number(a.step||1);assert.ok(end>=start&&end<=Number(a.max));
   // Browser Home then ArrowRight: each original input transition is applied.
   const current=Number(step.field.split('.').reduce((value,key)=>value[key],m));
   if(current!==start){setField(m,step.field,start);Engine.fieldExtra(t,m,step.field);rangeEvents++;}
   for(let v=start+stride;v<=end;v+=stride){setField(m,step.field,v);Engine.fieldExtra(t,m,step.field);rangeEvents++;}
  }else{setField(m,step.field,a.type==='number'?(String(step.value)===''?null:Number(step.value)):String(step.value));Engine.fieldExtra(t,m,step.field);}
 }else{
  const tags=[...html.matchAll(/<(?:button|g|path|rect|circle)\b[^>]*>/g)].map(x=>x[0]).filter(tag=>attrs(tag)['data-x']===step.action&&Object.entries(step.data||{}).every(([k,v])=>attrs(tag)['data-'+k]===String(v)));
  assert.equal(tags.length,1,step.action+' must have one original control');assert.doesNotMatch(tags[0],/\bdisabled\b/);
  Engine.actExtra(t,m,step.action,step.data||{});
 }
 assert.equal(Tasks.validModel(t,m),true,t.type+' must retain an original valid model');controlSteps++;
}
function submit(lesson){
 const task=sessionTasks(lesson.id)[lesson.index],model=State.modelForLesson(lesson);
 const stage=learningStage(lesson,State.currentSubmission(lesson)),focus=studyActionFocus({stage,task,model});
 const plan=learningActionPlan({stage,readyToCheck:focus.readyToCheck}),button=[plan.primary,...plan.secondary].find(x=>x.action==='check');
 assert.ok(button&&!button.disabled,'unchanged original Check is available');
 assert.equal(State.submitLesson(lesson).correct,true);assert.equal(State.currentSubmission(lesson).status,'correct');
 assert.deepEqual(State.validateLesson(lesson,lesson.id,{allowBridge:true}).cases,lesson.cases);
}

test('16 frozen preceding positions use visible original controls and remain outside strict time coverage',()=>{
 assert.equal(navigation.length,16);
 const needed=[];
 for(const id of new Set(selected.map(c=>c.id))){const entries=selected.filter(c=>c.id===id),max=Math.max(...entries.map(c=>c.index));
  for(let index=0;index<=max;index++)if(!entries.some(c=>c.index===index))needed.push(id+':'+index);}
 assert.deepEqual(needed.sort(),navigation.map(c=>c.id+':'+c.index).sort());
 for(const [path,sha]of Object.entries({...fixture.sourceFiles,...navigationFixture.sourceHashes}))assert.equal(digest(readFileSync(new URL('../'+path,import.meta.url))),sha,path);
 for(const spec of navigation){
  const task=sessionTasks(spec.id)[spec.index];assert.deepEqual(task,spec.task);assert.equal(hash(task),spec.taskHash);
  assert.equal(timeBinding(task,{sessionId:spec.id,index:spec.index}),null);
  const lesson=State.freshLesson(spec.id);lesson.index=spec.index;const model=State.modelForLesson(lesson);
  for(const step of spec.steps)apply(task,model,step);submit(lesson);
 }
});

test('all 91 target positions have a forward original lesson path retaining every completed prerequisite and target',()=>{
 const records={};let prerequisites=0,checked=0,next=0;
 assert.equal(new Set(ordered.map(c=>c.id+':'+c.index)).size,91);
 for(const spec of ordered){
  const lesson=records[spec.id]??=State.freshLesson(spec.id);
  while(lesson.index<spec.index){
   const task=sessionTasks(spec.id)[lesson.index],attempts=lesson.cases[lesson.index]?.attempts||[];
   if(!attempts.some(a=>Tasks.inspect(task,a.value).correct)){
    const prep=navigation.find(x=>x.id===spec.id&&x.index===lesson.index);assert.ok(prep);
    for(const step of prep.steps)apply(task,State.modelForLesson(lesson),step);submit(lesson);prerequisites++;checked++;
   }
   assert.equal(State.currentSubmission(lesson).status,'correct');
   const before=structuredClone(lesson);lesson.index++;State.modelForLesson(lesson);
   assert.deepEqual(lesson.cases,before.cases);for(const [i,m]of Object.entries(before.models))assert.deepEqual(lesson.models[i],m);next++;
  }
  assert.equal(lesson.index,spec.index);const task=sessionTasks(spec.id)[spec.index],model=State.modelForLesson(lesson);
  assert.equal(hash(task),spec.taskHash);for(const step of spec.actions)apply(task,model,step);submit(lesson);checked++;
 }
 assert.equal(prerequisites,16);assert.equal(checked,107);assert.equal(Object.keys(records).length,50);assert.equal(next,57);
 console.log('TIME_ORIGINAL_NAVIGATION',JSON.stringify({positions:91,prerequisites,checked,next,controlSteps,rangeEvents,actualChromium:false}));
});
