import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase5/b21-model.js';
import {P110D_SOURCES,replayP110DDistributionRangeEvidence,submittedP110DDistributionRangeEvidence} from '../dist/learning/p110d-distribution-range-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P110D_SOURCES) {
  test(`${sessionId}:${index} binds the saved bounds to the current source distribution`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP110DDistributionRangeEvidence(task,model,context);
    const proof=replay(good);
    assert.ok(proof?.observation);
    if (task.mode==='cluster') {
      assert.equal(proof.observation.clusterCount,24);
      assert.equal(proof.observation.outlier,4.2);
    }
    if (task.swap) {
      assert.deepEqual(proof.observation.means,proof.observation.beforeSwap.means);
      assert.deepEqual(proof.observation.distances,proof.observation.beforeSwap.distances);
      assert.deepEqual(proof.observation.beforeSwap.overlap,[155,155]);
      assert.deepEqual(proof.observation.overlap,[150,160]);
    }
    assert.equal(replayP110DDistributionRangeEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'b21-reset');
    assert.equal(replay(reset),null);
    if (task.swap) {
      act(task,reset,'b21-swap');
      assert.equal(replay(reset),null);
    }
    act(task,reset,'b21-mark');
    assert.deepEqual(replay(reset),proof);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history.at(-1).f.lowA='0';},
      m=>{m.lowA=String(Number(m.lowA)+0.00000001);},
      m=>{m.board.a[0]++;},
      m=>{m.answers[0]='arbitrary';},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP110DDistributionRangeEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP110DDistributionRangeEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
