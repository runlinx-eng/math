import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import fixture from './fixtures/p9-convert-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {actExtra,fieldExtra} from '../dist/learning/phase4/engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {renderExtra} from '../dist/learning/phase4/view-engine.js';
import {defaultModel,exampleModel,inspect,validModel} from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import {packText,unpackText} from '../dist/storage.js';
import {convertBinding,replayConvertEvidence} from '../dist/learning/convert-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';

const TYPE='x-m28-convert';
const all=fixture.routes.flat(),context=({id,index})=>({sessionId:id,index});
const taskFor=({id,index})=>sessionTaskFor(id,index),key=({id,index})=>id+':'+index;
const digest=value=>createHash('sha256').update(value).digest('hex');
const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort().map(k=>[k,ordered(value[k])])):value;
const taskHash=task=>digest(JSON.stringify(ordered(task)));
const record=model=>({attempts:[{value:structuredClone(model)}],support:false});
const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const backup=state=>JSON.stringify({app:'math-explorer',version:2,state});
const sameNumber=raw=>raw.includes('.')?raw+'0':raw+'.0';
const nearNumber=raw=>raw.includes('.')?raw.padEnd(raw.indexOf('.')+11,'0')+'1':raw+'.00000000001';

function doStep(task,model,step){
 if(step.field){
  assert.ok(renderExtra(task,model).includes('data-xfield="'+step.field+'"'),step.field);
  setField(model,step.field,step.value);fieldExtra(task,model,step.field);
 }else{
  const buttons=renderExtra(task,model).match(/<button[^>]*>/g)||[];
  assert.equal(buttons.filter(button=>button.includes('data-x="'+step.action+'"')&&
    (step.index===undefined||button.includes('data-index="'+step.index+'"'))).length,1,step.action);
  actExtra(task,model,step.action,step.index===undefined?{}:{index:step.index});
 }
 assert.equal(validModel(task,model),true);
}
function fill(task,model,field,values){
 values.forEach((value,index)=>doStep(task,model,{field:field+'.'+index,value}));
}
const save=(task,model)=>doStep(task,model,{action:'m28-convert'});

test('unchanged original source files and exhaustive native, associated and practice positions',()=>{
 for(const [name,sha] of Object.entries(fixture.sourceFiles)){
  assert.equal(digest(readFileSync(new URL('../'+name,import.meta.url))),sha,name);
 }
 const inventory=ids=>ids.flatMap(id=>(sessionTasks(id)||[]).flatMap((task,index)=>task?.type===TYPE?[id+':'+index]:[])).sort();
 assert.deepEqual(inventory(Object.keys(LESSONS)),fixture.cases.map(key).sort());
 assert.deepEqual(inventory(Object.keys(BRIDGES)),all.filter(row=>row.role==='associated').map(key).sort());
 const practice=Object.keys(LESSONS).filter(id=>sessionTaskFor(id,-1)?.type===TYPE).sort();
 assert.deepEqual(practice,fixture.practice.map(row=>row.id).sort());
 assert.equal(fixture.cases.length,21);
 assert.equal(fixture.cases.filter(row=>row.kind==='given-approximation').length,6);
 assert.equal(new Set(fixture.cases.map(row=>row.nodeId)).size,9);
 assert.equal(all.filter(row=>row.role==='associated').length,18);
 assert.equal(all.filter(row=>row.role==='prerequisite').length,6);
 assert.equal(fixture.routes.length,22);
 assert.equal(all.length,45);
 assert.equal(fixture.practice.length,6);
 for(const row of [...all,...fixture.practice])assert.equal(taskHash(taskFor(row)),row.taskHash,key(row));
});

