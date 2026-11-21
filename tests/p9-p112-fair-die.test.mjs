import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b22-model.js';
import {
  P112_SOURCES, p112FairDieBinding,
  replayP112FairDieEvidence, submittedP112FairDieEvidence
} from '../dist/learning/p112-fair-die-evidence.js';

const expectedFaces = [[6], [2,4,6], [3], [1,2,4,5,6], [1,2,3,4,5], [2,3,4,5,6]];
const rows = P112_SOURCES.map((source, i) => {
  const {sessionId, index} = source;
  return {
    source,
    context:{sessionId,index},
    task:sessionTaskFor(sessionId,index),
    faces:expectedFaces[i]
  };
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key, ordered(value[key])]));
  }
  return value;
}

const replay = (row, model) => replayP112FairDieEvidence(row.task, model, row.context);
const submitted = (row, model, ...attempts) => submittedP112FairDieEvidence(row.task, model,
  {attempts:attempts.map(value => ({value:structuredClone(value)}))}, row.context);
const toggle = (row, model, face) => original.act(row.task, model, 'p22-toggle', {index:face - 1});

function work(row, wrongFace = null) {
  const model = original.initial(row.task, 58);
  if (wrongFace !== null) toggle(row, model, wrongFace);
  for (const face of [...row.faces].reverse()) toggle(row, model, face);
  model.kind = 'equal';
  model.prob = row.faces.length + '/6';
  model.answers = row.task.questions.map(q => String(q.value));
  return model;
}

test('P112 binds the six reviewed original dice positions and complete hashes', () => {
  assert.equal(rows.length, 6);
  for (const {source, task, context} of rows) {
    const hash = createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex');
    assert.equal(hash, source.taskHash);
    assert.equal(p112FairDieBinding(task, context)?.nodeId, source.nodeId);
    assert.equal(p112FairDieBinding({...task, prompt:'changed source'}, context), null);
    assert.equal(p112FairDieBinding({ ...task, winners:[0] }, context), null);
    assert.equal(p112FairDieBinding(task, {...context, index:String(context.index)}), null);
  }
});

test('P112 replays actual individual face toggles and the exact sample space', () => {
  for (const row of rows) {
    const wrongFace = [1,2,3,4,5,6].find(face => !row.faces.includes(face));
    const model = work(row, wrongFace);
    assert.equal(original.inspect(row.task, model).correct, false);
    assert.equal(replay(row, model), null);
    toggle(row, model, wrongFace);
    const before = structuredClone(model);
    assert.equal(original.inspect(row.task, model).correct, true);
    const proof = replay(row, model);
    assert.deepEqual(proof.sampleSpace, [1,2,3,4,5,6]);
    assert.deepEqual(proof.selectedFaces, row.faces);
    assert.equal(proof.favorableCount, row.faces.length);
    assert.equal(proof.sampleCount, 6);
    assert.equal(proof.actualRollAssessed, false);
    assert.deepEqual(proof.toggles, [
      {face:wrongFace, selected:true},
      ...[...row.faces].reverse().map(face => ({face, selected:true})),
      {face:wrongFace, selected:false}
    ]);
    assert.deepEqual(model, before);
  }
});

test('P112 requires the newest matching original Check after editing the selected faces', () => {
  const row = rows.at(-1);
  const wrong = work(row, 1);
  const done = structuredClone(wrong);
  toggle(row, done, 1);
  assert.equal(submitted(row, done), null);
  assert.equal(submitted(row, done, wrong), null);
  assert.equal(submitted(row, done, wrong, done)?.favorableCount, 5);
  assert.equal(submitted(row, done, done, wrong), null);
  assert.equal(submitted(row, wrong, wrong), null);
  const edited = structuredClone(done);
  toggle(row, edited, 1);
  toggle(row, edited, 1);
  assert.equal(original.inspect(row.task, edited).correct, true);
  assert.equal(submitted(row, edited, done), null);
});

test('P112 accepts equivalent exact forms and declines rounded primary or follow-up answers', () => {
  const single = rows[0], opportunity = work(single);
  for (const value of ['2/12', '0 1/6', ' 01/06 ']) {
    opportunity.prob = value;
    assert.equal(replay(single, opportunity)?.favorableCount, 1);
  }
  opportunity.prob = '0.16666667';
  assert.equal(original.inspect(single.task, opportunity).correct, true);
  assert.equal(replay(single, opportunity), null);

  const even = rows[1], parity = work(even);
  parity.prob = '0.5000000';
  assert.equal(replay(even, parity)?.favorableCount, 3);
  parity.prob = '1/3';
  assert.equal(replay(even, parity), null);

  const complement = rows[3], belowOne = work(complement);
  belowOne.answers[0] = '0.16666667';
  assert.equal(original.inspect(complement.task, belowOne).correct, true);
  assert.equal(replay(complement, belowOne), null);
  belowOne.answers[0] = '2/12';
  assert.equal(replay(complement, belowOne)?.favorableCount, 5);
});

test('P112 excludes overlap counted twice and unsupported or forged selection events', () => {
  const row = rows.at(-1), correct = work(row);
  const changes = [
    m => { m.answers[2] = 'twice'; },
    m => { m.board.selected.push(1); },
    m => { m.history.length = 0; },
    m => { m.history[0].d.index = '10/2'; },
    m => { m.history[0].unverified = true; },
    m => original.act(row.task, m, 'p22-group')
  ];
  for (const change of changes) {
    const model = structuredClone(correct);
    change(model);
    assert.equal(replay(row, model), null, change.toString());
  }
});

test('P112 declines other likelihood tasks, original practice and same-type bridges', async () => {
  await ensureB39Ready();
  for (const {task, context} of rows) {
    assert.equal(p112FairDieBinding(task, {...context,index:-1}), null);
    assert.equal(p112FairDieBinding(task, {sessionId:'trialcompare',index:2}), null);
    assert.equal(p112FairDieBinding(sessionTaskFor('trialcompare',2), context), null);
    for (const [sessionId, bridge] of Object.entries(BRIDGES)) {
      for (const [index, related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p112FairDieBinding(related,{sessionId,index}), null);
      }
      assert.equal(p112FairDieBinding(task,{sessionId,index:0}), null);
    }
  }
});
