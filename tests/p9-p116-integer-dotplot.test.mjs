import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as b20 from '../dist/learning/phase5/b20-model.js';
import {
  P116_SOURCES,
  p116IntegerDotplotBinding,
  replayP116IntegerDotplotEvidence,
  submittedP116IntegerDotplotEvidence
} from '../dist/learning/p116-integer-dotplot-evidence.js';

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en'))
      .map(key=>[key, ordered(value[key])]));
  }
  return value;
}
const cases = P116_SOURCES.map(source => {
  const {sessionId, index} = source;
  return {source, context: {sessionId, index}, task: sessionTaskFor(sessionId, index)};
});
const answersFor = index => index === 0 ? ['20','4','gap'] : ['10','5'];

function place(task, model, value) {
  model.value = String(value);
  b20.act(task, model, 'b20-dot');
}

function reviseFirst(task, model) {
  b20.act(task, model, 'b20-row', {index: '0'});
  place(task, model, task.values[0]);
}

function work({task,context}, firstValue = task.values[0]) {
  const model = b20.initial(task);
  for (const [index, value] of task.values.entries()) place(task, model, index === 0 ? firstValue : value);
  model.answers = answersFor(context.index);
  return model;
}
const replay = ({task, context}, model) => replayP116IntegerDotplotEvidence(task, model, context);

test('P116 locks both original task fingerprints, sources and complete shapes', () => {
  for (const {source, context, task} of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.equal(LESSONS[context.sessionId].topicId, source.nodeId);
    assert.equal(p116IntegerDotplotBinding(task, context)?.nodeId, source.nodeId);
    assert.equal(p116IntegerDotplotBinding({...task, given: true}, context), null);
    assert.equal(p116IntegerDotplotBinding({...task, values: [...task.values].reverse()}, context), null);
    assert.equal(p116IntegerDotplotBinding(task, {...context, index: String(context.index)}), null);
  }
});

test('P116 reconstructs revision by record and keeps exact frequency, gaps and mode', () => {
  for (const row of cases) {
    const {task,context} = row;
    const model = work(row, task.values[0]+1);
    assert.equal(b20.inspect(task, model).correct, false);
    assert.equal(replay(row, model), null);
    reviseFirst(task, model);
    assert.equal(b20.valid(task, model), true);
    assert.equal(b20.inspect(task, model).correct, true);
    model.prose = 'Learner text remains outside the mathematical evidence.';
    const before = structuredClone(model);
    const proof = replay(row, model);
    assert.equal(proof.recordCount, context.index === 0 ? 20 : 10);
    assert.deepEqual(proof.observablePlacements.at(-1), {
      eventIndex: model.history.length-1,
      recordIndex: 0,
      accepted: true,
      from: task.values[0]+1,
      to: task.values[0]
    });
    assert.equal(proof.frequencies.find(x=>x.value===3).count, context.index === 0 ? 4 : 2);
    assert.deepEqual(proof.zeroFrequencyTicks, context.index === 0 ? [7] : [0,4,6]);
    assert.deepEqual(proof.modes, [5]);
    assert.equal(proof.freeExplanationAssessed, false);
    assert.equal(Object.hasOwn(proof,'prose'), false);
    assert.deepEqual(model, before);
  }
});

test('P116 distinguishes invalid input with no effect from approximate rounding', () => {
  const row = cases[0];
  const {task} = row;
  const model = b20.initial(task);
  place(task, model, '1/2');
  assert.match(model.issue, /落点/);
  assert.equal(model.board.cursor, 0);
  for (const value of task.values) place(task, model, value);
  model.answers = answersFor(0);
  assert.equal(b20.inspect(task, model).correct, true);
  const proof = replay(row, model);
  assert.deepEqual(proof.observablePlacements[0], {eventIndex:0,recordIndex:0,accepted:false});

  const nearlyZero = work(row, '0.000000001');
  assert.equal(b20.inspect(task, nearlyZero).correct, true);
  assert.equal(replay(row, nearlyZero), null);
  const nearlyTwenty = work(row);
  nearlyTwenty.answers[0] = '20.000000001';
  assert.equal(b20.inspect(task, nearlyTwenty).correct, true);
  assert.equal(replay(row, nearlyTwenty), null);
});

test('P116 accepts exact alternative numeric spellings used by original controls', () => {
  const row = cases[1], model = work(row,'0 2/2');
  model.answers = ['20/2','5.0'];
  assert.equal(b20.inspect(row.task,model).correct, true);
  assert.equal(replay(row,model)?.recordCount,10);
});

test('P116 rejects missing, forged, oversized or unobservable histories', () => {
  const row = cases[0];
  const changes = [
    model=>{model.history=[];},
    model=>{model.history=new Array(20);},
    model=>{model.history[0].f.value='12';},
    model=>{model.history[0].d.index='0';},
    model=>{model.history[0].a='reset';},
    model=>{model.history[0].f.hidden=true;},
    model=>{model.history[0].other=true;},
    model=>{model.history=Array.from({length:501},()=>model.history[0]);},
    model=>{model.board.cursor=0;},
    model=>{model.board.placed[3]=7;},
    model=>{model.issue='not the settled original';},
    model=>{model.answers[1]='5';},
    model=>{model.answers[2]='remove';}
  ];
  for (const change of changes) {
    const model=work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P116 admits only evidence bound to the latest original Check', () => {
  for (const row of cases) {
    const wrong = work(row,row.task.values[0]+1);
    const good = structuredClone(wrong);
    reviseFirst(row.task,good);
    const attempt = model => ({value: structuredClone(model)});
    const check = (model, array) => submittedP116IntegerDotplotEvidence(row.task,model,{attempts:array},row.context);
    assert.equal(check(good,[attempt(wrong)]),null);
    assert.equal(check(good,[attempt(wrong),attempt(good)])?.recordCount,good.board.placed.length);
    assert.equal(check(good,[attempt(good),attempt(wrong)]),null);
    assert.equal(check(wrong,[attempt(wrong)]),null);
    assert.equal(check(good,[]),null);
  }
});

test('P116 source isolation excludes prefilled, fraction, practice and bridge versions', async () => {
  await ensureB39Ready();
  for(const {context,task} of cases) {
    assert.equal(p116IntegerDotplotBinding(sessionTaskFor('dotrecords',1), {sessionId:'dotrecords',index:1}),null);
    assert.equal(p116IntegerDotplotBinding(sessionTaskFor('fractiondots',0), {sessionId:'fractiondots',index:0}),null);
    assert.equal(p116IntegerDotplotBinding(task,{...context,index:-1}),null);
    assert.equal(p116IntegerDotplotBinding(sessionTaskFor('dotrecords',-1),{...context,index:-1}),null);
    for(const [sessionId, bridge] of Object.entries(BRIDGES)) {
      for(const [index, original] of bridge.tasks.entries()) {
        if(original?.type!==task.type) continue;
        assert.equal(p116IntegerDotplotBinding(original,{sessionId,index}),null);
        assert.equal(p116IntegerDotplotBinding(task,{sessionId,index}),null);
      }
    }
  }
});
