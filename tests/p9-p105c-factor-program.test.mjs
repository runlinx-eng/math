import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase5/b14-model.js';
import {P105C_SOURCES,replayP105CFactorProgramEvidence,submittedP105CFactorProgramEvidence} from '../dist/learning/p105c-factor-program-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P105C_SOURCES) {
  test(`${sessionId}:${index} replays finite factor or prime checks and conditions`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=m=>replayP105CFactorProgramEvidence(task,m,context);
    const proof=replay(good);
    assert.equal(proof?.checked,task.n);
    assert.equal(replayP105CFactorProgramEvidence(task,good,{sessionId,index:-1}),null);
    const draft=structuredClone(good);
    draft.condition=task.mode==='factors'?'nonzero':'one';
    assert.equal(replay(draft),null);
    act(task,draft,'b14-run');
    assert.equal(replay(draft),null);
    draft.condition=good.condition;
    act(task,draft,'b14-run');
    assert.deepEqual(replay(draft),proof);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history[0].data.value='stop';},
      m=>{m.board.runs.at(-1).trace[0].keep=false; m.board.runs.at(-1).output.push(1);},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP105CFactorProgramEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP105CFactorProgramEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
