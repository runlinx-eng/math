import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b14-model.js';
import {
  P105_SOURCES,p105PrimeDivisorsBinding,
  replayP105PrimeDivisorsEvidence,submittedP105PrimeDivisorsEvidence
} from '../dist/learning/p105-prime-divisors-evidence.js';

const facts = [
  {divisors:[1],factors:[1],classification:'neither'},
  {divisors:[1],factors:[1,2],classification:'prime'},
  {divisors:[1,2,3,4,5,6,7],factors:[1,3,17,51],classification:'composite'}
];
const rows = P105_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),...facts[i]};
});

const replay = (row,model) => replayP105PrimeDivisorsEvidence(row.task,model,row.context);
const submitted = (row,model,...versions) => submittedP105PrimeDivisorsEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function trial(row,model,divisor,remainder = row.task.ns[0] % Number(divisor),data = {side:0}) {
  model.candidate = String(divisor);
  model.remainder = String(remainder);
  original.act(row.task,model,'b14-test',data);
}

function work(row,divisors = row.divisors) {
  const model = original.initial(row.task);
  trial(row,model,0,'0');
  trial(row,model,1,'1');
  for (const d of [...divisors].reverse()) trial(row,model,d);
  model.answer = row.classification;
  return model;
}

test('P105 binds the full immutable source for all three positions', () => {
  assert.equal(rows.length,3);
  for (const {source,task,context} of rows) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p105PrimeDivisorsBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p105PrimeDivisorsBinding({...task,ns:[97]},context),null);
    assert.equal(p105PrimeDivisorsBinding({...task,mode:'divisible'},context),null);
    assert.equal(p105PrimeDivisorsBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P105 replays the complete square-root range and reconstructs distinct factor pairs', () => {
  for (const row of rows) {
    const model = work(row), before = structuredClone(model);
    assert.ok(original.inspect(row.task,model).correct);
    const proof = replay(row,model);
    assert.deepEqual(proof.checkedDivisors,row.divisors);
    assert.deepEqual(proof.factors,row.factors);
    assert.equal(proof.classification,row.classification);
    assert.deepEqual(proof.attempts.slice(0,2).map(event => event.reason),['outside-range','wrong-remainder']);
    for (const attempt of proof.attempts.filter(event => event.accepted)) {
      assert.equal(attempt.divisor * attempt.quotient + attempt.remainder,proof.value);
    }
    assert.deepEqual(model,before);
  }
});

test('P105 distinguishes the single factor of 1, the prime 2 and the complementary factor 17', () => {
  const [one,two,odd] = rows;
  assert.equal(replay(one,work(one)).factors.length,1);
  assert.equal(replay(two,work(two)).factors.length,2);
  const model = work(odd);
  assert.equal(replay(odd,model).attempts.find(item => item.divisor === 3 && item.accepted).quotient,17);
  trial(odd,model,'03.0','0.0');
  const proof = replay(odd,model);
  assert.equal(proof.attempts.at(-1).reason,'duplicate');
  assert.equal(proof.factors.length,4);
});

test('P105 requires the latest original Check on a complete and correctly classified work', () => {
  const row = rows[2];
  assert.equal(replay(row,work(row,[1,2,3,4,5,6])),null);
  const model = work(row);
  model.answer = 'prime';
  const wrong = structuredClone(model);
  assert.equal(replay(row,wrong),null);
  model.answer = 'composite';
  assert.equal(submitted(row,model,wrong),null);
  assert.equal(submitted(row,model,wrong,model)?.classification,'composite');
  assert.equal(submitted(row,model,model,wrong),null);
  model.remainder = '1';
  assert.equal(original.inspect(row.task,model).correct,true);
  assert.equal(replay(row,model),null);
});

test('P105 rejects forged divisors, hidden action coordinates and an uncorrected wrong remainder', () => {
  const row = rows[2], changes = [
    m => { m.history.length = 0; },
    m => { m.history.at(-1).data.fields.remainder = '1'; },
    m => { m.board.tests[0][0].d = 8; },
    m => trial(row,m,2,1,{side:0,index:0}),
    m => trial(row,m,3,1),
    m => original.act(row.task,m,'b14-select',{value:3})
  ];
  for (const change of changes) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P105 excludes the other native modes, practice and real bridge contexts', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p105PrimeDivisorsBinding(task,{...context,index:-1}),null);
    assert.equal(p105PrimeDivisorsBinding(task,{...context,index:3}),null);
    assert.equal(p105PrimeDivisorsBinding(sessionTaskFor('factorlab',5),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p105PrimeDivisorsBinding(related,{sessionId,index}),null);
      }
    }
  }
});
