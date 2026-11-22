// #342 P004n original preset regular-hexagon events and negative cases.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {geometryNotationHexagonBinding as binding,replayGeometryNotationHexagonEvidence as replay,
 submittedGeometryNotationHexagonEvidence as submitted}
 from '../dist/learning/p004n-geometrynotation-hexagon-evidence.js';
const ctx={sessionId:'geometrynotation',index:3};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const make=(order=[0,1,2,3,4,5])=>{
 const task=sessionTaskFor('geometrynotation',3),model=native.initial(task,314159);
 for(const index of order)native.act(task,model,'g23-add',{index});
 native.act(task,model,'g23-close');model.answers=['6'];
 return {task,model};
};
const edit=(m,f)=>{const c=structuredClone(m);f(c);return c;};
test('P004n exact original native source and independent regular geometry',()=>{
 const {task,model}=make(),hash=digest(task);
 console.log('P004N_NATIVE_FULL_TASK_SHA256 geometrynotation:3 '+hash);
 assert.match(hash,/^[0-9a-f]{64}$/);
 assert.equal(task.type,'x-s23-polygon');assert.equal(task.n,6);
 assert.equal(task.preset,true);assert.equal(task.kind,'regular');
 assert.equal(binding(task,ctx)?.nodeId,'mt_WtIFJSCQIT');
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,model).correct,true);
 const proof=replay(task,model,ctx);assert.ok(proof);
 assert.deepEqual(proof.originalPointIndices,[0,1,2,3,4,5]);
 assert.equal(proof.independentGeometry.interiorAngleSumDegrees,720);
 assert.equal(proof.independentGeometry.nonSelfIntersecting,true);
 assert.equal(proof.strictAApproved,false);
});
test('P004n rejects wrong vertex order, too few points and stale Check',()=>{
 const {task,model}=make();
 assert.equal(replay(task,make([0,2,1,3,4,5]).model,ctx),null);
 assert.equal(replay(task,make([0,1,2,3,4]).model,ctx),null);
 const wrong=edit(model,m=>{m.answers[0]='5';});
 assert.equal(native.inspect(task,wrong).correct,false);
 assert.equal(replay(task,wrong,ctx),null);
 const attempts={attempts:[{value:wrong},{value:structuredClone(model)}]};
 assert.ok(submitted(task,model,attempts,ctx));
 assert.equal(submitted(task,model,{attempts:[{value:wrong}]},ctx),null);
 assert.equal(submitted(task,wrong,attempts,ctx),null);
});
test('P004n authentic undo/reset, incorrect closure, recovery',()=>{
 const task=sessionTaskFor('geometrynotation',3),model=native.initial(task,314159);
 for(let i=0;i<5;i++)native.act(task,model,'g23-add',{index:i});
 native.act(task,model,'g23-close');
 assert.equal(native.inspect(task,model).correct,false);
 native.act(task,model,'g23-add',{index:5});
 native.act(task,model,'g23-close');model.answers=['6'];
 assert.ok(replay(task,model,ctx));
 native.act(task,model,'g23-reset');
 assert.equal(replay(task,model,ctx),null);
 for(let i=0;i<6;i++)native.act(task,model,'g23-add',{index:i});
 native.act(task,model,'g23-close');
 assert.ok(replay(task,model,ctx)?.originalControlEvents.some(e=>e.action==='reset'));
 native.act(task,model,'g23-undo');
 assert.equal(replay(task,model,ctx),null);
 native.act(task,model,'g23-add',{index:5});
 native.act(task,model,'g23-close');
 assert.ok(replay(task,model,ctx));
});
test('P004n reject forged source, stale context, history and board',()=>{
 const {task,model}=make();
 for(const c of [null,{sessionId:'shapesides',index:'2'},
  {sessionId:'shapesides',index:0},{sessionId:'shapesides',index:2}])
  assert.equal(replay(task,model,c),null);
 for(const t of [{...task,prompt:task.prompt+' '},{...task,preset:false},
  {...task,n:5},{...task,kind:'any'},{...task,questions:[]},
  {...task,extra:1}])assert.equal(replay(t,model,ctx),null);
 for(const f of [m=>{m.history=[];},m=>{m.history[0].a='mark';},
  m=>{m.history[0].d.index='00';},m=>{m.history[0].d.index='7';},
  m=>{m.history[0].d.index=0;},m=>{m.history[0].d.extra='x';},
  m=>{m.history[0].f.fake='x';},m=>{m.history[0].fake=1;},
  m=>{m.board.points.reverse();},m=>{m.board.closed=false;},
  m=>{m.issue='fake';},m=>{m.extra=1;},m=>{m.answers[0]='5';}])
  assert.equal(replay(task,edit(model,f),ctx),null,f.toString());
 const forged=native.initial(task,314159);forged.board.points=[0,1,2,3,4,5];
 forged.board.closed=true;forged.answers=['6'];
 assert.equal(replay(task,forged,ctx),null);
});
