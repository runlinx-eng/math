import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-order-cases.cjs';
import navigationFixture from './fixtures/p9-order-navigation.cjs';
import browserPlan from './p9-order-adapter-browser.cjs';
import {sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {renderExtra} from '../dist/learning/phase4/view-engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {orderBinding,replayOrderEvidence as replay} from '../dist/learning/order-evidence.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {learningStage,studyActionFocus,learningActionPlan} from '../dist/learning/workspace-flow.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
await ensureB39Ready();
const {navigation}=navigationFixture,{orderedOrderTargets,operationPlan,boundaryNamesFor,boundaryFlow,nativeFlow}=browserPlan;
const cp=structuredClone,taskFor=c=>sessionTasks(c.id)[c.index],context=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const counters={fields:0,buttons:0,rangeEvents:0};
const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
const retryControls=record=>{const host={innerHTML:''};renderP3Flow(host,{atlas,id:record.id,record});return[...host.innerHTML.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]).filter(tag=>attrs(tag)['data-do']==='p3-retry');};
function apply(task,model,step){
 const html=renderExtra(task,model);
 if(step.field){
  const matches=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(m=>m[0]).filter(tag=>attrs(tag)['data-xfield']===step.field);
  assert.equal(matches.length,1,'one original field '+step.field);const tag=matches[0],a=attrs(tag);assert.doesNotMatch(tag,/\bdisabled\b|\breadonly\b/);
  if(tag.startsWith('<select')){
   const start=html.indexOf(tag),body=html.slice(start,html.indexOf('</select>',start));
   assert.ok([...body.matchAll(/<option\b[^>]*>/g)].some(m=>attrs(m[0]).value===String(step.value)),'original select option');
  }
  const update=value=>{const numeric=['number','range'].includes(a.type)||step.field.startsWith('pair.');setField(model,step.field,numeric?(String(value)===''?null:Number(value)):String(value));Engine.fieldExtra(task,model,step.field);};
  if(a.type==='range'){
   const min=Number(a.min),max=Number(a.max),stride=Number(a.step||1),end=Number(step.value);assert.ok(end>=min&&end<=max&&Number.isInteger((end-min)/stride));
   const prior=Number(step.field.split('.').reduce((v,k)=>v[k],model));if(prior!==min){update(min);counters.rangeEvents++;}
   for(let v=min+stride;v<=end;v+=stride){update(v);counters.rangeEvents++;}
  }else{if(a.maxlength)assert.ok(String(step.value).length<=Number(a.maxlength));update(step.value);}
  counters.fields++;
 }else{
  const matches=[...html.matchAll(/<(?:button|g|path|rect|circle)\b[^>]*>/g)].map(m=>m[0]).filter(tag=>attrs(tag)['data-x']===step.action&&Object.entries(step.data||{}).every(([key,value])=>attrs(tag)['data-'+key]===String(value)));
  assert.equal(matches.length,1,'one original action '+step.action);assert.doesNotMatch(matches[0],/\bdisabled\b/);Engine.actExtra(task,model,step.action,step.data||{});counters.buttons++;
 }
 assert.equal(Tasks.validModel(task,model),true,'original valid complete model');
}

test('seven literal preceding positions match fixed source tasks and genuine original controls',()=>{
 assert.equal(navigation.length,7);const targets=orderedOrderTargets(),needed=[];
 assert.equal(targets.length,31);assert.equal(new Set(targets.map(c=>c.id)).size,15);
 for(const id of new Set(targets.map(c=>c.id))){const group=targets.filter(c=>c.id===id),last=Math.max(...group.map(c=>c.index));
  for(let index=0;index<=last;index++)if(!group.some(c=>c.index===index))needed.push(id+':'+index);}
 assert.deepEqual(needed.sort(),navigation.map(c=>c.id+':'+c.index).sort());
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 const before={...counters};
 for(const c of navigation){const task=taskFor(c);assert.deepEqual(task,c.task);assert.equal(hash(task),c.taskHash);assert.equal(orderBinding(task,context(c)),null);
  const model=Tasks.defaultModel(task);for(const step of c.steps)apply(task,model,step);assert.equal(Tasks.inspect(task,model).correct,true);assert.equal(replay(task,model),null);}
 assert.equal(counters.fields-before.fields,58);assert.equal(counters.buttons-before.buttons,64);assert.equal(counters.rangeEvents,0);
});

