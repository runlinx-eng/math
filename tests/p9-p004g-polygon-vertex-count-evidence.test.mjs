// #342 P004g: exact native five/six-sided polygon construction tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {nativePolygonBinding as binding,replayNativePolygonEvidence as replay,
  submittedNativePolygonEvidence as submitted}
  from '../dist/learning/p004g-polygon-vertex-count-evidence.js';
const cases=[
 {id:'shapedraw',index:2,node:'mt_vJUa62bxeR',n:5,indices:[3,12,32,38,22]},
 {id:'shapedraw',index:3,node:'mt_vJUa62bxeR',n:6,indices:[2,4,13,32,37,21]},
 {id:'shapesides',index:0,node:'mt_zuOGOGFAKb',n:5,indices:[3,12,32,38,22]}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
    .map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const ctx=s=>({sessionId:s.id,index:s.index});
const changed=(m,edit)=>{const c=structuredClone(m);edit(c);return c;};
function fixture(s,indices=s.indices){
  const task=sessionTaskFor(s.id,s.index),model=native.initial(task,314159);
  for(const index of indices)native.act(task,model,'g23-add',{index});
  native.act(task,model,'g23-close');
  model.answers=task.questions.map(q=>String(q.value));
  return {task,model};
}
for(const s of cases){
  const position=s.id+':'+s.index;
  test('P004g '+position+' exact original task and independent integer polygon',()=>{
    const {task,model}=fixture(s);
    const sha=hash(task);
    console.log('P004G_NATIVE_FULL_TASK_SHA256 '+position+' '+sha);
    assert.match(sha,/^[a-f0-9]{64}$/);
    assert.equal(task.type,'x-s23-polygon');
    assert.equal(task.kind,'any');assert.equal(task.n,s.n);
    assert.equal(binding(task,ctx(s))?.nodeId,s.node);
    assert.equal(native.valid(task,model),true);
    assert.equal(native.inspect(task,model).correct,true);
    const p=replay(task,model,ctx(s));assert.ok(p);
    assert.deepEqual(p.originalPointIndices,s.indices);
    assert.equal(p.independentGeometry.vertexCount,s.n);
    assert.equal(p.independentGeometry.edgeCount,s.n);
    assert.ok(p.independentGeometry.absoluteDoubleArea>0);
    assert.equal(p.strictAApproved,false);
    assert.equal(p.physicalDrawingObserved,false);
  });
  test('P004g '+position+' invalid straight line, undo, recovery, latest Check',()=>{
    const task=sessionTaskFor(s.id,s.index),model=native.initial(task,314159);
    // The first three consecutive lattice points are collinear.
    const wrong=[0,1,2,...s.indices.slice(3)];
    for(const index of wrong)native.act(task,model,'g23-add',{index});
    native.act(task,model,'g23-close');
    model.answers=task.questions.map(q=>String(q.value));
    assert.equal(native.inspect(task,model).correct,false);
    assert.equal(replay(task,model,ctx(s)),null);
    const bad=structuredClone(model);
    // Real reset removes the invalid construction before replaying a fresh one.
    native.act(task,model,'g23-reset');
    for(const index of s.indices)native.act(task,model,'g23-add',{index});
    native.act(task,model,'g23-close');
    assert.equal(native.valid(task,model),true);
    assert.equal(native.inspect(task,model).correct,true);
    const proof=replay(task,model,ctx(s));assert.ok(proof);
    assert.ok(proof.originalControlEvents.some(e=>e.action==='reset'));
    assert.ok(proof.originalControlEvents.some(e=>e.action==='close'&&!e.geometryAccepted));
    const record={attempts:[{value:bad},{value:structuredClone(model)}]};
    assert.ok(submitted(task,model,record,ctx(s)));
    assert.equal(submitted(task,bad,record,ctx(s)),null);
    assert.equal(submitted(task,model,{attempts:[{value:bad}]},ctx(s)),null);
    native.act(task,model,'g23-reset');
    assert.equal(replay(task,model,ctx(s)),null);
  });
  test('P004g '+position+' rejects forged events, boards and answers',()=>{
    const {task,model}=fixture(s);
    assert.equal(replay(task,changed(model,m=>m.answers[0]='0'),ctx(s)),null);
    for(const mutation of [
      m=>{m.history=[];},
      m=>{m.history[0].a='toggle';},
      m=>{m.history[0].d.index='03';},
      m=>{m.history[0].d.index=3;},
      m=>{m.history[0].d.index='49';},
      m=>{m.history[0].d.index='-1';},
      m=>{m.history[0].d.extra='x';},
      m=>{m.history[0].f.fake='x';},
      m=>{m.history[0].extra=1;},
      m=>{m.board.points=[...s.indices].reverse();},
      m=>{m.board.closed=false;},
      m=>{m.issue='forged';},
      m=>{m.extra='forged';}
    ])assert.equal(replay(task,changed(model,mutation),ctx(s)),null,
      mutation.toString());
    const forged=native.initial(task,314159);
    forged.board.points=s.indices.slice();forged.board.closed=true;
    forged.answers=task.questions.map(q=>String(q.value));
    assert.equal(replay(task,forged,ctx(s)),null);
  });
  test('P004g '+position+' source, fingerprint and stale submission negative cases',()=>{
    const {task,model}=fixture(s);
    for(const context of [null,{sessionId:s.id,index:String(s.index)},
      {sessionId:s.id,index:99},{sessionId:'shapehello',index:2}])
      assert.equal(replay(task,model,context),null);
    for(const alter of [
      {...task,prompt:task.prompt+' '},
      {...task,n:4},{...task,kind:'regular'},
      {...task,questions:[]},
      {...task,questions:[{...task.questions[0],value:7}]},
      {...task,extra:'forged'}
    ])assert.equal(replay(alter,model,ctx(s)),null);
    assert.equal(submitted(task,model,{attempts:[]},ctx(s)),null);
    assert.equal(submitted(task,model,{attempts:[{value:changed(model,m=>m.answers[0]='0')}]},ctx(s)),null);
  });
}
