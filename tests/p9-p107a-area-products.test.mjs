import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {act, initial, inspect} from '../dist/learning/phase5/b14-model.js';
import {P107A_SOURCES, replayP107AAreaProductsEvidence, submittedP107AAreaProductsEvidence} from '../dist/learning/p107a-area-products-evidence.js';

await ensureB39Ready();
const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

function solve(task,cutA,cutB) {
  const model=initial(task);
  model.cutA=String(cutA);
  model.cutB=String(cutB);
  act(task,model,'b14-cut');
  for (const a of [cutA,task.a-cutA].filter(Boolean)) {
    for (const b of [cutB,task.b-cutB].filter(Boolean)) {
      model.part=String(a*b);
      act(task,model,'b14-part');
    }
  }
  model.answer=String(task.a*task.b);
  if (task.a===40 && task.b===60) model.base='24';
  return model;
}

const choices = {
  'largerfacts:0':[20,30], 'largerfacts:1':[7,5], 'writtenstart:0':[3,4], 'longproduct:2':[40,3],
  'decimalproduct:2':[56,7], 'mentalchoices:0':[7,8], 'combineproducts:0':[10,6], 'modelrecipe:0':[6,3],
  'translateamount:1':[20,4], 'structure39:0':[7,8],
};

for (const {sessionId,index,taskHash} of P107A_SOURCES) {
  const position=`${sessionId}:${index}`;
  test(`${position} replays each required area block`,()=>{
    const context={sessionId,index};
    const task=sessionTaskFor(sessionId,index);
    const replay=model=>replayP107AAreaProductsEvidence(task,model,context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const model=solve(task,...choices[position]);
    assert.ok(inspect(task,model).correct);
    assert.equal(replay(model)?.partialProducts.reduce((a,b)=>a+b,0),task.a*task.b);
    assert.equal(replayP107AAreaProductsEvidence(task,model,{sessionId,index:-1}),null);
    const wrong=structuredClone(model);
    wrong.answer='0';
    assert.equal(submittedP107AAreaProductsEvidence(task,model,{attempts:[{value:wrong}]},context),null);
    assert.deepEqual(submittedP107AAreaProductsEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),replay(model));
    const forged=structuredClone(model);
    forged.history[1].data.fields.part='0';
    assert.equal(replay(forged),null);
    const unsplit=solve(task,task.a,task.b);
    assert.equal(replay(unsplit),null);
    act(task,model,'b14-reset');
    assert.equal(replay(model),null);
  });
}
