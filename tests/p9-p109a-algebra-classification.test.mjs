import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example,inspect} from '../dist/learning/phase5/b35-model.js';
import {P109A_SOURCES,replayP109AAlgebraClassificationEvidence,submittedP109AAlgebraClassificationEvidence} from '../dist/learning/p109a-algebra-classification-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P109A_SOURCES) {
  test(`${sessionId}:${index} verifies original card choices and checks the bounded written answers`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP109AAlgebraClassificationEvidence(task,model,context);
    const proof=replay(good);
    assert.deepEqual(proof?.categories,task.items.map(item=>item.group));
    assert.equal(replayP109AAlgebraClassificationEvidence(task,good,{sessionId,index:-1}),null);
    const mutations=[
      m=>{m.history=[];},
      m=>{m.history[0].i='999';},
      m=>{m.board.assigned[0]='';},
      m=>{m.history.push({...m.history[0]});},
    ];
    if (task.questions.length) mutations.push(m=>{m.answers[0]='wrong';});
    for (const change of mutations) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP109AAlgebraClassificationEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP109AAlgebraClassificationEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
