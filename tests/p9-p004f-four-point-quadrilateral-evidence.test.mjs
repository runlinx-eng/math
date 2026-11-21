// #342 P004f: three exact native B23 four-point constructions, development tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {fourPointQuadrilateralBinding as binding,
  replayFourPointQuadrilateralEvidence as replay,
  submittedFourPointQuadrilateralEvidence as submitted}
  from '../dist/learning/p004f-four-point-quadrilateral-evidence.js';
const rectangle=[8,12,33,29],other=[8,12,32,36],rhombus=[8,17,32,23];
const cases=[
  {id:'shapeframe',index:1,node:'mt_2VR963szuk',kind:'rectangle',
    correct:rectangle,wrong:other},
  {id:'shapedraw',index:1,node:'mt_vJUa62bxeR',kind:'rectangle',
    correct:rectangle,wrong:other},
  {id:'quadsort',index:2,node:'mt_Xt1cRqaBOW',kind:'otherquad',
    correct:other,wrong:rectangle}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
    .map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const ctx=s=>({sessionId:s.id,index:s.index});
const add=(t,m,i)=>native.act(t,m,'g23-add',{index:i});
const close=(t,m)=>native.act(t,m,'g23-close');
function fixture(s,points=s.correct){
  const task=sessionTaskFor(s.id,s.index),model=native.initial(task,314159);
  for(const i of points)add(task,model,i);
  close(task,model);
  model.answers=task.questions.map(q=>String(q.value));
  return {task,model};
}
const changed=(m,edit)=>{const o=structuredClone(m);edit(o);return o};
for(const s of cases){
  const id=s.id+':'+s.index;
  test('P004f '+id+' locked native source and independent quadrilateral',()=>{
    const {task,model}=fixture(s),fullHash=hash(task);
    console.log('P004F_NATIVE_FULL_TASK_SHA256 '+id+' '+fullHash);
    assert.match(fullHash,/^[a-f0-9]{64}$/);
    assert.equal(task.type,'x-s23-polygon');
    assert.equal(task.n,4);assert.equal(task.kind,s.kind);
    assert.equal(binding(task,ctx(s))?.nodeId,s.node);
    assert.equal(native.valid(task,model),true);
    assert.equal(native.inspect(task,model).correct,true);
    const p=replay(task,model,ctx(s));assert.ok(p);
    assert.deepEqual(p.originalPointIndices,s.correct);
    assert.equal(p.independentGeometry.vertices.length,4);
    assert.equal(p.independentGeometry.allFourRightAngles,s.kind==='rectangle');
    assert.equal(p.independentGeometry.isRectangle,s.kind==='rectangle');
    assert.equal(p.independentGeometry.isRhombus,false);
    assert.ok(p.independentGeometry.areaSquareGridUnits>0);
    assert.equal(p.physicalDrawingObserved,false);
    assert.equal(p.verbalProofObserved,false);
    assert.equal(p.strictAApproved,false);
  });
  test('P004f '+id+' rejects mathematically wrong quadrilateral, true undo and recovery',()=>{
    const {task,model}=fixture(s,s.wrong);
    assert.equal(native.valid(task,model),true);
    assert.equal(native.inspect(task,model).correct,false);
    assert.equal(replay(task,model,ctx(s)),null);
    const wrong=structuredClone(model);
    native.act(task,model,'g23-undo');
    native.act(task,model,'g23-undo');
    add(task,model,s.correct[2]);add(task,model,s.correct[3]);
    close(task,model);
    assert.equal(native.valid(task,model),true);
    assert.equal(native.inspect(task,model).correct,true);
    const p=replay(task,model,ctx(s));assert.ok(p);
    assert.ok(p.originalControlEvents.filter(x=>x.action==='close').length>=2);
    assert.equal(p.originalControlEvents.filter(x=>x.action==='undo').length,2);
    const record={attempts:[{value:wrong},{value:structuredClone(model)}]};
    assert.ok(submitted(task,model,record,ctx(s)));
    assert.equal(submitted(task,wrong,record,ctx(s)),null);
    assert.equal(submitted(task,model,{attempts:[{value:wrong}]},ctx(s)),null);
    assert.equal(submitted(task,model,{attempts:[]},ctx(s)),null);
    native.act(task,model,'g23-reset');
    assert.equal(replay(task,model,ctx(s)),null);
    for(const i of s.correct)add(task,model,i);
    close(task,model);
    assert.ok(replay(task,model,ctx(s)));
  });
  test('P004f '+id+' wrong answer and bogus history must be rejected',()=>{
    const {task,model}=fixture(s);
    assert.equal(replay(task,changed(model,m=>m.answers[0]='3'),ctx(s)),null);
    const bad=[
      m=>{m.history=[];},m=>{m.history[0].a='toggle';},
      m=>{m.history[0].d.index='08';},m=>{m.history[0].d.index=8;},
      m=>{m.history[0].d.index='49';},
      m=>{m.history[0].d.extra='x';},m=>{m.history[0].f.fake='x';},
      m=>{m.history[0].extra=1;},m=>{m.history[1].d.index='-1';},
      m=>{m.history[4].a='reset';},m=>{m.history[4].d.extra='x';},
      m=>{m.board.points=s.wrong.slice();},
      m=>{m.board.closed=false;},m=>{m.issue='forged';},
      m=>{m.extra='forged';}
    ];
    for(const edit of bad)
      assert.equal(replay(task,changed(model,edit),ctx(s)),null,edit.toString());
    const forged=native.initial(task,123);
    forged.board.points=s.correct.slice();forged.board.closed=true;
    forged.answers=task.questions.map(q=>String(q.value));
    assert.equal(replay(task,forged,ctx(s)),null);
  });
  test('P004f '+id+' wrong source, alternative task and stale Check are rejected',()=>{
    const {task,model}=fixture(s);
    for(const c of [null,{sessionId:s.id,index:String(s.index)},
      {sessionId:s.id,index:0},{sessionId:'shapehello',index:2}])
      assert.equal(replay(task,model,c),null);
    for(const alter of [
      {...task,prompt:task.prompt+' '},
      {...task,n:3},{...task,kind:s.kind==='rectangle'?'any':'rectangle'},
      {...task,questions:[{...task.questions[0],value:5}]},
      {...task,questions:[]},{...task,extra:'forged'}
    ])assert.equal(replay(alter,model,ctx(s)),null);
    assert.equal(submitted(task,model,{attempts:[{value:changed(model,m=>m.answers[0]='3')}]},ctx(s)),null);
  });
}
test('P004f otherquad rejects an equal-side rhombus despite lacking right angles',()=>{
  const s=cases[2],{task,model}=fixture(s,rhombus);
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,false);
  assert.equal(replay(task,model,ctx(s)),null);
});
