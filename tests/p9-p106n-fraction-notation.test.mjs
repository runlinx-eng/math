import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example,inspect} from '../dist/learning/phase5/b16-model.js';
import {P106N_SOURCES, replayP106NFractionNotationEvidence, submittedP106NFractionNotationEvidence} from '../dist/learning/p106n-fraction-notation-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P106N_SOURCES) {
  test(`${sessionId}:${index} checks the saved construction and the submitted conclusion`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP106NFractionNotationEvidence(task,model,context);
    const proof=replay(good);
    assert.ok(proof);
    assert.equal(replayP106NFractionNotationEvidence(task,good,{sessionId,index:-1}),null);
    for (const edit of [
      m=>{m.history=[];},
      m=>{m.history[0].action='select';},
      m=>{m.history[0].data.fields.unit='forged';},
      m=>{m.board.records.pop();},
      m=>{m.board.first.answer='forged';},
    ]) {
      const bad=structuredClone(good);
      edit(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP106NFractionNotationEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP106NFractionNotationEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
