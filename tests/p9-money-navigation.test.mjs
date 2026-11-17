import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-money-cases.cjs';
import navigationFixture from './fixtures/p9-money-navigation.cjs';
import browserPlan from './p9-money-adapter-browser.cjs';
import {sessionTasks,sessionTaskFor,BRIDGES} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as Tasks from '../dist/learning/tasks.js';
import * as State from '../dist/learning/state.js';
import * as Engine from '../dist/learning/phase4/engine.js';
import {renderExtra} from '../dist/learning/phase4/view-engine.js';
import {setField} from '../dist/learning/phase4/ui.js';
import {moneyBinding,replayMoneyEvidence as replay} from '../dist/learning/money-evidence.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {learningStage,studyActionFocus,learningActionPlan} from '../dist/learning/workspace-flow.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import * as Core from '../dist/exploration-core.js';
import * as M33 from '../dist/learning/phase5/b33-model.js';
await ensureB39Ready();
const {navigation}=navigationFixture,{orderedMoneyTargets,operationPlan,moneyBoundaryKindsFor,moneyBoundaryFlow,moneyNativeFlow,moneyLegacyFlow}=browserPlan;
const cp=structuredClone,taskFor=c=>sessionTaskFor(c.id,c.index),context=c=>({sessionId:c.id,index:c.index});
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

test('ten literal preceding tasks use original range events, visible controls and fixed source hashes',()=>{
 assert.equal(navigation.length,10);const targets=orderedMoneyTargets(),needed=[];
 assert.equal(targets.length,48);assert.equal(new Set(targets.map(c=>c.id)).size,25);
 for(const id of new Set(targets.map(c=>c.id))){const group=targets.filter(c=>c.id===id),last=Math.max(...group.map(c=>c.index));
  for(let index=0;index<=last;index++)if(!group.some(c=>c.index===index))needed.push(id+':'+index);}
 assert.deepEqual(needed.sort(),navigation.map(c=>c.id+':'+c.index).sort());
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 const before={...counters};
 for(const c of navigation){const task=taskFor(c);assert.deepEqual(task,c.task);assert.equal(hash(task),c.taskHash);assert.equal(moneyBinding(task,context(c)),null);
  const model=Tasks.defaultModel(task);for(const step of c.steps)apply(task,model,step);assert.equal(Tasks.inspect(task,model).correct,true,c.id+':'+c.index);assert.equal(replay(task,model),null);}
 assert.equal(counters.fields-before.fields,29);assert.equal(counters.buttons-before.buttons,27);assert.equal(counters.rangeEvents-before.rangeEvents,22);
});

function harness(records,{constructedCompatibilityFixture=false}={}){
 const checked=[],captures=[],retries=[],names=new Set();let label='';
 const lesson=c=>records[c.id],model=c=>State.modelForLesson(lesson(c));
 const field=(c,key,value)=>apply(taskFor(c),model(c),{field:key,value:String(value)});
 const action=(c,name,index)=>apply(taskFor(c),model(c),{action:name,data:index===undefined?{}:{index}});
 const solve=c=>{for(const step of operationPlan(c,model(c)))step.field?field(c,step.field,step.value):action(c,step.action,step.index);};
 const capture=(c,phase,strict,{role,checkedAttempt=false}={})=>{
  const key=label+'-'+phase;assert.ok(!names.has(key),'one immutable snapshot stem: '+key);names.add(key);
  const a=lesson(c),record=cp(a.cases[c.index]||null),current=cp(model(c)),task=taskFor(c),proof=replay(task,current);
  const feedback=thinkingFeedback(task,current,record,context(c));assert.equal(!!feedback,strict,key);assert.equal(Tasks.validModel(task,current),true);
  if(strict){assert.ok(proof&&moneyBinding(task,context(c)));assert.deepEqual(record.attempts.at(-1).value,current);}
  const value={id:c.id,index:c.index,phase,role,model:current,record,proof,words:feedback?JSON.stringify(feedback):null,correct:Tasks.inspect(task,current).correct,
   strict,checked:checkedAttempt,constructedCompatibilityFixture,stem:key};captures.push(value);return value;
 };
 const check=(c,correct,strict,phase,role)=>{
  const a=lesson(c),t=taskFor(c),before=cp(a.cases[c.index]?.attempts||[]),m=cp(model(c));
  const stage=learningStage(a,State.currentSubmission(a)),focus=studyActionFocus({stage,task:t,model:m}),plan=learningActionPlan({stage,hasNextTask:a.index<sessionTasks(c.id).length-1,readyToCheck:focus.readyToCheck});
  const control=[plan.primary,...plan.secondary].find(x=>x.action==='check');assert.ok(control&&!control.disabled,'original Check available: '+c.id+':'+c.index+' '+phase);
  assert.equal(State.submitLesson(a).correct,correct);assert.equal(State.currentSubmission(a).status,correct?'correct':'revise');
  const record=a.cases[c.index];assert.deepEqual(record.attempts.slice(0,-1),before);assert.deepEqual(record.attempts.at(-1).value,m);
  assert.deepEqual(State.validateLesson(cp(a),c.id,{allowBridge:true}),a);
  const value=capture(c,phase,strict,{role,checkedAttempt:true});value.attempt=cp(record.attempts.at(-1));checked.push(value);return value;
 };
 const retry=(c,kind,role)=>{
  const a=lesson(c),before=cp(a),buttons=retryControls(a);assert.equal(buttons.length,1,'one actual P3 retry');assert.doesNotMatch(buttons[0],/\bdisabled\b/);
  a.models[c.index]=Tasks.defaultModel(taskFor(c));assert.deepEqual(a.cases,before.cases);assert.deepEqual(a.notes,before.notes);assert.equal(a.draft,before.draft);
  for(const[index,value]of Object.entries(before.models))if(Number(index)!==c.index)assert.deepEqual(a.models[index],value);
  assert.equal(thinkingFeedback(taskFor(c),model(c),a.cases[c.index],context(c)),null);retries.push({id:c.id,index:c.index,kind,before,after:cp(a)});
  if(kind!=='native')capture(c,'retry-'+kind,false,{role});
 };
 return{records,checked,captures,retries,field,action,solve,model,capture,check,retry,label:value=>{label=value;}};
}

