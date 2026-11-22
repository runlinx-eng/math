import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example,inspect} from '../dist/learning/phase5/b09-model.js';
import {P104T_SOURCES,replayP104TToolPathsEvidence,submittedP104TToolPathsEvidence} from '../dist/learning/p104t-tool-paths-evidence.js';

const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');
await ensureB39Ready();
const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P104T_SOURCES) {
  test(`${sessionId}:${index} checks saved ruler joins or tool-specific moves`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    good.history=task.mode==='measure'?good.segments.map(({tool,zero})=>({tool,value:zero})):
      good.line.map(value=>({tool:'line',value}));
    const replay=m=>replayP104TToolPathsEvidence(task,m,context);
    const proof=replay(good);
    assert.ok(proof);
    assert.equal(replayP104TToolPathsEvidence(task,good,{sessionId,index:-1}),null);
    if (task.mode==='measure') {
      const afterUndo=structuredClone(good);
      afterUndo.history.push({tool:'ruler',value:0});
      assert.deepEqual(replay(afterUndo),proof);
    }
    for (const edit of [
      m=>{m.history=[];},
      m=>{m.history[0].value=219;},
      m=>{m.history[0].tool='cubes';},
      m=>{m.answer='0';},
    ]) {
      const bad=structuredClone(good);
      edit(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP104TToolPathsEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP104TToolPathsEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
