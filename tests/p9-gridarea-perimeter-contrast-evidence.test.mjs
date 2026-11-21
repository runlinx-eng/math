// #342 P001: candidate-only, source-frozen B30 area/perimeter replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b30 from '../dist/learning/phase5/b30-model.js';
import {boundaryRuns,perimeterEdges} from '../dist/learning/phase5/b30-geometry.js';
import {
 gridareaPerimeterContrastBinding as binding,
 replayGridareaPerimeterContrastEvidence as replay,
 submittedGridareaPerimeterContrastEvidence as submitted
} from '../dist/learning/gridarea-perimeter-contrast-evidence.js';

const HASH='79cadc478abf5d9d742c2ff5cd2cb0f090cbbbef9dcd21bc34d5451a1900997f';
const context={sessionId:'gridarea',index:2};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function fixture(){
 const task=sessionTaskFor(context.sessionId,context.index),model=b30.initial(task);
 for(let i=0;i<boundaryRuns(task.cells).length;i++)
  b30.act(task,model,'a30-edge',{index:i});
 model.perimeter='14';model.unit='cm';model.answers[0]='12';
 return {task,model};
}
const attempt=model=>({value:structuredClone(model)});
test('P001 task hash/source and independent 12 square / 14 exposed edge contrast',()=>{
 const {task,model}=fixture();
 assert.equal(hash(task),HASH);
 assert.equal(task.mode,'edge');
 assert.equal(perimeterEdges(task.cells).length,14);
 assert.equal(task.cells.length,12);
 assert.deepEqual(boundaryRuns(task.cells).map(([a,b])=>
  Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])),[4,3,3,4]);
 assert.equal(binding(task,context)?.nodeId,'mt_6xNmQLzuqm');
 assert.equal(b30.valid(task,model),true);
 assert.equal(b30.inspect(task,model).correct,true);
 const result=replay(task,model,context);
 assert.ok(result);
 assert.equal(result.areaSquareCentimeters,12);
 assert.equal(result.perimeterCentimeters,14);
 assert.equal(result.exteriorUnitEdgesVerified,14);
 assert.equal(result.chronologicalRequests.length,4);
 assert.equal(result.studentPlacedAreaTiles,false);
 assert.equal(result.learnerMasteryAssessed,false);
});
test('P001 latest native Check, wrong then correct, and later edit boundaries',()=>{
 const {task,model}=fixture(),wrong=structuredClone(model);
 wrong.perimeter='4';
 assert.equal(b30.inspect(task,wrong).correct,false);
 assert.equal(replay(task,wrong,context),null);
 const record={attempts:[attempt(wrong),attempt(model)]};
 assert.ok(submitted(task,model,record,context));
 assert.equal(submitted(task,model,{attempts:[attempt(wrong)]},context),null);
 assert.equal(submitted(task,{...model,prose:'later edit'},record,context),null);
 assert.equal(submitted(task,model,{attempts:[]},context),null);
 assert.equal(submitted(task,model,{attempts:[attempt(model),attempt(wrong)]},context),null);
});
test('P001 original edge toggles, undo and clear really replay',()=>{
 const {task,model}=fixture();
 b30.act(task,model,'a30-edge',{index:0});
 assert.equal(replay(task,model,context),null);
 b30.act(task,model,'a30-edge',{index:0});
 assert.equal(replay(task,model,context)?.toggles.length,2);
 b30.act(task,model,'a30-undo');
 assert.equal(replay(task,model,context),null);
 b30.act(task,model,'a30-edge',{index:boundaryRuns(task.cells).length-1});
 assert.equal(replay(task,model,context)?.undos.length,1);
 b30.act(task,model,'a30-clear');
 assert.equal(replay(task,model,context),null);
 for(let i=0;i<boundaryRuns(task.cells).length;i++)b30.act(task,model,'a30-edge',{index:i});
 const proof=replay(task,model,context);
 assert.ok(proof);
 assert.equal(proof.clears.length,1);
 assert.ok(proof.chronologicalRequests.length>4);
});
test('P001 forged history/board, incorrect answers and numeric tolerance fail closed',()=>{
 const {task,model}=fixture();
 const mutations=[
  m=>{m.history=[];},m=>{m.history.shift();},
  m=>{m.history[0].a='tile';},m=>{m.history[0].i='01';},
  m=>{m.history[0].i='-1';},m=>{m.history[0].i='999';},
  m=>{m.history[0].f.injected='1';},m=>{m.history[0].extra=1;},
  m=>{m.history.push({a:'edge',i:'0',f:{extra:'1'}});},
  m=>{m.board.edges=[];},m=>{m.board.tiles=[0];},
  m=>{m.board.bad=true;},m=>{m.board.first.edge=1;},
  m=>{m.issue='error';},m=>{m.unit='cm²';},
  m=>{m.perimeter='4';},m=>{m.perimeter='14.0000000000000001';},
  m=>{m.perimeter='1.4e1';},m=>{m.perimeter='Infinity';},
  m=>{m.answers[0]='14';},m=>{m.answers[0]='12.0000001';},
  m=>{m.answers[0]='1.2e1';},m=>{m.area='12';}
 ];
 for(const mutate of mutations){
  const changed=structuredClone(model);mutate(changed);
  assert.equal(replay(task,changed,context),null,mutate.toString());
 }
});
test('P001 cross-source, clone, altered text, nonnative and malformed context rejected',()=>{
 const {task,model}=fixture();
 for(const c of [
  {sessionId:'gridarea',index:0},{sessionId:'gridarea',index:1},
  {sessionId:'walkperim',index:2},{sessionId:'term38',index:2},
  {sessionId:'gridarea',index:'2'},{sessionId:23,index:2},null
 ]){assert.equal(binding(task,c),null);assert.equal(replay(task,model,c),null);}
 for(const t of [
  {...task,prompt:task.prompt+' '},{...task,questions:[{...task.questions[0],value:13}]},
  {...task,mode:'tile'},{...task,cells:task.cells.slice(1)},
  {...task,unit:'m'},sessionTaskFor('walkperim',2)
 ]){assert.equal(binding(t,context),null);assert.equal(replay(t,model,context),null);}
});
