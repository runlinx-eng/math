import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase5/b15-model.js';
import {P094D_SOURCES,replayP094DDecimalDivisionEvidence,submittedP094DDecimalDivisionEvidence} from '../dist/learning/p094d-decimal-division-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P094D_SOURCES) {
  test(`${sessionId}:${index} recomputes the decimal long-division place and each exchange`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=m=>replayP094DDecimalDivisionEvidence(task,m,context);
    const proof=replay(good);
    assert.equal(proof?.quotient,String(Number(task.decimal)/task.divisor));
    assert.equal(replayP094DDecimalDivisionEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'b15-reset');
    assert.equal(replay(reset),null);
    if (task.decimal==='13') assert.equal(proof.appendedZeros,2);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history[0].data.fields.point='0';},
      m=>{m.board.steps[0].r++;},
      m=>{m.check="0=0";},
      m=>{m.answer=String(Number(m.answer)+0.00000001);},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP094DDecimalDivisionEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP094DDecimalDivisionEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
