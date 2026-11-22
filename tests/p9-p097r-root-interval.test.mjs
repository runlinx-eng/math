import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example,inspect} from '../dist/learning/phase5/b09-model.js';
import {P097R_SOURCES,replayP097RRootIntervalEvidence,submittedP097RRootIntervalEvidence} from '../dist/learning/p097r-root-interval-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

test('powerblocks:8 replays kept and rejected intervals and bounds the rounded value',()=>{
  const {sessionId,index,taskHash}=P097R_SOURCES[0];
  const context={sessionId,index};
  const task=sessionTaskFor(sessionId,index);
  const good=example(task);
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
  good.trials.unshift({a:'1.6',b:'1.8',kept:false});
  assert.ok(inspect(task,good).correct);
  const replay=model=>replayP097RRootIntervalEvidence(task,model,context);
  const proof=replay(good);
  assert.deepEqual(proof?.interval,{a:[707,500],b:[14143,10000]});
  assert.equal(proof.kept,3);
  assert.equal(proof.attempted,4);
  assert.equal(replayP097RRootIntervalEvidence(task,good,{sessionId,index:-1}),null);
  const edits=[
    model=>{model.trials=[];},
    model=>{model.trials[0].kept=true;},
    model=>{model.trials[0].a='no endpoint';},
    model=>{model.trials.reverse();},
    model=>{model.windows[2].b=[7071,5000];},
    model=>{model.relation='equal';},
    model=>{model.decimal='1.415';},
    model=>{model.exact='1.414';},
  ];
  for (const edit of edits) {
    const wrong=structuredClone(good);
    edit(wrong);
    assert.equal(replay(wrong),null);
    assert.equal(submittedP097RRootIntervalEvidence(task,good,{attempts:[{value:wrong}]},context),null);
  }
  assert.deepEqual(submittedP097RRootIntervalEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
});
