import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example,inspect} from '../dist/learning/phase5/b31-model.js';
import {P100V_SOURCES, replayP100VFractionalVolumeEvidence, submittedP100VFractionalVolumeEvidence} from '../dist/learning/p100v-fractional-volume-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P100V_SOURCES) {
  test(`${sessionId}:${index} checks the saved construction and the submitted conclusion`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP100VFractionalVolumeEvidence(task,model,context);
    const proof=replay(good);
    assert.ok(proof);
    assert.equal(replayP100VFractionalVolumeEvidence(task,good,{sessionId,index:-1}),null);
    for (const edit of [
      m=>{m.history=[];},
      m=>{m.history[0].a='choose';},
      m=>{m.history[0].i='forged';},
      m=>{m.board.bad=!m.board.bad;},
      m=>{m.answers.push('forged');},
    ]) {
      const bad=structuredClone(good);
      edit(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP100VFractionalVolumeEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP100VFractionalVolumeEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
