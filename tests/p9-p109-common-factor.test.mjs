import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b35-model.js';
import {
  P109_SOURCES, p109CommonFactorBinding,
  replayP109CommonFactorEvidence, submittedP109CommonFactorEvidence
} from '../dist/learning/p109-common-factor-evidence.js';

const expected = [
  {correct:[3,'1',2,3], smaller:[1,'1',6,9], terms:[[6,1],[9,0]]},
  {correct:[6,'1',2,-3], smaller:[1,'1',12,-18], terms:[[12,1],[-18,0]]},
  {correct:[4,'x',2,3], smaller:[2,'x',4,6], terms:[[8,2],[12,1]]}
];
const rows = P109_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),...expected[i]};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const replay = (row,model) => replayP109CommonFactorEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP109CommonFactorEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);
const expandedPairs = result => result.expanded.map(({coefficient,degree}) => [coefficient,degree]);

function fields(model,values) {
  [model.value,model.second,model.third,model.fourth] = values.map(String);
}

function expand(row,model,values) {
  fields(model,values);
  original.act(row.task,model,'a35-factor');
}

function done(row) {
  const model = original.initial(row.task);
  expand(row,model,row.correct);
  return model;
}

test('P109 binds all three actual source positions and entire source hashes', () => {
  assert.equal(rows.length,3);
  for (const {source,task,context} of rows) {
    const hash = createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex');
    assert.equal(hash,source.taskHash);
    assert.equal(p109CommonFactorBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p109CommonFactorBinding({...task,display:'x+1'},context),null);
    assert.equal(p109CommonFactorBinding({...task,terms:[...task.terms].reverse()},context),null);
    assert.equal(p109CommonFactorBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P109 requires the maximal factor even when a smaller one expands correctly', () => {
  for (const row of rows) {
    const model = original.initial(row.task);
    expand(row,model,[0,row.correct[1],0,0]);
    expand(row,model,row.smaller);
    assert.equal(original.inspect(row.task,model).correct,false);
    assert.equal(replay(row,model),null);
    expand(row,model,row.correct);
    assert.equal(original.inspect(row.task,model).correct,true);
    const before = structuredClone(model);
    const proof = replay(row,model);
    assert.equal(proof.greatestFactor.coefficient,row.correct[0]);
    assert.equal(proof.greatestFactor.degree,row.correct[1] === 'x' ? 1 : 0);
    assert.equal(proof.attempts[0].recorded,false);
    assert.equal(proof.attempts[1].restoresOriginal,true);
    assert.equal(proof.attempts[1].maximum,false);
    assert.deepEqual(expandedPairs(proof.attempts[1]),row.terms);
    assert.equal(proof.expansion.accepted,true);
    assert.deepEqual(expandedPairs(proof.expansion),row.terms);
    assert.deepEqual(model,before);
  }
});

test('P109 distinguishes the negative constant, common x and valid signed input spellings', () => {
  const signed = rows[1], signedModel = original.initial(signed.task);
  expand(signed,signedModel,[6,'1',2,3]);
  assert.equal(replay(signed,signedModel),null);
  expand(signed,signedModel,[' +006 ','1','+02','-03']);
  assert.deepEqual(expandedPairs(replay(signed,signedModel).expansion),[[12,1],[-18,0]]);

  const withX = rows[2], xModel = original.initial(withX.task);
  expand(withX,xModel,[4,'1',2,3]);
  assert.equal(replay(withX,xModel),null);
  expand(withX,xModel,[4,'x',2,3]);
  const proof = replay(withX,xModel);
  assert.deepEqual(expandedPairs(proof.attempts[0]),[[8,1],[12,0]]);
  assert.deepEqual(expandedPairs(proof.expansion),[[8,2],[12,1]]);
});

test('P109 requires a new real expansion and Check after edits', () => {
  const row = rows[0], wrong = original.initial(row.task);
  expand(row,wrong,row.smaller);
  const model = structuredClone(wrong);
  fields(model,row.correct);
  assert.equal(replay(row,model),null);
  expand(row,model,row.correct);
  assert.equal(submit(row,model,wrong),null);
  assert.equal(submit(row,model,wrong,model)?.expansion.accepted,true);
  assert.equal(submit(row,model,model,wrong),null);
  fields(model,['03','1',2,3]);
  assert.equal(replay(row,model),null);
});

test('P109 rejects forged or unsupported events and removes no retained attempts', () => {
  const row = rows[2];
  const changes = [
    m => { m.history.length = 0; },
    m => { m.history[0].i = '2'; },
    m => { m.history[0].unverified = true; },
    m => { m.board.trials[0].restored[0].c = 2; },
    m => original.act(row.task,m,'a35-walk',{index:2}),
    m => expand(row,m,['1.5','x',2,3])
  ];
  for (const change of changes) {
    const model = done(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P109 excludes different expansion, bridged and practice positions', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p109CommonFactorBinding(task,{...context,index:-1}),null);
    assert.equal(p109CommonFactorBinding(task,{sessionId:'expand35',index:0}),null);
    assert.equal(p109CommonFactorBinding(sessionTaskFor('expand35',0),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p109CommonFactorBinding(related,{sessionId,index}),null);
      }
      assert.equal(p109CommonFactorBinding(task,{sessionId,index:0}),null);
    }
  }
});
