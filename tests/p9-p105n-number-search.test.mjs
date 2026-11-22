import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect,solveSteps} from '../dist/learning/phase5/b14-model.js';
import {P105N_SOURCES,replayP105NNumberSearchEvidence,submittedP105NNumberSearchEvidence} from '../dist/learning/p105n-number-search-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P105N_SOURCES) {
  test(`${sessionId}:${index} replays the bounded number search from the original controls`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=m=>replayP105NNumberSearchEvidence(task,m,context);
    const proof=replay(good);
    assert.equal(proof?.mode,task.mode);
    assert.equal(replayP105NNumberSearchEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'b14-reset');
    assert.equal(replay(reset),null);
    for (const step of solveSteps(task)) {
      if (step.field) reset[step.field]=step.value;
      else act(task,reset,step.action,step.data);
    }
    assert.deepEqual(replay(reset),proof);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history[0].action='b14-split';},
      m=>{m.history[0].data.index=0;},
      m=>{m.board.selected.push(200);},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP105NNumberSearchEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP105NNumberSearchEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
