import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const data=JSON.parse(fs.readFileSync('docs/spatial-learning/relation-evidence-index.json'));

test('every source relation has traceable endpoint tasks, with joint tasks kept separate',()=>{
  const summary=JSON.parse(execFileSync('node',['scripts/build_relation_evidence_index.mjs','--check'],{encoding:'utf8'}));
  assert.equal(summary.edges,1223);assert.equal(summary.nodeTasks,1996);assert.equal(summary.jointTasks,1552);
  for(const e of data.edges){
    assert.ok(e.fromTasks.length&&e.toTasks.length);
    for(const key of [...e.fromTasks,...e.toTasks,...e.jointTasks])assert.ok(data.tasks[key],key);
  }
});

test('a candidate or an existing joint task does not automatically become a reviewed relation',()=>{
  assert.equal(data.edges.filter(e=>e.localReview).length,9);
  assert.equal(data.edges.filter(e=>e.localReview?.classification==='insufficient').length,2);
  assert.equal(data.edges.filter(e=>!e.localReview).length,1214);
  assert.ok(data.edges.every(e=>e.independentMathematicalReview==='pending'));
});