for(const row of fixture.cases)test(key(row)+' checks exact current values, original finite group saves and feedback',()=>{
 const task=taskFor(row),ctx=context(row),model=defaultModel(task);
 const source=convertBinding(task,ctx);
 assert.deepEqual({nodeId:source.nodeId,kind:source.kind,method:source.method},{nodeId:row.nodeId,kind:row.kind,method:null});
 assert.ok(thinkingGuide(task,ctx));
 assert.equal(thinkingFeedback(task,model,record(model),ctx),null);
 assert.equal(replayConvertEvidence(task,model),null);
 save(task,model);
 assert.deepEqual(model.board,{first:{},bad:false,saved:null});
 assert.equal(model.issue,'先把下面的数量填完整。');

 const wrong=row.values.map((raw,i)=>i===row.values.length-1?String(Number(raw)*2):raw);
 fill(task,model,'values',wrong);save(task,model);
 assert.deepEqual(model.board,{first:{values:wrong},bad:true,saved:wrong});
 assert.equal(inspect(task,model).correct,false);
 const near=row.values.map((raw,i)=>i===0?nearNumber(raw):raw);
 fill(task,model,'values',near);fill(task,model,'answers',row.answers);save(task,model);
 assert.equal(inspect(task,model).correct,true,'preserve original Number tolerance');
 assert.equal(replayConvertEvidence(task,model),null,'rounded original success has no exact evidence');

 const raw=row.values.map(sameNumber);
 fill(task,model,'values',raw);
 assert.equal(inspect(task,model).correct,false,'a different raw string is still unsaved');
 save(task,model);
 const proof=replayConvertEvidence(task,model);
 assert.ok(proof);
 assert.equal(proof.relationship,row.kind);
 assert.deepEqual(proof.rows.map(r=>r.expected),row.values);
 assert.deepEqual(proof.rows.map(r=>r.raw),raw);
 assert.deepEqual(proof.firstSave,{index:1,values:wrong});
 assert.deepEqual(proof.saved,{index:3,values:raw});
 assert.deepEqual(proof.events.map(e=>e.saved),[false,true,true,true]);
 assert.equal(proof.hadOriginalBad,true);
 assert.deepEqual(proof.currentQuestions.map(q=>q.raw),row.answers);
 assert.ok(proof.currentQuestions.every(q=>q.onlyCurrentField&&!q.editTimeRecorded));
 assert.equal(proof.toolDrawsBars,true);
 assert.equal(proof.relativeBarWidthsArePerRow,true);
 assert.equal(proof.conversionStepsRecorded,false);
 assert.equal(proof.freeExplanationAssessed,false);
 assert.equal(proof.generalMasteryAssessed,false);
 const correct=record(model),feedback=thinkingFeedback(task,model,correct,ctx);
 assert.equal(feedback.method,null);
 assert.equal(feedback.detail.filter(line=>line.includes('按本题给定的近似关系')).length,row.kind==='given-approximation'?row.values.length:0);
 assert.deepEqual(proof.saved.values,raw);
 const old=structuredClone(model.board);
 fill(task,model,'values',raw.map((value,i)=>i===0?'':value));
 save(task,model);
 assert.deepEqual(model.board,old,'one invalid row rejects the whole group');
 fill(task,model,'values',raw);
 const retained=replayConvertEvidence(task,model);
 assert.ok(retained.issue);
 assert.deepEqual(retained.saved,proof.saved);
 assert.equal(retained.events.at(-1).saved,false);
 assert.equal(thinkingFeedback(task,model,correct,ctx),null,'old submission cannot authorize updated model');
 assert.ok(thinkingFeedback(task,model,record(model),ctx));
});

test('numeric follow-ups use exact comparison and option keys resolve to original visible labels',()=>{
 for(const row of fixture.cases){
  const task=taskFor(row),model=exampleModel(task);
  for(const [i,question] of task.questions.entries()){
   if(question.options){
    const proof=replayConvertEvidence(task,model);
    assert.equal(proof.currentQuestions[i].display,question.options.find(([value])=>value===model.answers[i])[1]);
    const changed=structuredClone(model);
    changed.answers[i]=question.options.find(([value])=>value!==question.value)[0];
    assert.equal(replayConvertEvidence(task,changed),null);
   }else{
    const changed=structuredClone(model);
    changed.answers[i]=nearNumber(model.answers[i]);
    assert.equal(inspect(task,changed).correct,true);
    assert.equal(replayConvertEvidence(task,changed),null);
   }
  }
 }
 const miles=taskFor({id:'mileskm',index:2}),model=exampleModel(miles);
 model.answers[1]='2/5';
 assert.ok(replayConvertEvidence(miles,model));
 model.answers[1]='-0 2/5';
 assert.equal(validModel(miles,model),true);
 assert.equal(replayConvertEvidence(miles,model),null);
 const inches=taskFor({id:'imperialconversions',index:0}),inchModel=exampleModel(inches);
 fill(inches,inchModel,'values',['20.32']);save(inches,inchModel);
 assert.equal(replayConvertEvidence(inches,inchModel),null,'actual inch definition is a different relationship from this exercise');
});

test('original grade and permissive legacy models cannot authenticate invisible actions, fields or forged saves',()=>{
 for(const row of fixture.cases){
  const task=taskFor(row),original=exampleModel(task);
  const originallyAccepted=[
   m=>{m.extra=1;},
   m=>{m.history[0].extra=1;},
   m=>{m.history[0].d.index='0';},
   m=>{m.history[0].f.values.extra='0';},
   m=>{m.offset='2.0';},
   m=>{m.estimate='1';},
   m=>{m.error='1';},
   m=>{m.measure='1';},
   m=>{m.unit='g';},
   m=>{m.issue='未发生的提示';},
   m=>actExtra(task,m,'m28-help'),
   m=>actExtra(task,m,'m28-record'),
  ];
  const originallyInvalid=[
   m=>{m.history[0].f.extra='0';},
   m=>{delete m.history[0].f.values[0];},
   m=>{m.board.first.values[0]='9';},
   m=>{m.board.bad=true;},
   m=>{m.history=[];},
  ];
  for(const edit of [...originallyAccepted,...originallyInvalid]){
   const forged=structuredClone(original);edit(forged);
   assert.equal(inspect(task,forged).correct,originallyAccepted.includes(edit),key(row));
   assert.equal(replayConvertEvidence(task,forged),null,key(row));
   assert.equal(thinkingFeedback(task,forged,record(forged),context(row)),null,key(row));
  }
  for(const editTask of [
   t=>{t.prompt+=' 改写';},t=>{t.rows[0].expected+=1;},t=>{t.rows[0].from='伪造单位';},
   t=>{t.rows[0].label='改写';},t=>{t.rows[0].value+=1;},t=>{t.approx=!t.approx;},
   t=>{t.questions.push({label:'额外问题',value:1});}
  ]){
   const forged=structuredClone(task);editTask(forged);
   assert.equal(convertBinding(forged,context(row)),null,key(row));
   assert.equal(replayConvertEvidence(forged,original),null,key(row));
  }
  for(const wrong of [null,[],{}, {sessionId:[row.id],index:row.index},{sessionId:row.id,index:-1},
   {sessionId:row.id,index:String(row.index)},{sessionId:row.id,index:NaN},{sessionId:'__proto__',index:0}]){
   assert.equal(convertBinding(task,wrong),null);
  }
 }
});

