import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,axes,example,inspect,solveSteps} from '../dist/learning/phase5/b23-model.js';
import {P101A_SOURCES,replayP101AReflectionAxesEvidence,submittedP101AReflectionAxesEvidence} from '../dist/learning/p101a-reflection-axes-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P101A_SOURCES) {
  test(`${sessionId}:${index} compares recorded mirror tests with geometric axes`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP101AReflectionAxesEvidence(task,model,context);
    const proof=replay(good);
    assert.deepEqual(proof?.axes,axes(task).map(i=>task.candidates[i]));
    if (task.turn) assert.equal(proof.minimumTurn,60);
    assert.equal(replayP101AReflectionAxesEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'g23-reset');
    assert.equal(replay(reset),null);
    for (const step of solveSteps(task)) if (step.action) act(task,reset,step.action,step.data);
    assert.deepEqual(replay(reset),proof);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history[0].d.index='999';},
      m=>{m.board.marked=[];m.board.none=!m.board.none;},
      m=>{m.answers[0]='999';},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP101AReflectionAxesEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP101AReflectionAxesEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
