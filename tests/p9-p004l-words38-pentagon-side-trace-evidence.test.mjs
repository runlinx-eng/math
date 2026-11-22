// #342 P004l: native side-marking, mathematical negative cases and source lock.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {words38PentagonSideTraceBinding as binding,
  replayWords38PentagonSideTraceEvidence as replay,
  submittedWords38PentagonSideTraceEvidence as submitted}
  from '../dist/learning/p004l-words38-pentagon-side-trace-evidence.js';

const context={sessionId:'words38',index:2};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
    .map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const changed=(m,edit)=>{const c=structuredClone(m);edit(c);return c;};
function fixture(){
  const task=sessionTaskFor('words38',2),model=native.initial(task,314159);
  for(let i=0;i<5;i++)native.act(task,model,'g23-mark',{index:i});
  model.answers=['5','5'];
  return {task,model};
}
test('P004l exact original source and runtime full task hash',()=>{
  const {task,model}=fixture(),sha=hash(task);
  console.log('P004L_NATIVE_FULL_TASK_SHA256 words38:2 '+sha);
  assert.match(sha,/^[a-f0-9]{64}$/);
  assert.equal(task.type,'x-s23-sides');
  assert.equal(task.shape,'pentagon');assert.equal(task.rotation,24);
  assert.equal(binding(task,context)?.nodeId,'mt_lMz9nAs7VO');
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  const proof=replay(task,model,context);assert.ok(proof);
  assert.equal(proof.independentGeometry.vertexCount,5);
  assert.equal(proof.independentGeometry.edgeCount,5);
  assert.equal(proof.independentGeometry.positiveTurns,5);
  assert.ok(proof.independentGeometry.signedDoubleArea>0);
  assert.deepEqual(proof.observedEdgeIndices,[0,1,2,3,4]);
  assert.equal(proof.strictAApproved,false);
});
test('P004l wrong marking, correction and latest original Check',()=>{
  const {task,model}=fixture();
  native.act(task,model,'g23-mark',{index:2});
  assert.equal(native.inspect(task,model).correct,false);
  assert.equal(replay(task,model,context),null);
  const wrong=structuredClone(model);
  native.act(task,model,'g23-mark',{index:2});
  assert.equal(native.inspect(task,model).correct,true);
  const proof=replay(task,model,context);assert.ok(proof);
  assert.ok(proof.originalControlEvents.some(x=>x.action==='mark'&&!x.selected));
  const record={attempts:[{value:wrong},{value:structuredClone(model)}]};
  assert.ok(submitted(task,model,record,context));
  assert.equal(submitted(task,model,{attempts:[{value:wrong}]},context),null);
  assert.equal(submitted(task,wrong,record,context),null);
  native.act(task,model,'g23-reset');
  assert.equal(replay(task,model,context),null);
});
test('P004l model/fields/events/board must not be forged',()=>{
  const {task,model}=fixture();
  for(const edit of [
    m=>{m.history=[];},m=>{m.history[0].a='toggle';},
    m=>{m.history[0].d.index='05';},m=>{m.history[0].d.index=0;},
    m=>{m.history[0].d.index='-1';},m=>{m.history[0].d.extra='x';},
    m=>{m.history[0].f.extra='x';},m=>{m.history[0].extra=true;},
    m=>{m.board.marked=[0,1,2,3];},m=>{m.answers[0]='4';},
    m=>{m.answers[1]='4';},m=>{m.issue='fake';},m=>{m.extra=1;}
  ])assert.equal(replay(task,changed(model,edit),context),null,edit.toString());
  const forged=native.initial(task,314159);
  forged.board.marked=[0,1,2,3,4];forged.answers=['5','5'];
  assert.equal(replay(task,forged,context),null);
});
test('P004l reject false source, task edits and stale record',()=>{
  const {task,model}=fixture();
  for(const c of [null,{sessionId:'words38',index:'0'},
    {sessionId:'words38',index:1},{sessionId:'shapesides',index:0}])
    assert.equal(replay(task,model,c),null);
  for(const bad of [{...task,prompt:task.prompt+' '},
    {...task,shape:'hexagon'},{...task,rotation:0},
    {...task,questions:[]},{...task,extra:1}])
    assert.equal(replay(bad,model,context),null);
  assert.equal(submitted(task,model,{attempts:[]},context),null);
  assert.equal(submitted(task,model,
    {attempts:[{value:changed(model,m=>{m.answers[0]='4';})}]},context),null);
});