test('all 45 original positions use real model controls and State v2, while only native subjects get conversion feedback',()=>{
 const state=Core.fresh();
 for(const route of fixture.routes){
  const id=route[0].id,lesson=State.freshLesson(id);
  for(const row of route){
   assert.equal(lesson.index,row.index);
   const task=taskFor(row),model=State.modelForLesson(lesson);
   assert.equal(inspect(task,exampleModel(task)).correct,true);
   if(row.role==='prerequisite'){
    for(const step of row.steps)doStep(task,model,step);
    assert.equal(replayConvertEvidence(task,model),null);
   }else{
    fill(task,model,'values',row.values);save(task,model);fill(task,model,'answers',row.answers);
    assert.ok(replayConvertEvidence(task,model));
    assert.equal(!!convertBinding(task,context(row)),row.role==='native');
    assert.equal(!!thinkingGuide(task,context(row)),row.role==='native');
    for(const other of all.filter(c=>c.role==='associated')){
     assert.equal(convertBinding(task,context(other)),null);
    }
   }
   assert.equal(State.submitLesson(lesson).correct,true,key(row));
   assert.equal(State.currentSubmission(lesson).status,'correct');
   if(row.role!=='prerequisite'){
    assert.equal(!!thinkingFeedback(task,model,lesson.cases[row.index],context(row)),row.role==='native');
   }
   const checked=lesson.cases[row.index].attempts.at(-1);
   assert.deepEqual(checked.value,model);
   if(row!==route.at(-1))lesson.index++;
  }
  const persisted=State.validateLesson(lesson,id,{allowBridge:true});
  assert.deepEqual(persisted,lesson);
  (Object.hasOwn(BRIDGES,id)?state.daily.bridges:state.lessons)[id]=persisted;
 }
 const parsed=Core.parseBackup(backup(state),atlas);
 assert.deepEqual(parsed,Core.validate(state,atlas));
 const merged=Core.merge(Core.fresh(),parsed);
 assert.deepEqual(merged,parsed);
 assert.deepEqual(Core.merge(merged,parsed),merged);
 const text=JSON.stringify(parsed);
 assert.equal(unpackText(packText(text,1)),text);
});

test('2000 events, 1200 characters, signed mixed numbers and old ungraded practice survive the unchanged v2 boundary',()=>{
 const row=fixture.cases.find(r=>r.id==='metricconversions'&&r.index===1),task=taskFor(row);
 const model=exampleModel(task);
 const raw='0'.repeat(1198)+'10';
 model.values[0]='-0 1/2';save(task,model);
 assert.equal(model.board.bad,true);
 assert.equal(inspect(task,model).correct,false);
 model.values[0]=raw;save(task,model);
 const event=structuredClone(model.history.at(-1));
 model.history.push(...Array.from({length:1997},()=>structuredClone(event)));
 assert.equal(model.history.length,2000);
 const capped=structuredClone(model);actExtra(task,model,'m28-convert');
 assert.deepEqual(model,capped);
 assert.equal(replayConvertEvidence(task,model).historyAtCapacity,true);
 const lesson=State.freshLesson(row.id);lesson.index=row.index;lesson.models[row.index]=model;
 State.submitLesson(lesson);
 assert.deepEqual(State.validateLesson(lesson,row.id),lesson);
 for(const invalid of [
  m=>{m.values[0]='0'+raw;},
  m=>{m.history.push(structuredClone(event));}
 ]){
  const altered=structuredClone(lesson);invalid(altered.models[row.index]);
  assert.throws(()=>State.validateLesson(altered,row.id),/原记录不会被覆盖/);
  assert.equal(replayConvertEvidence(task,altered.models[row.index]),null);
 }
 for(const practice of fixture.practice){
  const source=taskFor(practice),old=exampleModel(source),lesson=State.freshLesson(practice.id);
  lesson.view='play';lesson.models[-1]=old;
  const before=State.validateLesson(lesson,practice.id);
  assert.equal(convertBinding(source,context(practice)),null);
  assert.ok(replayConvertEvidence(source,old));
  State.enterUnifiedTask(before);
  assert.deepEqual(before.models[-1],old);
  assert.deepEqual(before.cases,{});
  assert.equal(State.currentSubmission(before).status,'unsubmitted');
  assert.deepEqual(State.validateLesson(before,practice.id),before);
 }
});
