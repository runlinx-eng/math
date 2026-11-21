import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b27-model.js';
import {
  P114_SOURCES,
  p114SolidStackBinding,
  replayP114SolidStackEvidence,
  submittedP114SolidStackEvidence
} from '../dist/learning/p114-solidstack-evidence.js';

const expected = [['cuboid','cube','cube'],['cylinder','cone']];
const cases = P114_SOURCES.map(source => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index)};
});
function ordered(value) {
  if(Array.isArray(value))return value.map(ordered);
  if(value&&typeof value==='object')
    return Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(value[k])]));
  return value;
}
const add = (task,model,part) => original.act(task,model,'g27-add',{index:part});
const remove = (task,model) => original.act(task,model,'g27-remove');
const turn = (task,model) => original.act(task,model,'g27-turn');
function work({task,context}, parts=expected[context.index], useTurn=true) {
  const model=original.initial(task,1);
  if(useTurn)turn(task,model);
  for(const part of parts)add(task,model,part);
  return model;
}
const replay = (row,model) => replayP114SolidStackEvidence(row.task,model,row.context);
const attempt=value=>({value:structuredClone(value)});

test('P114 binds only the two full original source fingerprints',()=>{
  for(const {source,task,context} of cases){
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(LESSONS[context.sessionId].topicId,source.nodeId);
    assert.equal(p114SolidStackBinding(task,context)?.nodeId,source.nodeId);
    for(const change of [{rotate:false},{target:[...task.target].reverse()},{prompt:'altered'}])
      assert.equal(p114SolidStackBinding({...task,...change},context),null);
    assert.equal(p114SolidStackBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P114 replays bottom-to-top placement, repeated identical shapes and actual turn events',()=>{
  for(const row of cases){
    const model=work(row);
    const before=structuredClone(model);
    const proof=replay(row,model);
    assert.deepEqual(proof.stackBottomToTop, expected[row.context.index]);
    assert.equal(proof.observableActions[0].action,'turn');
    assert.equal(proof.turnRecorded,true);
    assert.equal(proof.rotationAngleAssessed,false);
    assert.equal(proof.physicalStabilityAssessed,false);
    assert.equal(proof.freeExplanationAssessed,false);
    assert.deepEqual(model,before);
    assert.equal(replay(row,work(row,[...expected[row.context.index]].reverse())),null);
    assert.equal(replay(row,work(row,expected[row.context.index],false)),null);
  }
});

test('P114 keeps wrong original work, removes only the top and rejects an unsubmitted edit',()=>{
  for(const row of cases){
    const parts=expected[row.context.index];
    const wrongPart=row.task.options.find(p=>p!==parts.at(-1));
    const wrong=work(row,[...parts.slice(0,-1),wrongPart]);
    assert.equal(original.inspect(row.task,wrong).correct,false);
    const fixed=structuredClone(wrong);
    remove(row.task,fixed);
    add(row.task,fixed,parts.at(-1));
    assert.equal(original.inspect(row.task,fixed).correct,true);
    assert.equal(fixed.board.bad,true);
    const proof=replay(row,fixed);
    assert.deepEqual(proof.stackBottomToTop,parts);
    assert.equal(proof.observableActions.at(-2).removed,wrongPart);
    assert.equal(proof.observableActions.at(-1).part,parts.at(-1));
    const submit=(record)=>submittedP114SolidStackEvidence(row.task,fixed,record,row.context);
    assert.equal(submit({attempts:[attempt(wrong)]}),null);
    assert.deepEqual(submit({attempts:[attempt(wrong),attempt(fixed)]}),proof);
    assert.equal(submit({attempts:[attempt(fixed),attempt(wrong)]}),null);
    assert.equal(submit({attempts:[null,attempt(fixed)]}),null);
  }
});

test('P114 records a refused extra piece and reconstructs the actual repaired stack',()=>{
  const row=cases[1], model=work(row);
  add(row.task,model,'cube');
  assert.match(model.issue,/放满/);
  assert.equal(replay(row,model),null);
  remove(row.task,model);
  add(row.task,model,'cone');
  const proof=replay(row,model);
  assert.deepEqual(proof.stackBottomToTop,['cylinder','cone']);
  assert.deepEqual(proof.observableActions[3],{eventIndex:3,action:'add',part:'cube',accepted:false,height:2});
});

test('P114 rejects malformed, incomplete, oversized and unsupported actions',()=>{
  const row=cases[0];
  const changes=[
    model=>{model.history=[];},
    model=>{model.history=new Array(4);},
    model=>{model.history[0].d.index='0';},
    model=>{model.history[0].forged=true;},
    model=>{model.history[1].d.index='sphere';},
    model=>{model.history=Array.from({length:1001},()=>model.history[0]);},
    model=>{model.board.parts.reverse();},
    model=>{model.board.turned=false;},
    model=>{model.position='3';},
    model=>{model.seed=0;},
    model=>{original.act(row.task,model,'g27-help');}
  ];
  for(const change of changes){
    const model=work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P114 excludes given models, practice, copied and related contexts',async()=>{
  await ensureB39Ready();
  for(const {task,context} of cases){
    assert.equal(p114SolidStackBinding(sessionTaskFor('solidstack',2),{sessionId:'solidstack',index:2}),null);
    assert.equal(p114SolidStackBinding(task,{...context,index:-1}),null);
    assert.equal(p114SolidStackBinding(sessionTaskFor('solidstack',-1),{...context,index:-1}),null);
    for(const [sessionId, bridge] of Object.entries(BRIDGES)){
      for(const [index, related] of bridge.tasks.entries()){
        if(related?.type===task.type)assert.equal(p114SolidStackBinding(related,{sessionId,index}),null);
      }
      assert.equal(p114SolidStackBinding(task,{sessionId,index:0}),null);
    }
  }
});