test('48 targets and ten prerequisites follow one cumulative route including every original ceiling and budget subset',async()=>{
 const start={...counters},records={},h=harness(records);let nextCount=0,prerequisites=0;
 for(const c of orderedMoneyTargets()){
  const a=records[c.id]??=State.freshLesson(c.id);State.modelForLesson(a);h.label(c.role+'-'+c.id+'-'+c.index);
  while(a.index<c.index){
   const previous={id:c.id,index:a.index},task=taskFor(previous);
   if(!a.cases[a.index]?.attempts?.some(x=>Tasks.inspect(task,x.value).correct)){
    const prep=navigation.find(x=>x.id===c.id&&x.index===a.index);assert.ok(prep);for(const step of prep.steps)apply(task,h.model(previous),step);
    h.check(previous,true,false,'navigation-prerequisite-'+a.index,'prerequisite');prerequisites++;
   }
   assert.equal(State.currentSubmission(a).status,'correct');assert.equal(State.lessonSummary(a).cases[a.index].complete,true);
   const stage=learningStage(a,State.currentSubmission(a)),plan=learningActionPlan({stage,hasNextTask:true,readyToCheck:true});assert.ok([plan.primary,...plan.secondary].some(x=>x.action==='next'&&!x.disabled));
   const before=cp(a);a.index++;State.modelForLesson(a);assert.deepEqual(a.cases,before.cases);assert.deepEqual(a.notes,before.notes);assert.equal(a.draft,before.draft);
   for(const[index,value]of Object.entries(before.models))assert.deepEqual(a.models[index],value);nextCount++;
  }
  assert.equal(a.index,c.index);assert.equal(a.cases[c.index]?.attempts?.length??0,0);assert.deepEqual(h.model(c),Tasks.defaultModel(taskFor(c)));assert.equal(hash(taskFor(c)),c.taskHash);
  assert.equal(retryControls(a).length,0,'a new empty position has no retry control');
  if(c.role==='native'){
   State.supportLesson(a);const phases=await moneyNativeFlow(c,{task:taskFor(c),field:(key,value)=>h.field(c,key,value),action:(name,index)=>h.action(c,name,index),solve:()=>h.solve(c),
    check:(correct,strict,phase)=>h.check(c,correct,strict,phase,'native'),capture:(phase,strict)=>h.capture(c,phase,strict,{role:'native'}),retry:kind=>h.retry(c,kind,'native'),
    checkpoint:stage=>{if(['correct-unsubmitted','modified-prose','shared-retry'].includes(stage))assert.equal(thinkingFeedback(taskFor(c),h.model(c),a.cases[c.index],context(c)),null);assert.deepEqual(State.validateLesson(cp(a),c.id),a);},assert:(value,message)=>assert.ok(value,message)});
   assert.equal(phases.filter(x=>x.checked).length,c.type==='x-m33-coins'?6:7);assert.equal(phases.length,c.type==='x-m33-coins'?8:9);
   assert.equal(a.cases[c.index].attempts.length,c.type==='x-m33-coins'?6:7);assert.equal(phases[0].correct,false);assert.deepEqual(a.cases[c.index].attempts[0],phases[0].attempt);
   for(const kind of moneyBoundaryKindsFor(c)){
    h.label('boundary-'+c.id+'-'+c.index+'-'+kind);h.retry(c,'boundary-'+kind,'boundary');
    await moneyBoundaryFlow(kind,c,{task:taskFor(c),field:(key,value)=>h.field(c,key,value),action:(name,index)=>h.action(c,name,index),solve:()=>h.solve(c),
     check:(correct,strict,phase)=>h.check(c,correct,strict,phase,'boundary'),capture:(phase,strict)=>h.capture(c,phase,strict,{role:'boundary'}),retry:name=>h.retry(c,name,'boundary'),model:()=>cp(h.model(c)),
     assert:(value,message)=>assert.ok(value,message),noRemovalControl:()=>assert.doesNotMatch(renderExtra(taskFor(c),h.model(c)),/data-x="m33-remove"/)});
    assert.equal(State.currentSubmission(a).status,'correct');assert.ok(replay(taskFor(c),h.model(c)));
   }
  }else{h.solve(c);const row=h.check(c,true,false,'associated-checked','associated');assert.ok(row.proof);assert.equal(moneyBinding(taskFor(c),context(c)),null);}
 }
 assert.equal(prerequisites,10);assert.equal(nextCount,33);assert.equal(Object.keys(records).length,25);assert.equal(h.checked.length,255);assert.equal(h.captures.length,321);assert.equal(h.retries.length,36);
 assert.deepEqual(Object.fromEntries(['native','associated','boundary','prerequisite'].map(role=>[role,h.checked.filter(x=>x.role===role).length])),{native:181,associated:20,boundary:44,prerequisite:10});
 const positions=[...new Set(h.checked.map(x=>x.id+':'+x.index))];assert.equal(positions.length,58);
 for(const key of positions){const rows=h.checked.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),a=records[last.id];assert.deepEqual(a.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(a.models[last.index],last.model);}
 for(const snapshot of h.captures){const a=records[snapshot.id],prior=snapshot.record?.attempts||[];assert.deepEqual(a.cases[snapshot.index].attempts.slice(0,prior.length),prior);}
 for(const c of fixture.cases)assert.ok(replay(taskFor(c),records[c.id].models[c.index]));
 for(const r of h.retries){const prior=r.before.cases[r.index]?.attempts||[];assert.deepEqual(records[r.id].cases[r.index].attempts.slice(0,prior.length),prior);assert.deepEqual(r.before.cases,r.after.cases);}
 const all=Core.fresh();for(const[id,a]of Object.entries(records))(Object.hasOwn(BRIDGES,id)?all.daily.bridges:all.lessons)[id]=a;
 assert.deepEqual(Core.validate(all,atlas),all);assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(all)),atlas),all);
 const controls=Object.fromEntries(Object.entries(counters).map(([key,value])=>[key,value-start[key]]));
 console.log('MONEY_ORIGINAL_CONTINUOUS_NAVIGATION',JSON.stringify({targets:48,sessions:25,prerequisites,positions:58,next:nextCount,checked:h.checked.length,captures:h.captures.length,retries:h.retries.length,...controls,actualChromium:false}));
});

