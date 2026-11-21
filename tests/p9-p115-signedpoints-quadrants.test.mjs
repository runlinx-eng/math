import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b24-model.js';
import {
  P115_SOURCES,
  p115QuadrantBinding,
  replayP115QuadrantEvidence,
  submittedP115QuadrantEvidence
} from '../dist/learning/p115-signedpoints-quadrants-evidence.js';

const answers = ['II', 'IV', 'axis'];
const classifications = [['II'], ['IV'], ['I', 'II', 'III', 'IV', 'axis']];
const rows = P115_SOURCES.map(source => {
  const {sessionId,index} = source;
  const context = {sessionId,index};
  return {source,context,task:sessionTaskFor(sessionId,index)};
});

function ordered(value) {
  if(Array.isArray(value)) return value.map(ordered);
  if(value && typeof value==='object')
    return Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])]));
  return value;
}

function plot(task,model,[x,y]) {
  model.x=String(x);
  model.y=String(y);
  original.act(task,model,'p24-plot');
}

function tap(task,model,[x,y]) {
  const [xmin,xmax,ymin]=task.domain;
  const index=x-xmin+(y-ymin)*(xmax-xmin+1);
  original.act(task,model,'p24-dot',{index:String(index)});
}

function work(row, incorrect = false) {
  const {task,context} = row;
  const model = original.initial(task,1);
  for(const [ix,p] of task.target.entries()) {
    const [x,y] = p;
    plot(task,model,incorrect && ix === task.target.length-1 ? [x+1,y] : p);
  }
  model.answers=[answers[context.index]];
  return model;
}

const checked = (row,model) => replayP115QuadrantEvidence(row.task,model,row.context);
const attempt = value => ({value:structuredClone(value)});

test('P115 freezes three exact original fingerprints and isolates their source', () => {
  for(const {task,context,source} of rows){
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(LESSONS[context.sessionId].topicId,source.nodeId);
    assert.equal(p115QuadrantBinding(task,context)?.nodeId,source.nodeId);
    for(const patch of [{prompt:'another source'},{close:true},{domain:[-8,8,-8,8]},{given:[[0,0]]}]){
      assert.equal(p115QuadrantBinding({...task,...patch},context),null);
    }
    assert.equal(p115QuadrantBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P115 independently classifies all four quadrants and the vertical axis from real actions', () => {
  for(const row of rows){
    const model=work(row);
    const snapshot=structuredClone(model);
    const proof=checked(row,model);
    assert.equal(original.inspect(row.task,model).correct,true);
    assert.deepEqual(proof.classifiedPoints.map(p=>p.kind),classifications[row.context.index]);
    assert.equal(proof.checkedClassification,answers[row.context.index]);
    assert.deepEqual(proof.checkedPoint,row.task.target.at(-1));
    assert.equal(proof.coordinateInputOrderAssessed,false);
    assert.equal(proof.learnerMasteryAssessed,false);
    assert.deepEqual(model,snapshot);
  }
});

test('P115 replays a wrong point, real Undo and SVG coordinate selection before the latest Check', () => {
  for(const row of rows){
    const last=row.task.target.at(-1);
    const wrong=work(row,true);
    assert.equal(original.inspect(row.task,wrong).correct,false);
    assert.equal(checked(row,wrong),null);
    const corrected=structuredClone(wrong);
    original.act(row.task,corrected,'p24-undo');
    tap(row.task,corrected,last);
    assert.equal(original.inspect(row.task,corrected).correct,true);
    const proof=checked(row,corrected);
    assert.deepEqual(proof.observableActions.at(-2).removed,[last[0]+1,last[1]]);
    assert.deepEqual(proof.observableActions.at(-1).point,last);
    assert.equal(proof.observableActions.at(-1).action,'dot');
    const saved=(record)=>submittedP115QuadrantEvidence(row.task,corrected,record,row.context);
    assert.equal(saved({attempts:[attempt(wrong)]}),null);
    assert.equal(saved({attempts:[attempt(wrong),attempt(corrected)]})?.checkedClassification,answers[row.context.index]);
    assert.equal(saved({attempts:[attempt(corrected),attempt(wrong)]}),null);
    assert.equal(saved({attempts:[null,attempt(corrected)]}),null);
  }
});

test('P115 preserves genuine rejected coordinate attempts without pretending they placed a point', () => {
  const row=rows[0], model=original.initial(row.task,1);
  plot(row.task,model,[-10,4]);
  assert.equal(model.board.placed.length,0);
  plot(row.task,model,['-6/2','4.0']);
  model.answers=['II'];
  assert.equal(original.inspect(row.task,model).correct,true);
  assert.deepEqual(checked(row,model).observableActions, [
    {eventIndex:0,action:'plot',accepted:false},
    {eventIndex:1,action:'plot',accepted:true,point:[-3,4]}
  ]);
});

test('P115 excludes a near integer accepted by floating point coercion', () => {
  const row=rows[0], model=original.initial(row.task,1);
  plot(row.task,model,['-3.00000000000000000001',4]);
  model.answers=['II'];
  assert.equal(original.inspect(row.task,model).correct,true);
  assert.equal(checked(row,model),null);
});

test('P115 rejects missing, corrupt, wrong-index and unsupported state', () => {
  const row=rows[0];
  const mutations=[
    model=>{model.history=[];},
    model=>{model.history=new Array(1);},
    model=>{model.history[0].f.x='-2';},
    model=>{model.history[0].d.index='1';},
    model=>{model.history[0].a='close';},
    model=>{model.history[0].ghost=true;},
    model=>{model.history=Array.from({length:1001},()=>model.history[0]);},
    model=>{model.board.placed[0][1]=5;},
    model=>{model.answers[0]='IV';},
    model=>{model.seed=0;}
  ];
  for(const change of mutations){
    const model=work(row);
    change(model);
    assert.equal(checked(row,model),null,change.toString());
  }
  assert.equal(checked(row,null),null);
});

test('P115 keeps wrong-source, practice and actual bridge contexts outside this witness', async () => {
  await ensureB39Ready();
  const {task,context}=rows[0];
  assert.equal(p115QuadrantBinding(sessionTaskFor('pointbuild',0),{sessionId:'pointbuild',index:0}),null);
  assert.equal(p115QuadrantBinding(task,{sessionId:'pointbuild',index:0}),null);
  assert.equal(p115QuadrantBinding(task,{...context,index:-1}),null);
  assert.equal(p115QuadrantBinding(sessionTaskFor('signedpoints',-1),{...context,index:-1}),null);
  let matches=0;
  for(const [sessionId, bridge] of Object.entries(BRIDGES)) {
    for(const [index, related] of bridge.tasks.entries()){
      if(related?.type!==task.type) continue;
      matches++;
      assert.equal(p115QuadrantBinding(related,{sessionId,index}),null);
      assert.equal(p115QuadrantBinding(task,{sessionId,index}),null);
    }
  }
  assert.ok(matches>0);
});
