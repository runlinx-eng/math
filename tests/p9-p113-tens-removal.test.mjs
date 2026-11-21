import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b11-model.js';
import {
  P113_SOURCES, p113TensRemovalBinding,
  replayP113TensRemovalEvidence, submittedP113TensRemovalEvidence
} from '../dist/learning/p113-tens-removal-evidence.js';

const results=[40,30,432,72];
const rows=P113_SOURCES.map((source,i)=>{
  const {sessionId,index}=source;
  const context={sessionId,index};
  return {source,context,task:sessionTaskFor(sessionId,index),end:results[i]};
});
function ordered(value) {
  if(Array.isArray(value))return value.map(ordered);
  if(value&&typeof value==='object')
    return Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(value[k])]));
  return value;
}
function start({task,end}, wrongAlignment=false) {
  const model=original.initial(task);
  if(wrongAlignment){
    model.guess='0';
    model.align=['1','0'];
    original.act(task,model,'b11-place-start');
    assert.equal(model.started,false);
  }
  model.guess='1';
  model.align=['0','0'];
  original.act(task,model,'b11-place-start');
  assert.equal(model.started,true);
  model.answer=String(end);
  return model;
}
const removeTens=(row,model)=>original.act(row.task,model,'b11-remove',{index:1});
function work(row,wrongAlignment=false){
  const model=start(row,wrongAlignment);
  removeTens(row,model);
  return model;
}
const replay=(row,model)=>replayP113TensRemovalEvidence(row.task,model,row.context);
const attempt=value=>({value:structuredClone(value)});

test('P113 locks four complete original source shapes and hashes',()=>{
  assert.equal(rows.length,4);
  for(const {source,task,context} of rows){
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(LESSONS[context.sessionId].topicId,source.nodeId);
    assert.equal(p113TensRemovalBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p113TensRemovalBinding({...task,scale:10},context),null);
    assert.equal(p113TensRemovalBinding({...task,prompt:'unreviewed'},context),null);
    assert.equal(p113TensRemovalBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P113 independently preserves non-tens columns and sums the four exact results',()=>{
  for(const row of rows){
    const model=work(row,true);
    assert.equal(original.inspect(row.task,model).correct,true);
    const before=structuredClone(model);
    const proof=replay(row,model);
    assert.equal(proof.startTotal,row.task.values[0]);
    assert.equal(proof.removedTotal,row.task.values[1]);
    assert.equal(proof.endTotal,row.end);
    assert.equal(proof.removal.unitsRemoved,row.task.values[1]/10);
    for(const column of [0,2])assert.equal(proof.removal.before[column],proof.removal.after[column]);
    assert.deepEqual(proof.alignmentAttempts.map(x=>[x.accepted,x.guess]),[[false,'0'],[true,'1']]);
    assert.equal(proof.exchangeCount,0);
    assert.equal(proof.individualBundleClicksAssessed,false);
    assert.equal(proof.initialGuessCorrectnessAssessed,false);
    assert.deepEqual(model,before);
  }
});

test('P113 requires both the real removal and a matching latest Check',()=>{
  for(const row of rows){
    const wrong=start(row);
    assert.equal(original.inspect(row.task,wrong).correct,false);
    assert.equal(replay(row,wrong),null);
    const done=structuredClone(wrong);
    removeTens(row,done);
    const submit=(records)=>submittedP113TensRemovalEvidence(row.task,done,{attempts:records},row.context);
    assert.equal(submit([attempt(wrong)]),null);
    assert.equal(submit([attempt(wrong),attempt(done)])?.endTotal,row.end);
    assert.equal(submit([attempt(done),attempt(wrong)]),null);
    assert.equal(submit([null,attempt(done)]),null);
  }
});

test('P113 declines an exchange cycle or removal no-op even when original grade accepts the result',()=>{
  const row=rows[0], changed=start(row);
  original.act(row.task,changed,'b11-exchange',{index:1,dir:'down'});
  original.act(row.task,changed,'b11-exchange',{index:0,dir:'up'});
  removeTens(row,changed);
  assert.equal(original.inspect(row.task,changed).correct,true);
  assert.equal(replay(row,changed),null);
  const repeated=work(row);
  removeTens(row,repeated);
  assert.equal(original.inspect(row.task,repeated).correct,true);
  assert.equal(replay(row,repeated),null);
});

test('P113 rejects forged starts, removal snapshots and model fields',()=>{
  const row=rows[2];
  const changes=[
    m=>{m.history=[];},
    m=>{m.history.reverse();},
    m=>{m.history[0].align[0]='00';},
    m=>{m.history[0].align[1]=0;},
    m=>{m.history[1].before[0]=0;},
    m=>{m.history[1].index=2;},
    m=>{m.history[1].needed=0;},
    m=>{m.guess='72';},
    m=>{m.first='72';},
    m=>{m.history[0].unexpected=true;},
    m=>{m.answer='431.999999';}
  ];
  for(const change of changes){
    const model=work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
  assert.equal(replay(row,null),null);
});

test('P113 excludes other native math, actual practice and all related contexts',async()=>{
  await ensureB39Ready();
  for(const {task,context} of rows){
    assert.equal(p113TensRemovalBinding(task,{...context,index:-1}),null);
    assert.equal(p113TensRemovalBinding(task,{sessionId:'tensmove',index:1}),null);
    assert.equal(p113TensRemovalBinding(sessionTaskFor('tensmove',1),context),null);
    for(const [sessionId,bridge] of Object.entries(BRIDGES)){
      for(const [index,related] of bridge.tasks.entries()){
        if(related?.type===task.type)assert.equal(p113TensRemovalBinding(related,{sessionId,index}),null);
      }
      assert.equal(p113TensRemovalBinding(task,{sessionId,index:0}),null);
    }
  }
});
