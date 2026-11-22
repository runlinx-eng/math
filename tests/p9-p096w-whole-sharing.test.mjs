import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase5/b16-model.js';
import {P096W_SOURCES,replayP096WWholeSharingEvidence,submittedP096WWholeSharingEvidence} from '../dist/learning/p096w-whole-sharing-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P096W_SOURCES) {
  test(`${sessionId}:${index} replays allocation of units and checks fraction naming`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=m=>replayP096WWholeSharingEvidence(task,m,context);
    const proof=replay(good);
    assert.equal(proof?.wholePerPerson,Math.floor(task.wholes/task.people));
    assert.equal(proof.pieceNumerator,task.wholes%task.people);
    assert.equal(replayP096WWholeSharingEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'b16-reset');
    assert.equal(replay(reset),null);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history[0].data.index='999';},
      m=>{m.board.groups[0]=-1;},
      m=>{m.equation="0=0";},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP096WWholeSharingEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP096WWholeSharingEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
