import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,initial,inspect,solveSteps} from '../dist/learning/phase5/b34-model.js';
import {P103T_SOURCES,replayP103TProgramTraceEvidence,submittedP103TProgramTraceEvidence} from '../dist/learning/p103t-program-trace-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P103T_SOURCES) {
  test(`${sessionId}:${index} recomputes condition branches, the stop point and block output`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP103TProgramTraceEvidence(task,model,context);
    const proof=replay(good);
    assert.deepEqual(proof?.conclusions,task.questions.map(q=>q.value));
    if (task.mode==='classify'||task.mode==='loop') {
      const retry=initial(task);
      const ids=task.blocks.map(block=>block.id).reverse();
      for (const index of ids) act(task,retry,'p34-block',{index});
      act(task,retry,'p34-run');
      assert.equal(replay(retry),null);
      act(task,retry,'p34-clear');
      for (const step of solveSteps(task)) {
        if (step.action) act(task,retry,step.action,step.data);
        else retry.answers[Number(step.field.split('.')[1])]=step.value;
      }
      assert.deepEqual(replay(retry),proof);
    }
    assert.equal(replayP103TProgramTraceEvidence(task,good,{sessionId,index:-1}),null);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history[0].i='impossible';},
      m=>{m.history[0].v='tampered';},
      m=>{m.board.done=false;},
      m=>{m.answers[0]='arbitrary';},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP103TProgramTraceEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP103TProgramTraceEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