test('separately constructed practice and reveal compatibility keep old provenance through the exact new visible retry flow',async()=>{
 const c=fixture.cases.find(x=>x.id==='pennyshop'&&x.index===0),task=taskFor(c),all=Core.fresh(),legacy=State.freshLesson(c.id),m=M33.initial(task);
 m.board.revealed=false;apply(task,m,{action:'m33-reveal',data:{}});
 const fixtureWork=(spec,current=Tasks.defaultModel(taskFor(spec)))=>{for(const step of operationPlan(spec,current))apply(taskFor(spec),current,step.field?step:{action:step.action,data:step.index===undefined?{}:{index:step.index}});return current;};
 fixtureWork(c,m);legacy.models[0]=m;assert.equal(State.submitLesson(legacy).correct,true);all.lessons[c.id]=legacy;
 for(const spec of fixture.practice){const a=all.lessons[spec.id]??=State.freshLesson(spec.id);a.models[-1]=fixtureWork(spec);}
 const payload=JSON.stringify(Core.backup(all)),restored=Core.parseBackup(payload,atlas);assert.deepEqual(restored,all);assert.throws(()=>Core.parseBackup('{',atlas));
 for(const spec of fixture.practice){assert.deepEqual(restored.lessons[spec.id].models[-1],all.lessons[spec.id].models[-1]);assert.equal(moneyBinding(taskFor(spec),context(spec)),null);}
 const h=harness(restored.lessons,{constructedCompatibilityFixture:true});h.label('constructed-legacy-reveal');
 const phases=await moneyLegacyFlow(c,{action:(name,index)=>h.action(c,name,index),solve:()=>h.solve(c),
  check:(correct,strict,phase)=>h.check(c,correct,strict,phase,'legacy-compatibility'),retry:kind=>h.retry(c,kind,'legacy-compatibility')});
 assert.equal(h.checked.length,3);assert.equal(h.captures.length,4);assert.equal(h.retries.length,1);assert.deepEqual(phases.map(x=>x.strict),[false,false,true]);
 const record=restored.lessons[c.id].cases[0];assert.equal(record.attempts.length,4);assert.deepEqual(record.attempts[0],legacy.cases[0].attempts[0]);assert.deepEqual(record.attempts.slice(1),h.checked.map(x=>x.attempt));
 for(const snapshot of h.captures){const prior=snapshot.record?.attempts||[];assert.deepEqual(record.attempts.slice(0,prior.length),prior);}
 assert.ok(replay(task,restored.lessons[c.id].models[0]));assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(restored)),atlas),restored);
 console.log('MONEY_CONSTRUCTED_COMPATIBILITY_FLOW',JSON.stringify({practice:10,constructedInitialSubmissions:1,realHandlerChecks:3,captures:4,retries:1,constructedCompatibilityFixture:true,actualChromium:false}));
});
