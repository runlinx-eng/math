import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example,inspect} from '../dist/learning/phase5/b09-model.js';
import {P091R_SOURCES,replayP091RInequalityRangeEvidence,submittedP091RInequalityRangeEvidence} from '../dist/learning/p091r-inequality-range-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P091R_SOURCES) {
  test(`${sessionId}:${index} checks the original inequality, graph endpoints, and tested values`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP091RInequalityRangeEvidence(task,model,context);
    const proof=replay(good);
    assert.ok(proof);
    assert.equal(replayP091RInequalityRangeEvidence(task,good,{sessionId,index:-1}),null);
    for (const edit of [
      m=>{m.trials=[];},
      m=>{m.trials[0].actual=!m.trials[0].actual;},
      m=>{m.trials[0].graph=!m.trials[0].graph;},
      m=>{m.commands.push({op:'sub',value:1});},
      m=>{m.closed=m.closed==='yes'?'no':'yes';},
      m=>{m.statement='x=0';},
    ]) {
      const bad=structuredClone(good);
      edit(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP091RInequalityRangeEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP091RInequalityRangeEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
