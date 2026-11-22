import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,initial,inspect} from '../dist/learning/phase5/b09-model.js';
import {P097C_SOURCES,replayP097CPowerChainEvidence,submittedP097CPowerChainEvidence} from '../dist/learning/p097c-power-chain-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P097C_SOURCES) {
  test(`${sessionId}:${index} binds a complete, feasible native multiplication chain`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const fixture=example(task);
    const good=initial(task);
    function push(v) {
      good.next=String(v);
      act(task,good,'chain-step');
    }
    push(1);
    act(task,good,'chain-undo');
    for (const v of fixture.products) push(v);
    if (task.add) act(task,good,'chain-add');
    good.answer=fixture.answer;
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP097CPowerChainEvidence(task,model,context);
    const proof=replay(good);
    assert.deepEqual(proof?.products,fixture.products);
    assert.equal(proof.total,task.base**task.count+(task.add||0));
    assert.equal(replayP097CPowerChainEvidence(task,good,{sessionId,index:-1}),null);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history.push(1);},
      m=>{m.history[1]=0;},
      m=>{m.products[0]=1;},
      m=>{m.added=!m.added;},
      m=>{m.answer='0';},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP097CPowerChainEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP097CPowerChainEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
