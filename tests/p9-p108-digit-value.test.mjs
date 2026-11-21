import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b16-model.js';
import {
  P108_SOURCES,p108DigitValueBinding,
  replayP108DigitValueEvidence,submittedP108DigitValueEvidence
} from '../dist/learning/p108-digit-value-evidence.js';

const [source] = P108_SOURCES;
const {sessionId,index} = source;
const context = {sessionId,index};
const task = sessionTaskFor(sessionId,index);
const readings = ['7000000000','6/1000000','0','8/10000'];
const exact = [[7,9,7000000000,1],[6,-6,6,1000000],[0,-1,0,1],[8,-4,8,10000]];

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const replay = model => replayP108DigitValueEvidence(task,model,context);
const submit = (model,...snapshots) => submittedP108DigitValueEvidence(task,model,
  {attempts:snapshots.map(value => ({value:structuredClone(value)}))},context);
const select = (model,i) => original.act(task,model,'b16-digit',{index:i});
const save = (model,answer) => {
  model.answer = answer;
  original.act(task,model,'b16-digit-save');
};

function work(withFirstCard = true) {
  const model = original.initial(task);
  save(model,'7450000000');
  for (const i of [2,1,3,...(withFirstCard ? [0] : [])]) {
    select(model,i);
    save(model,readings[i]);
  }
  return model;
}

test('P108 binds the reviewed original and full source hash', () => {
  assert.equal(P108_SOURCES.length,1);
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
  assert.equal(p108DigitValueBinding(task,context)?.nodeId,source.nodeId);
  const changed = structuredClone(task);
  changed.cases[0].at = 2;
  assert.equal(p108DigitValueBinding(changed,context),null);
  assert.equal(p108DigitValueBinding({...task,prompt:'different'},context),null);
  assert.equal(p108DigitValueBinding(task,{...context,index:'0'}),null);
});

test('P108 derives integer, decimal and zero places from the exact highlighted position', () => {
  const model = work(), before = structuredClone(model);
  assert.equal(original.inspect(task,model).correct,true);
  const proof = replay(model);
  assert.deepEqual(proof.cards.map(({digit,exponent,numerator,denominator}) =>
    [digit,exponent,numerator,denominator]),exact);
  assert.deepEqual(proof.cards.map(card => card.reading.raw),readings);
  assert.equal(proof.cards[2].numeral,proof.cards[3].numeral);
  assert.notEqual(proof.cards[2].at,proof.cards[3].at);
  assert.equal(proof.actions[0].accepted,false);
  assert.deepEqual(model.board.records,[2,1,3,0]);
  assert.deepEqual(model,before);
});

test('P108 requires all real saves and a latest matching original Check', () => {
  const partial = work(false);
  assert.equal(replay(partial),null);
  const model = structuredClone(partial);
  select(model,0);
  model.answer = readings[0];
  assert.equal(replay(model),null);
  save(model,readings[0]);
  assert.equal(replay(model)?.cards.length,4);
  assert.equal(submit(model,partial),null);
  assert.equal(submit(model,partial,model)?.cards.length,4);
  assert.equal(submit(model,model,partial),null);

  model.answer = '7';
  assert.equal(original.inspect(task,model).correct,true);
  assert.equal(replay(model),null);
});

test('P108 preserves a failed new save and requires it to be corrected on the same card', () => {
  const model = work();
  select(model,3);
  save(model,'0.008');
  select(model,2);
  assert.equal(original.inspect(task,model).correct,true);
  assert.equal(replay(model),null);
  select(model,3);
  save(model,'0.0008');
  const proof = replay(model);
  assert.equal(proof.cards[3].reading.raw,'0.0008');
  assert.ok(proof.actions.some(action => action.card === 3 && action.raw === '0.008' && !action.accepted));
});

test('P108 rejects altered event payloads, forged saved cards and unsupported events', () => {
  const changes = [
    m => { m.history.length = 0; },
    m => { m.history[1].data.index = '02'; },
    m => { m.history[0].data.index = '0'; },
    m => { m.board.records[0] = 0; },
    m => { m.history[0].data.fields.answer = readings[0]; },
    m => original.act(task,m,'b16-order',{index:0})
  ];
  for (const change of changes) {
    const model = work();
    change(model);
    assert.equal(replay(model),null,change.toString());
  }
});

test('P108 excludes neighboring source positions, practice and real bridge entries', async () => {
  await ensureB39Ready();
  assert.equal(p108DigitValueBinding(task,{...context,index:1}),null);
  assert.equal(p108DigitValueBinding(task,{...context,index:-1}),null);
  assert.equal(p108DigitValueBinding(sessionTaskFor(sessionId,1),context),null);
  for (const [id,bridge] of Object.entries(BRIDGES)) {
    for (const [i,related] of bridge.tasks.entries()) {
      if (related?.type === task.type) assert.equal(p108DigitValueBinding(related,{sessionId:id,index:i}),null);
    }
    assert.equal(p108DigitValueBinding(task,{sessionId:id,index:0}),null);
  }
});
