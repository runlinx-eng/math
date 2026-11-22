import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase5/b21-model.js';
import {P110M_SOURCES,replayP110MMediaClaimsEvidence,submittedP110MMediaClaimsEvidence} from '../dist/learning/p110m-media-claims-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P110M_SOURCES) {
  test(`${sessionId}:${index} replays evidence-bounded decisions about existing records`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP110MMediaClaimsEvidence(task,model,context);
    const proof=replay(good);
    assert.ok(proof?.observation);
    assert.equal(replayP110MMediaClaimsEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'b21-reset');
    assert.equal(replay(reset),null);
    if (task.mode==='axis') assert.equal(proof.observation.actualDifference,2);
    if (task.mode==='context') assert.deepEqual(proof.observation.decisions,['correct','keep','unknown']);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history.at(-1).a='mark';},
      m=>{m.history.at(-1).d.index='0';},
      m=>{m.board.cursor++;},
      m=>{m.issue='forged';},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP110MMediaClaimsEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP110MMediaClaimsEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
