import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-wideshift-cases.cjs';
import navigationFixture from './fixtures/p9-wideshift-navigation.cjs';
const {navigation}=navigationFixture;
import {sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {renderExtra} from '../dist/learning/phase4/view-engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {wideShiftEvidenceSteps} from '../scripts/wideshift-evidence-fixture.mjs';
import {wideShiftBinding} from '../dist/learning/wideshift-evidence.js';
import {studyActionFocus,learningActionPlan,learningStage} from '../dist/learning/workspace-flow.js';
await ensureB39Ready();
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const selected=[...fixture.cases,...fixture.associated,...fixture.excludedAdd.filter(c=>c.kind==='bridge')];
const addSteps=[{field:'guess',value:'-1'},{action:'wide-predict',data:{}},{action:'wide-move',data:{delta:1}},
 {action:'wide-swap',data:{kind:'up',index:1}},{field:'answer',value:'10500'},
 {action:'wide-changed',data:{index:0}},{action:'wide-changed',data:{index:1}}];
let controlSteps=0;
function apply(t,m,step){
 const html=renderExtra(t,m);
 if(step.field){
  const tag=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(x=>x[0]).find(tag=>attrs(tag)['data-xfield']===step.field);
  assert.ok(tag,step.field+' must be visible');assert.doesNotMatch(tag,/\bdisabled\b|\breadonly\b/);
  if(tag.startsWith('<select'))assert.ok(html.slice(html.indexOf(tag),html.indexOf('</select>',html.indexOf(tag))).includes(`value="${step.value}"`));
  setField(m,step.field,String(step.value));Engine.fieldExtra(t,m,step.field);
 }else{
  const tag=[...html.matchAll(/<(?:button|g)\b[^>]*>/g)].map(x=>x[0]).find(tag=>attrs(tag)['data-x']===step.action&&Object.entries(step.data||{}).every(([k,v])=>attrs(tag)['data-'+k]===String(v)));
  assert.ok(tag,step.action+' must be visible');assert.doesNotMatch(tag,/\bdisabled\b/);Engine.actExtra(t,m,step.action,step.data);
 }
 assert.equal(Tasks.validModel(t,m),true);controlSteps++;
}

test('11 frozen preceding tasks are genuinely solvable through their original visible controls and are not wideshift coverage',()=>{
 assert.equal(navigation.length,11);
 const found=[];
 for(const id of new Set(selected.map(c=>c.id))){const entries=selected.filter(c=>c.id===id),max=Math.max(...entries.map(c=>c.index));
  for(let index=0;index<=max;index++)if(!entries.some(c=>c.index===index))found.push(id+':'+index);}
 assert.deepEqual(found.sort(),navigation.map(c=>c.id+':'+c.index).sort());
 for(const spec of navigation){
  const task=sessionTasks(spec.id)[spec.index];assert.deepEqual(task,spec.task);assert.equal(hash(task),spec.taskHash);
  assert.equal(wideShiftBinding(task,{sessionId:spec.id,index:spec.index}),null);
  const lesson=State.freshLesson(spec.id);lesson.index=spec.index;const model=State.modelForLesson(lesson);
  for(const step of spec.steps)apply(task,model,step);
  const stage=learningStage(lesson,State.currentSubmission(lesson)),focus=studyActionFocus({stage,task,model});
  const plan=learningActionPlan({stage,readyToCheck:focus.readyToCheck});
  const button=[plan.primary,...plan.secondary].find(x=>x.action==='check');assert.ok(button&&!button.disabled);
  assert.equal(State.submitLesson(lesson).correct,true);assert.equal(State.currentSubmission(lesson).status,'correct');
  assert.deepEqual(State.validateLesson(lesson,spec.id,{allowBridge:true}).cases,lesson.cases);
 }
});

test('all 48 reviewed and isolated positions have a continuous original lesson path retaining earlier work and checks',()=>{
 const records={};let prerequisites=0,checked=0,next=0;
 for(const spec of selected){
  const lesson=records[spec.id]??=State.freshLesson(spec.id);
  while(lesson.index<spec.index){
   const task=sessionTasks(spec.id)[lesson.index],attempts=lesson.cases[lesson.index]?.attempts||[];
   if(!attempts.some(a=>Tasks.inspect(task,a.value).correct)){
    const prep=navigation.find(x=>x.id===spec.id&&x.index===lesson.index);assert.ok(prep);
    for(const step of prep.steps)apply(task,State.modelForLesson(lesson),step);
    assert.equal(State.submitLesson(lesson).correct,true);prerequisites++;checked++;
   }
   assert.equal(State.currentSubmission(lesson).status,'correct');const before=structuredClone(lesson.cases);
   lesson.index++;State.modelForLesson(lesson);assert.deepEqual(lesson.cases,before);next++;
  }
  assert.equal(lesson.index,spec.index);const task=sessionTasks(spec.id)[spec.index],model=State.modelForLesson(lesson);
  for(const step of task.mode==='add'?addSteps:wideShiftEvidenceSteps(task))apply(task,model,step);
  assert.equal(State.submitLesson(lesson).correct,true);checked++;
  assert.deepEqual(State.validateLesson(lesson,spec.id,{allowBridge:true}).cases,lesson.cases);
 }
 assert.equal(selected.length,48);assert.equal(prerequisites,11);assert.equal(checked,59);
 assert.equal(next,59-Object.keys(records).length);
 console.log('WIDESHIFT_ORIGINAL_NAVIGATION',JSON.stringify({positions:selected.length,prerequisites,checked,next,controlSteps}));
});
