import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example,inspect} from '../dist/learning/phase5/b16-model.js';
import {P109B_SOURCES, replayP109BAlgebraBalanceEvidence, submittedP109BAlgebraBalanceEvidence} from '../dist/learning/p109b-algebra-balance-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P109B_SOURCES) {
  test(`${sessionId}:${index} checks the saved construction and the submitted conclusion`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP109BAlgebraBalanceEvidence(task,model,context);
    const proof=replay(good);
    assert.ok(proof);
    const equivalent={...good,equation:`${task.total}=n×${task.count}+${task.fixed}`};
    assert.ok(inspect(task,equivalent).correct);
    assert.deepEqual(replay(equivalent),proof);
    assert.equal(replayP109BAlgebraBalanceEvidence(task,good,{sessionId,index:-1}),null);
    for (const edit of [
      m=>{m.history=[];},
      m=>{m.history[0].action='select';},
      m=>{m.history[0].data.index='forged';},
      m=>{m.board.divided=!m.board.divided;},
      m=>{m.answer='forged';},
    ]) {
      const bad=structuredClone(good);
      edit(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP109BAlgebraBalanceEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP109BAlgebraBalanceEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
