// #318: original-source frozen B30 tile-area contracts and adversarial replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b30 from '../dist/learning/phase5/b30-model.js';
import {unitTileAreaBinding,replayUnitTileAreaEvidence} from '../dist/learning/unit-tile-area-evidence.js';

const rows=[
 {index:0,area:1,hash:'57841e0f8899cbc70e338cf980770c6c12b3cdc17441206db291343e3fa1c85b'},
 {index:1,area:12,hash:'3fa5666f59799e2d95267be6c2c8f218155941a817e0525d19be8fbe8199a4f1'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const context=index=>({sessionId:'gridarea',index});
function build(index){
 const task=sessionTaskFor('gridarea',index),model=b30.initial(task);
 for(const [x,y] of task.cells)b30.act(task,model,'a30-tile',{index:y*task.w+x});
 model.area=String(task.cells.length);
 model.unit='cm²';
 return {task,model,context:context(index)};
}
const proof=x=>replayUnitTileAreaEvidence(x.task,x.model,x.context);
test('#318 two original tile tasks are frozen; unit squares independently counted',()=>{
 for(const row of rows){
  const x=build(row.index);
  assert.equal(hash(x.task),row.hash);
  assert.equal(x.task.mode,'tile');
  assert.equal(b30.valid(x.task,x.model),true);
  assert.equal(b30.inspect(x.task,x.model).correct,true);
  assert.equal(unitTileAreaBinding(x.task,x.context)?.nodeId,'mt_6xNmQLzuqm');
  const p=proof(x);
  assert.ok(p);
  assert.equal(p.areaSquareCentimeters,row.area);
  assert.equal(p.selectedOrder.length,row.area);
  assert.equal(p.studentPlacedTiles,true);
  assert.equal(p.learnerMasteryAssessed,false);
 }
});
test('#318 perimeter, source replacement, same widget and malformed context cannot inherit',()=>{
 for(const row of rows){
  const x=build(row.index);
  assert.equal(unitTileAreaBinding(x.task,{sessionId:'walkperim',index:row.index}),null);
  assert.equal(unitTileAreaBinding(x.task,{sessionId:'gridarea',index:String(row.index)}),null);
  assert.equal(unitTileAreaBinding({...x.task,prompt:x.task.prompt+'!'},x.context),null);
  assert.equal(replayUnitTileAreaEvidence({...x.task,prompt:x.task.prompt+'!'},x.model,x.context),null);
 }
 assert.equal(unitTileAreaBinding(sessionTaskFor('gridarea',2),context(2)),null);
 assert.equal(unitTileAreaBinding(sessionTaskFor('walkperim',0),{sessionId:'walkperim',index:0}),null);
});
test('#318 missing/repeated/forged clicks, arithmetic, board and unit claims fail closed',()=>{
 for(const row of rows){
  const x=build(row.index);
  for(const mutate of [
   m=>{m.history=[];},m=>{m.history.shift();},
   m=>{m.history[0].a='edge';},m=>{m.history[0].i='01';},
   m=>{m.history[0].i='-1';},m=>{m.history[0].i='999';},
   m=>{m.history[0].f.injected='1';},m=>{m.history[0].extra=1;},
   m=>{m.board.tiles=[];},m=>{m.board.bad=true;},
   m=>{m.board.first.tile=0;},m=>{m.board.edges=[0];},
   m=>{m.area=String(row.area+1);},m=>{m.area=String(row.area)+'.00000001';},
   m=>{m.area='1e0';},m=>{m.unit='cm';},
   m=>{m.issue='not ready';},m=>{m.history.push({a:'tile',i:'999',f:{}});}
  ]){
   const y=structuredClone(x.model);mutate(y);
   assert.equal(replayUnitTileAreaEvidence(x.task,y,x.context),null,mutate.toString());
  }
 }
});
test('#318 real toggles, undo, clear and correction requests retain history without false area',()=>{
 for(const row of rows){
  const x=build(row.index),n=x.task.cells.length;
  b30.act(x.task,x.model,'a30-tile',{index:0});
  assert.equal(proof(x),null);
  b30.act(x.task,x.model,'a30-tile',{index:0});
  assert.equal(proof(x)?.toggles.length,2);
  b30.act(x.task,x.model,'a30-undo');
  assert.equal(proof(x),null);
  b30.act(x.task,x.model,'a30-tile',{index:0});
  assert.equal(proof(x)?.undos.length,1);
  b30.act(x.task,x.model,'a30-clear');
  assert.equal(proof(x),null);
  for(let i=0;i<n;i++)b30.act(x.task,x.model,'a30-tile',{index:i});
  const p=proof(x);
  assert.ok(p);
  assert.equal(p.clears.length,1);
  assert.ok(p.chronologicalRequests.length>n);
 }
});
