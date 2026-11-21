import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,initial,solveSteps} from '../dist/learning/phase5/b37-model.js';
import {P050_SOURCES,p050DrawingAreaScaleBinding,replayP050DrawingAreaScaleEvidence,submittedP050DrawingAreaScaleEvidence} from '../dist/learning/p050-drawing-area-scale-evidence.js';

const [source]=P050_SOURCES;
const {sessionId,index}=source, context={sessionId,index}, task=sessionTaskFor(sessionId,index);
const replay=model=>replayP050DrawingAreaScaleEvidence(task,model,context);

test('P050 locks the original native position and rejects practice',()=>{
  const ordered=v=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'
    ?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])):v;
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
  assert.ok(p050DrawingAreaScaleBinding(task,context));
  assert.equal(p050DrawingAreaScaleBinding(task,{sessionId,index:-1}),null);
});

test('P050 checks the required steps, a correction, and freshness of the latest Check',()=>{
  const model=initial(task);
  model["value"]="50";
  act(task,model,'r37-step');
  assert.equal(replay(model),null);
  const failed=structuredClone(model);
  for (const step of solveSteps(task)) {
    if (step.field) model[step.field]=step.value;
    else act(task,model,step.action,step.data);
  }
  const proof=replay(model);
  assert.deepEqual(proof?.expected,[6*50/100,4*50/100,(6*50/100)*(4*50/100),50*50]);
  assert.equal(proof.records[0].correct,false);
  assert.equal(submittedP050DrawingAreaScaleEvidence(task,model,{attempts:[{value:failed}]},context),null);
  assert.ok(submittedP050DrawingAreaScaleEvidence(task,model,{attempts:[{value:model}]},context));
  model.history[0].i='0';
  assert.equal(replay(model),null);
});
