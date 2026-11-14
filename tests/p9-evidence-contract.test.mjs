import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionMeta,sessionTasks} from '../dist/learning/bridges.js';
import {defaultModel,exampleModel,validModel,inspect} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {sameEvidence,hasExactKeys,matchesNativeEvidenceTask,latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {fractionEvidenceExample} from '../scripts/fraction-evidence-fixture.mjs';
import expansion from './fixtures/p9-mature-expansion-cases.cjs';
import angle from './fixtures/p9-angle-cases.cjs';
import transform from './fixtures/p9-transform-cases.cjs';
import groups from './fixtures/p9-groups-cases.cjs';
import fractionOrder from './fixtures/p9-fraction-order-cases.cjs';

await ensureB39Ready();
const positions=(id,indices)=>indices.map(index=>({sessionId:id,index}));
// Independently reviewed native locations: registry discovery must match this
// contract, rather than allowing a new shared widget to self-authorize feedback.
const reviewed={
 sequence:[...positions('general34',[2,3]),...positions('tables34',[0,2]),...positions('reason34',[1]),
  ...expansion.sequence.map(({id,index})=>({sessionId:id,index}))],
 array:[...positions('structure34',[1]),...positions('tables34',[1]),...positions('derivepatterns',[0,3,4,5,6]),
  ...expansion.array.map(({id,index})=>({sessionId:id,index}))],
 line:[...positions('lineproperties',[0,1,2]),...positions('geometrynotation',[2]),...positions('lineorientation',[0,1,2,3]),...positions('linemark',[1]),...positions('structure34',[3])],
 counterexample:positions('argument38',[3,4]),
 fraction:[...positions('recutnames',[0,1,2]),...positions('samenames',[0,1,2]),...positions('simplestparts',[0,2]),...positions('tenthtohundred',[0,2]),...positions('thousandparts',[1]),...positions('decimalstops',[0,1])],
 unitwalk:[...positions('lineplaces',[0,1,2,3]),...positions('unitcopies',[0,1,2]),...positions('wholefractions',[1,2,3,4]),...positions('translateamount',[3]),...positions('storyfraction',[2]),...positions('tenpieces',[0]),...positions('decimalnames',[1]),...positions('fractionmeasure',[3]),...positions('mixedrename',[0,1])],
 place:[...positions('onesbridge',[0,1]),...positions('tensmove',[3]),...positions('decadetake',[2]),...positions('twodigitpair',[0,1]),...positions('flexhundred',[0,1]),...positions('oneslarge',[3]),...positions('tenslarge',[2,3]),...positions('showwhy',[0,2]),...positions('fourparts',[2]),...positions('buildthousand',[0,1,2]),...positions('columnthree',[1,3]),...positions('flexthousand',[2,4]),...positions('columnfour',[1,3]),...positions('columnlarge',[1,3,4]),...positions('decimalsum',[1,2,3,4]),...positions('decimalmeasure3',[1,2]),...positions('fractionmeasure',[1]),...positions('fractionfour',[13,14])],
 groupwalk:[...positions('manycopies',[0,1,2]),...positions('repeatfraction',[0,1,2])],
 route:[...positions('onesbridge',[2,3]),...positions('twodigitpair',[2]),...positions('addhundred',[0,2]),...positions('flexhundred',[2,3]),...positions('oneslarge',[0,1]),...positions('showwhy',[1]),...positions('flexthousand',[0,1]),...positions('mentalbig',[0,1,2])],
 'fraction-order':fractionOrder.map(({sessionId,index})=>({sessionId,index})),
 groups:groups.map(({sessionId,index})=>({sessionId,index})),
 transform:transform.cases.map(({sessionId,index})=>({sessionId,index})),
 angle:angle.map(({sessionId,index})=>({sessionId,index}))
};
const key=c=>c.sessionId+':'+c.index;
const record=value=>({support:false,attempts:[{value:structuredClone(value)}]});
const example=(adapter,task)=>adapter.id==='fraction'?fractionEvidenceExample(task):exampleModel(task);
const native=Object.keys(LESSONS).flatMap(sessionId=>sessionTasks(sessionId).map((task,index)=>({task,context:{sessionId,index}})));

test('shared evidence gates fail closed on missing or malformed saved submissions',()=>{
 const model={answer:'1/2',history:[],board:{n:1,d:2}},saved=record(model);
 assert.ok(latestSubmissionMatches(model,saved));
 assert.ok(latestSubmissionMatches(JSON.parse(JSON.stringify(model)),JSON.parse(JSON.stringify(saved))),
  'refreshing JSON v2 data keeps the existing current snapshot equality');
 for(const bad of [null,{},[],{attempts:null},{attempts:{}},{attempts:[]},{attempts:[null]},
  {attempts:[{}]},{attempts:[{value:null}]},{attempts:[{value:[]}]},{attempts:new Array(1)}]){
  assert.equal(latestSubmissionMatches(model,bad),false);
 }
 assert.equal(latestSubmissionMatches(null,record(null)),false);
 assert.equal(latestSubmissionMatches([],record([])),false);
 const cycle={};cycle.self=cycle;
 assert.equal(latestSubmissionMatches(cycle,{attempts:[{value:cycle}]}),false);
 assert.equal(sameEvidence(undefined,undefined),false);
 assert.equal(sameEvidence(cycle,cycle),false);
 assert.equal(sameEvidence({a:1,b:2},{b:2,a:1}),false,'do not loosen the existing serialized equality rule');
 assert.ok(hasExactKeys({b:2,a:1},['a','b']));
 assert.equal(hasExactKeys({a:1,extra:true},['a']),false);
 assert.equal(hasExactKeys([],[]),false);
 assert.equal(hasExactKeys(null,[]),false);
});

test('registered families stay distinct and cover exactly the reviewed native locations',()=>{
 assert.deepEqual(EVIDENCE_ADAPTERS.map(a=>a.id),Object.keys(reviewed));
 assert.equal(new Set(EVIDENCE_ADAPTERS.map(a=>a.id)).size,Object.keys(reviewed).length);
 // Two mathematical contracts may share a widget; no native task may receive
 // both. Widget-type uniqueness is not a substitute for this source check.
 assert.equal(new Set(EVIDENCE_ADAPTERS.map(a=>a.type)).size,12);
 for(const {task,context} of native)
  assert.ok(EVIDENCE_ADAPTERS.filter(adapter=>adapter.binding(task,context)).length<=1,key(context)+' binds at most one mathematical family');
 for(const adapter of EVIDENCE_ADAPTERS){
  const actual=native.filter(({task,context})=>adapter.binding(task,context)).map(({context})=>key(context)).sort();
  assert.deepEqual(actual,reviewed[adapter.id].map(key).sort(),adapter.id);
  for(const sessionId of Object.keys(BRIDGES))sessionTasks(sessionId).forEach((task,index)=>{
   assert.equal(adapter.binding(task,{sessionId,index}),null,adapter.id+' must not tag '+sessionId+':'+index);
  });
 }
});

for(const adapter of EVIDENCE_ADAPTERS){
 test(adapter.id+': every reviewed task retains source binding, real replay and the latest checked work',()=>{
  const outside=native.find(({task,context})=>task.type===adapter.type&&!reviewed[adapter.id].some(c=>key(c)===key(context)));
  for(const context of reviewed[adapter.id]){
   const task=sessionTasks(context.sessionId)[context.index],nodeId=sessionMeta(context.sessionId).topicId;
   const model=example(adapter,task),saved=record(model),before=JSON.stringify(saved);
   assert.equal(adapter.binding(task,context)?.nodeId,nodeId,key(context));
   assert.ok(matchesNativeEvidenceTask(task,context,{type:adapter.type,nodeId}));
   assert.ok(validModel(task,model)&&inspect(task,model).correct,'original grading remains necessary');
   assert.ok(adapter.replay(task,model),'real event fixture must pass its independent mathematics replay');
   assert.ok(latestSubmissionMatches(model,saved));
   assert.ok(thinkingFeedback(task,model,saved,context),'eligible current work receives bounded feedback');
   for(const changedContext of [{...context,index:String(context.index)},{...context,index:-1},
    {...context,index:10000},{...context,sessionId:'__proto__'},{...context,sessionId:'__unreviewed__'}]){
    assert.equal(adapter.binding(task,changedContext),null);
   }
   if(outside){
    assert.equal(adapter.binding(task,outside.context),null,'a real course sharing the widget cannot inherit this binding');
    assert.equal(thinkingFeedback(task,model,saved,outside.context),null);
   }
   assert.equal(matchesNativeEvidenceTask(task,context,{type:adapter.type,nodeId:'__different_source__'}),false);
   assert.equal(matchesNativeEvidenceTask(task,context,{type:'__different_widget__',nodeId}),false);
   const alteredTask={...task,prompt:task.prompt+' changed'};
   assert.equal(adapter.binding(alteredTask,context),null,'the complete original question is part of the contract');
   assert.equal(thinkingFeedback(alteredTask,model,saved,context),null);
   const edited=structuredClone(model),field=Object.keys(edited).find(k=>k!=='issue'&&typeof edited[k]==='string');
   assert.ok(field,'fixture exposes a real editable field');edited[field]='__edited__';
   assert.equal(latestSubmissionMatches(edited,saved),false);
   assert.equal(thinkingFeedback(task,edited,saved,context),null,'editing invalidates historical positive feedback');
   const latestWrong={attempts:[{value:structuredClone(model)},{value:defaultModel(task)}]};
   assert.equal(latestSubmissionMatches(model,latestWrong),false);
   assert.equal(thinkingFeedback(task,model,latestWrong,context),null,'an older successful snapshot cannot outrank a newer submission');
   const absent=structuredClone(model);absent.history=[];
   assert.equal(adapter.replay(task,absent),null,'correct-looking final board without actions is insufficient');
   assert.equal(thinkingFeedback(task,absent,record(absent),context),null);
   assert.equal(JSON.stringify(saved),before,'evidence lookup never mutates saved attempts');
  }
 });
}