test('complete forward original route preserves all 143 checks, 26 visible retries and the first long failure before native work',async()=>{
 const beforeCounters={...counters},records={},ledger=[],retryRecords=[];let nextCount=0,prerequisites=0;
 const lesson=c=>records[c.id],model=c=>State.modelForLesson(lesson(c)),action=(c,name,data)=>apply(taskFor(c),model(c),{action:'b15-'+name,data});
 const field=(c,key,value)=>apply(taskFor(c),model(c),{field:key,value:String(value)});
 const build=(c,raw)=>{field(c,'expression',raw);action(c,'build');};
 const reduce=(c,id,value)=>{action(c,'op',{index:id});field(c,'result',value);action(c,'reduce');};
 const run=(c,options)=>{for(const step of operationPlan(taskFor(c),options))apply(taskFor(c),model(c),step);};
 const check=(c,correct,strict,phase,role)=>{
  const a=lesson(c),t=taskFor(c),before=cp(a.cases[c.index]?.attempts||[]),submitted=cp(model(c));
  const stage=learningStage(a,State.currentSubmission(a)),focus=studyActionFocus({stage,task:t,model:submitted}),plan=learningActionPlan({stage,readyToCheck:focus.readyToCheck});
  const control=[plan.primary,...plan.secondary].find(x=>x.action==='check');assert.ok(control&&!control.disabled,'original Check available: '+c.id+':'+c.index+' '+phase);
  assert.equal(State.submitLesson(a).correct,correct);assert.equal(State.currentSubmission(a).status,correct?'correct':'revise');
  const record=cp(a.cases[c.index]),attempt=record.attempts.at(-1),proof=replay(t,submitted);assert.deepEqual(record.attempts.slice(0,-1),before);assert.deepEqual(attempt.value,submitted);
  assert.equal(!!thinkingFeedback(t,model(c),record,context(c)),strict);assert.deepEqual(State.validateLesson(cp(a),c.id,{allowBridge:true}),a);
  const row={id:c.id,index:c.index,phase,role,correct,strict,model:submitted,record,attempt,proof};ledger.push(row);return row;
 };
 const retry=(c,kind)=>{
  const a=lesson(c),before=cp(a),fresh=Tasks.defaultModel(taskFor(c)),controls=retryControls(a);
  assert.equal(controls.length,1,'one actual P3 retry control');assert.doesNotMatch(controls[0],/\bdisabled\b/);a.models[c.index]=fresh;
  assert.deepEqual(a.cases,before.cases);assert.deepEqual(a.notes,before.notes);assert.equal(a.draft,before.draft);
  for(const[i,value]of Object.entries(before.models))if(Number(i)!==c.index)assert.deepEqual(a.models[i],value);
  assert.equal(thinkingFeedback(taskFor(c),fresh,a.cases[c.index],context(c)),null);retryRecords.push({id:c.id,index:c.index,kind,before,after:cp(a)});
 };
 const boundary=async(c,variant)=>{
  const prior=cp(lesson(c).cases[c.index]?.attempts||[]);
  if(variant==='long-invalid-first'){assert.equal(prior.length,0);assert.deepEqual(model(c),Tasks.defaultModel(taskFor(c)));assert.equal(retryControls(lesson(c)).length,0);}
  else retry(c,'boundary-'+variant);
  const phases=[];
  await boundaryFlow(variant,{task:taskFor(c),field:(key,value)=>field(c,key,value),build:raw=>build(c,raw),reduce:(id,value)=>reduce(c,id,value),action:(name,data)=>action(c,name,data),run:options=>run(c,options),
   check:(correct,strict,phase)=>{phases.push(check(c,correct,strict,phase,'boundary'));},
   staleReload:()=>{assert.equal(State.currentSubmission(lesson(c)).status,'modified');assert.equal(thinkingFeedback(taskFor(c),model(c),lesson(c).cases[c.index],context(c)),null);assert.deepEqual(State.validateLesson(cp(lesson(c)),c.id),lesson(c));},
   model:()=>cp(model(c)),assert:(value,message)=>assert.ok(value,message),shot:()=>{}});
  assert.deepEqual(lesson(c).cases[c.index].attempts.slice(0,prior.length),prior);assert.ok(replay(taskFor(c),model(c)));
  if(variant==='long-invalid-first'){assert.equal(phases[0].record.attempts.length,1);assert.equal(phases[0].correct,false);assert.equal(phases[0].attempt.value.board.first,'9'.repeat(2000));assert.equal(model(c).board.first,'9'.repeat(2000));}
  if(variant==='terminal-failed-build'){assert.notEqual(model(c).issue,'');assert.equal(phases.at(-1).proof.failedRequests.length,1);}
 };
 for(const c of orderedOrderTargets()){
  const a=records[c.id]??=State.freshLesson(c.id);State.modelForLesson(a);
  while(a.index<c.index){
   const previous={id:c.id,index:a.index},t=taskFor(previous);
   if(!a.cases[a.index]?.attempts?.some(x=>Tasks.inspect(t,x.value).correct)){
    const prep=navigation.find(x=>x.id===c.id&&x.index===a.index);assert.ok(prep);for(const step of prep.steps)apply(t,model(previous),step);
    check(previous,true,false,'navigation-prerequisite-'+a.index,'prerequisite');prerequisites++;
   }
   assert.equal(State.currentSubmission(a).status,'correct');assert.equal(State.lessonSummary(a).cases[a.index].complete,true);
   const stage=learningStage(a,State.currentSubmission(a)),plan=learningActionPlan({stage,readyToCheck:true});assert.ok([plan.primary,...plan.secondary].some(x=>x.action==='next'&&!x.disabled));
   const before=cp(a);a.index++;State.modelForLesson(a);assert.deepEqual(a.cases,before.cases);assert.deepEqual(a.notes,before.notes);assert.equal(a.draft,before.draft);
   for(const[i,value]of Object.entries(before.models))assert.deepEqual(a.models[i],value);nextCount++;
  }
  assert.equal(a.index,c.index);assert.deepEqual(model(c),Tasks.defaultModel(taskFor(c)));assert.equal(a.cases[c.index]?.attempts?.length??0,0);assert.equal(hash(taskFor(c)),c.taskHash);
  if(c.role==='native'){
   State.supportLesson(a);const variants=boundaryNamesFor(c);
   if(variants.includes('long-invalid-first')){await boundary(c,'long-invalid-first');action(c,'reset');assert.equal(model(c).board.first,'9'.repeat(2000));}
   const before=cp(a.cases[c.index].attempts);
   const phases=await nativeFlow(c,{task:taskFor(c),field:(key,value)=>field(c,key,value),action:(name,data)=>action(c,name,data),build:raw=>build(c,raw),reduce:(id,value)=>reduce(c,id,value),run:()=>run(c),
    check:(correct,strict,phase)=>check(c,correct,strict,phase,'native'),sharedRetry:()=>retry(c,'native'),
    checkpoint:(stage,items)=>{
     if(stage==='modified-equivalent-answer'||stage==='reset-unsubmitted'){assert.equal(State.currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(taskFor(c),model(c),a.cases[c.index],context(c)),null);}
     if(stage==='reset-unsubmitted'){assert.equal(model(c).answer,c.answer+' ');assert.equal(model(c).result,items[2].model.result);}
     assert.deepEqual(State.validateLesson(cp(a),c.id),a);
    }});
   assert.equal(phases.length,6);assert.deepEqual(phases.map(x=>x.correct),[false,false,true,true,true,true]);assert.deepEqual(a.cases[c.index].attempts,[...before,...phases.map(x=>x.attempt)]);
   for(const variant of variants.filter(v=>v!=='long-invalid-first'))await boundary(c,variant);
  }else{run(c);check(c,true,false,'isolated-checked',c.role);}
 }
 assert.equal(prerequisites,7);assert.equal(nextCount,23);assert.equal(Object.keys(records).length,15);assert.equal(ledger.length,143);
 const counts=Object.fromEntries(['native','boundary','associated','excluded','prerequisite'].map(role=>[role,ledger.filter(x=>x.role===role).length]));
 assert.deepEqual(counts,{native:102,boundary:20,associated:11,excluded:3,prerequisite:7});assert.equal(retryRecords.filter(x=>x.kind==='native').length,17);assert.equal(retryRecords.length,26);
 const positions=[...new Set(ledger.map(x=>x.id+':'+x.index))];assert.equal(positions.length,38);
 for(const key of positions){const rows=ledger.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),a=records[last.id];assert.deepEqual(a.cases[last.index],last.record);assert.deepEqual(a.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(a.models[last.index],last.model);}
 for(const c of fixture.cases)assert.ok(replay(taskFor(c),records[c.id].models[c.index]));
 assert.equal(records.storyfraction.cases[0].attempts[0].value.board.first,'9'.repeat(2000));assert.equal(records.storyfraction.cases[0].attempts[0].exposed,false);
 for(const r of retryRecords){const attempts=records[r.id].cases[r.index].attempts,prior=r.before.cases[r.index]?.attempts||[];assert.deepEqual(attempts.slice(0,prior.length),prior);assert.deepEqual(r.before.cases,r.after.cases);}
 const controls=Object.fromEntries(Object.entries(counters).map(([key,value])=>[key,value-beforeCounters[key]]));
 console.log('ORDER_ORIGINAL_CONTINUOUS_NAVIGATION',JSON.stringify({targetPositions:31,prerequisites,positions:positions.length,next:nextCount,checked:ledger.length,retries:retryRecords.length,counts,...controls,actualChromium:false}));
});
