import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect,solveSteps} from '../dist/learning/phase5/b21-model.js';
import {P110C_SOURCES,replayP110CStatisticalCentreEvidence,submittedP110CStatisticalCentreEvidence} from '../dist/learning/p110c-statistical-centre-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P110C_SOURCES) {
  test(`${sessionId}:${index} replays the recorded statistical construction and checks its result`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP110CStatisticalCentreEvidence(task,model,context);
    const proof=replay(good);
    assert.equal(proof?.mode,task.mode);
    if (task.mode==='append') {
      const equivalent=structuredClone(good);
      equivalent.metrics[0]='205/3';
      assert.ok(inspect(task,equivalent).correct);
      assert.deepEqual(replay(equivalent),proof);
    }
    assert.equal(replayP110CStatisticalCentreEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'b21-reset');
    assert.equal(replay(reset),null);
    for (const step of solveSteps(task)) {
      if (step.action) act(task,reset,step.action,step.data);
      else if (!step.field.includes('.')) reset[step.field]=step.value;
    }
    assert.deepEqual(replay(reset),proof);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history[0].a='row';},
      m=>{m.board.values[0]++;},
      m=>{m.metrics[0]=String(Number(m.metrics[0])+0.00000001);},
      m=>{m.issue='fabricated';},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP110CStatisticalCentreEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP110CStatisticalCentreEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
