import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase5/b14-model.js';
import {P105F_SOURCES,replayP105FPrimeForestEvidence,submittedP105FPrimeForestEvidence} from '../dist/learning/p105f-prime-forest-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P105F_SOURCES) {
  test(`${sessionId}:${index} replays prime-factor trees and compares the two constructions`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=m=>replayP105FPrimeForestEvidence(task,m,context);
    const proof=replay(good);
    assert.equal(proof?.primeFactors.length,task.ns.length);
    assert.equal(replayP105FPrimeForestEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'b14-reset');
    assert.equal(replay(reset),null);
    if (task.common) assert.equal(proof.common.hcf,index===1?12:1);
    if (task.twice) assert.deepEqual(proof.firstCut,[2,30]);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history[0].data.index=999;},
      m=>{m.board.nodes[0].value++;},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP105FPrimeForestEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP105FPrimeForestEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
