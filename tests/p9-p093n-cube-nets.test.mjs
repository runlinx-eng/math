import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase4/b02-model.js';
import {P093N_SOURCES,replayP093NCubeNetsEvidence,submittedP093NCubeNetsEvidence} from '../dist/learning/p093n-cube-nets-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P093N_SOURCES) {
  test(`${sessionId}:${index} reconstructs cube adjacency from the recorded folding snapshot`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    if (!good.guess) {
      good.pair=[null,null];
      good.runs[0].pair=[null,null];
    }
    assert.ok(inspect(task,good).correct);
    const replay=m=>replayP093NCubeNetsEvidence(task,m,context);
    const proof=replay(good);
    assert.equal(proof?.foldable,good.guess);
    assert.equal(replayP093NCubeNetsEvidence(task,good,{sessionId,index:-1}),null);
    const open=structuredClone(good);
    act(task,open,'unfold',{});
    assert.equal(replay(open),null);
    for (const edit of [
      m=>{m.runs=[];},
      m=>{m.runs[0].cells[0][0] += 9;},
      m=>{m.runs[0].guess=!m.runs[0].guess;},
      m=>{m.pair=[0,0];},
      m=>{m.fold=50;},
    ]) {
      const bad=structuredClone(good);
      edit(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP093NCubeNetsEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP093NCubeNetsEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
