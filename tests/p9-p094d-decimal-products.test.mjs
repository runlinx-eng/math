import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b15-model.js';
import {P094D_SOURCES, replayP094DDecimalProductsEvidence, submittedP094DDecimalProductsEvidence} from '../dist/learning/p094d-decimal-products-evidence.js';

for (const {sessionId,index,taskHash} of P094D_SOURCES) {
  test(`${sessionId}:${index} replays carrying and exact decimal conversion`,()=>{
    const context={sessionId,index};
    const task=sessionTaskFor(sessionId,index);
    const replay=model=>replayP094DDecimalProductsEvidence(task,model,context);
    const ordered=Object.fromEntries(Object.entries(task).sort(([a],[b])=>a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),taskHash);
    const model=example(task);
    assert.ok(inspect(task,model).correct);
    const result=replay(model);
    assert.deepEqual(result.result,sessionId==='mentalchoices'?{numerator:260,denominator:10}:{numerator:1000,denominator:100});
    assert.equal(replayP094DDecimalProductsEvidence(task,model,{sessionId,index:-1}),null);
    const wrong=structuredClone(model);
    wrong.answer=String(result.productInSmallUnits);
    assert.equal(replay(wrong),null);
    assert.equal(submittedP094DDecimalProductsEvidence(task,model,{attempts:[{value:wrong}]},context),null);
    assert.deepEqual(submittedP094DDecimalProductsEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),result);
    const tampered=structuredClone(model);
    tampered.inner.history.find(event=>event.action==='b14-trade').action='b14-estimate';
    assert.equal(replay(tampered),null);
    act(task,model,'b15-reset');
    assert.equal(replay(model),null);
  });
}
