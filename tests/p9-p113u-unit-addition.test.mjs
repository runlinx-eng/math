import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b10-model.js';
import {P113U_SOURCES, replayP113UUnitAdditionEvidence, submittedP113UUnitAdditionEvidence} from '../dist/learning/p113u-unit-addition-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId,index,taskHash} of P113U_SOURCES) {
  test(`${sessionId}:${index} replays the saved units and regrouping`,()=>{
    const context={sessionId,index};
    const task=sessionTaskFor(sessionId,index);
    const replay=model=>replayP113UUnitAdditionEvidence(task,model,context);
    const model=example(task);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    assert.ok(inspect(task,model).correct);
    assert.equal(replay(model)?.total,task.start+task.amount);
    assert.equal(replayP113UUnitAdditionEvidence(task,model,{sessionId,index:-1}),null);
    const wrong=structuredClone(model);
    wrong.equation='1+1=2';
    assert.equal(submittedP113UUnitAdditionEvidence(task,model,{attempts:[{value:wrong}]},context),null);
    assert.deepEqual(submittedP113UUnitAdditionEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),replay(model));
    const tampered=structuredClone(model);
    tampered.history[0].tens++;
    assert.equal(replay(tampered),null);
    const empty=structuredClone(model);
    empty.history=[];
    assert.ok(inspect(task,empty).correct);
    assert.equal(replay(empty),null);
  });
}
