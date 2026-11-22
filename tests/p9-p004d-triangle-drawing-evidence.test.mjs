// #342 / P004d four native B23 3-point triangle constructions, development only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {triangleDrawingBinding as binding,
 replayTriangleDrawingEvidence as replay,
 submittedTriangleDrawingEvidence as submitted}
 from '../dist/learning/p004d-triangle-drawing-evidence.js';

const cases=[
 ['shapehello',2,'mt_KJeEeTutJI'],
 ['shapeframe',0,'mt_2VR963szuk'],
 ['shapeidentity',0,'mt_bfhng6mOuy'],
 ['shapedraw',0,'mt_vJUa62bxeR']
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const ctx=s=>({sessionId:s[0],index:s[1]});
const add=(t,m,index)=>native.act(t,m,'g23-add',{index});
function fixture(s){
  const task=sessionTaskFor(s[0],s[1]),model=native.initial(task,314159);
  for(const i of [8,12,38])add(task,model,i);
  native.act(task,model,'g23-close');
  model.answers=task.questions.map(q=>String(q.value));
  return {task,model};
}
for(const s of cases){
  const id=s[0]+':'+s[1];
  test('P004d '+id+' exact native source and independent triangle replay',()=>{
    const {task,model}=fixture(s);
    console.log('P004D_NATIVE_FULL_TASK_SHA256 '+id+' '+hash(task));
    assert.equal(task.type,'x-s23-polygon');
    assert.equal(task.n,3);assert.equal(task.kind,'any');
    assert.equal(binding(task,ctx(s))?.nodeId,s[2]);
    assert.equal(native.valid(task,model),true);
    assert.equal(native.inspect(task,model).correct,true);
    const proof=replay(task,model,ctx(s));assert.ok(proof);
    assert.deepEqual(proof.originalPointIndices,[8,12,38]);
    assert.deepEqual(proof.independentGeometry.vertices,[[1,1],[5,1],[3,5]]);
    assert.equal(proof.independentGeometry.areaSquareGridUnits,8);
    assert.equal(proof.generalMasteryAssessed,false);
  });
  test('P004d '+id+' original wrong answer then latest corrected Check',()=>{
    const {task,model}=fixture(s),bad=structuredClone(model);
    model.answers[0]='not-the-original-answer';
    assert.equal(native.inspect(task,model).correct,false);
    assert.equal(replay(task,model,ctx(s)),null);
    const wrong=structuredClone(model);
    model.answers[0]=String(task.questions[0].value);
    assert.equal(native.inspect(task,model).correct,true);
    const record={attempts:[{value:wrong},{value:structuredClone(model)}]};
    assert.ok(submitted(task,model,record,ctx(s)));
    assert.equal(submitted(task,model,{attempts:[{value:wrong}]},ctx(s)),null);
    assert.equal(submitted(task,wrong,record,ctx(s)),null);
    assert.equal(submitted(task,model,{attempts:[]},ctx(s)),null);
    assert.ok(replay(task,bad,ctx(s)));
  });
  test('P004d '+id+' rejected collinear close, true undo and recovery',()=>{
    const task=sessionTaskFor(s[0],s[1]),m=native.initial(task,314159);
    for(const i of [8,9,10])add(task,m,i);
    native.act(task,m,'g23-close');
    assert.equal(native.inspect(task,m).correct,false);
    assert.equal(m.board.closed,false);
    assert.equal(replay(task,m,ctx(s)),null);
    native.act(task,m,'g23-undo');
    add(task,m,38);native.act(task,m,'g23-close');
    m.answers=task.questions.map(q=>String(q.value));
    assert.equal(native.inspect(task,m).correct,true);
    const p=replay(task,m,ctx(s));assert.ok(p);
    assert.deepEqual(p.originalPointIndices,[8,9,38]);
    assert.ok(p.originalControlEvents.some(x=>x.action==='close'&&!x.geometryAccepted));
    assert.ok(p.originalControlEvents.some(x=>x.action==='undo'));
    native.act(task,m,'g23-reset');
    assert.equal(replay(task,m,ctx(s)),null);
    for(const i of [8,12,38])add(task,m,i);
    native.act(task,m,'g23-close');
    assert.ok(replay(task,m,ctx(s)));
  });
  test('P004d '+id+' forged history, final board, source and task rejected',()=>{
    const {task,model}=fixture(s);
    const bad=[
      x=>{x.history=[];},x=>{x.history[0].a='toggle';},
      x=>{x.history[0].d.index='08';},
      x=>{x.history[0].d.index='49';},
      x=>{x.history[0].d.index=8;},
      x=>{x.history[1].f.fake='1';},
      x=>{x.history[1].d.extra='x';},
      x=>{x.history[2].extra='x';},
      x=>{x.board.points=[8,9,10];},
      x=>{x.board.closed=false;},
      x=>{x.issue='forged';},x=>{x.answers[0]='0';},
      x=>{x.added='forged';}
    ];
    for(const edit of bad){
      const m=structuredClone(model);edit(m);
      assert.equal(replay(task,m,ctx(s)),null,edit.toString());
    }
    for(const context of [null,{sessionId:s[0],index:String(s[1])},
      {sessionId:s[0],index:s[1]+1},{sessionId:'regularity',index:0}])
      assert.equal(replay(task,model,context),null);
    for(const altered of [{...task,prompt:task.prompt+' '},
      {...task,n:4},{...task,questions:[]},
      {...task,kind:'rectangle'}])
      assert.equal(replay(altered,model,ctx(s)),null);
    const fake=native.initial(task,1);
    fake.board.points=[8,12,38];fake.board.closed=true;
    fake.answers=task.questions.map(q=>String(q.value));
    assert.equal(replay(task,fake,ctx(s)),null);
  });
}
