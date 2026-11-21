import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,initial,solveSteps} from '../dist/learning/phase5/b37-model.js';
import {P049_SOURCES,p049RatioSmallestBasketBinding,replayP049RatioSmallestBasketEvidence,submittedP049RatioSmallestBasketEvidence} from '../dist/learning/p049-ratio-smallest-basket-evidence.js';

const [source]=P049_SOURCES;
const {sessionId,index}=source, context={sessionId,index}, task=sessionTaskFor(sessionId,index);
const replay=model=>replayP049RatioSmallestBasketEvidence(task,model,context);

test('P049 locks the original native position and rejects practice',()=>{
  const ordered=v=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'
    ?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])):v;
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
  assert.ok(p049RatioSmallestBasketBinding(task,context));
  assert.equal(p049RatioSmallestBasketBinding(task,{sessionId,index:-1}),null);
});

test('P049 checks the required steps, a correction, and freshness of the latest Check',()=>{
  const model=initial(task);
  model["value"]="8";
  act(task,model,'r37-step');
  assert.equal(replay(model),null);
  const failed=structuredClone(model);
  for (const step of solveSteps(task)) {
    if (step.field) model[step.field]=step.value;
    else act(task,model,step.action,step.data);
  }
  const proof=replay(model);
  assert.deepEqual(proof?.expected,[9, 6, 12, 4]);
  assert.equal(proof.records[0].correct,false);
  assert.equal(submittedP049RatioSmallestBasketEvidence(task,model,{attempts:[{value:failed}]},context),null);
  assert.ok(submittedP049RatioSmallestBasketEvidence(task,model,{attempts:[{value:model}]},context));
  model.history[0].i='0';
  assert.equal(replay(model),null);
});
