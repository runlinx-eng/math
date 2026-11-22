import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b03 from '../dist/learning/phase4/b03-model.js';
import {P056_MOSAIC_SOURCE as source,p056MosaicBinding as binding,
 replayP056MosaicEvidence as replay,submittedP056MosaicEvidence as submitted}
 from '../dist/learning/p056-original-mosaic-evidence.js';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
test('P056 source is only B03 equalparts:1, not its circle-cut sibling',()=>{
 const ctx={sessionId:'equalparts',index:1};
 const t=sessionTaskFor('equalparts',1);
 assert.equal(createHash('sha256').update(JSON.stringify(stable(t))).digest('hex'),source.taskHash);
 assert.equal(binding(t,ctx)?.nodeId,source.nodeId);
 assert.equal(binding(sessionTaskFor('equalparts',0),ctx),null);
 assert.equal(binding(t,{sessionId:'equalparts',index:0}),null);
 assert.equal(binding({...t,prompt:t.prompt+'X'},ctx),null);
});
test('P056 independent 4 x four-cell partition proof and distinct saved form',()=>{
 const task=sessionTaskFor('equalparts',1),ctx={sessionId:'equalparts',index:1};
 const good=b03.example(task),original=JSON.stringify(good);
 assert.equal(b03.inspect(task,good).correct,true);
 const proof=replay(task,good,ctx);
 assert.ok(proof);
 assert.equal(proof.verifiedCellsPerColour,4);
 assert.equal(proof.genuinelyDistinctCellPartitions,true);
 assert.equal(proof.paintActionChronologyObserved,false);
 assert.equal(proof.strictAApproved,false);
 assert.equal(JSON.stringify(good),original);
 const wrong=structuredClone(good);wrong.den=3;
 assert.equal(submitted(task,good,{attempts:[{value:wrong}]},ctx),null);
 assert.deepEqual(submitted(task,good,{attempts:[{value:wrong},{value:structuredClone(good)}]},ctx),proof);
 for(const [label,mutate] of [
  ['fifth colour cell',m=>m.cells[4]=0],
  ['missing fourth cell',m=>m.cells[0]=-1],
  ['lost saved form',m=>m.saved=[]],
  ['duplicate final only',m=>m.saved=[structuredClone(m.cells)]],
  ['colour-renaming not geometry',m=>m.saved=[m.cells.map(c=>(c+1)%4)]],
  ['saved form unequal',m=>m.saved[0][0]=3],
  ['wrong fraction number',m=>m.den=3],
  ['fake step history',m=>m.history=[]]
 ]){const model=structuredClone(good);mutate(model);assert.equal(replay(task,model,ctx),null,label);}
});
