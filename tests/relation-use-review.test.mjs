import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TASKS} from '../dist/learning/tasks.js';
import {BRIDGES} from '../dist/learning/bridges.js';
import {validateRelationReviews,codeHashes} from '../scripts/check_relation_use_reviews.mjs';
const review=JSON.parse(fs.readFileSync('docs/spatial-learning/relation-use-review.json'));
const inventory=JSON.parse(fs.readFileSync('docs/spatial-learning/inventory.json'));
const code=codeHashes();
const check=r=>validateRelationReviews(r,inventory,TASKS,BRIDGES,code);

test('local relation-use findings point to source edges and actual endpoint or joint tasks',()=>{
  assert.deepEqual(check(review),{sourceEdges:1223,reviewed:9,unreviewed:1214,'joint-limited':3,'endpoint-limited':4,insufficient:2,independentMathematicalReview:'pending'});
});
test('changed or unbound evidence cannot silently remain reviewed',()=>{
  const changed=structuredClone(review);changed.records[0].evidence[0].sha256='0'.repeat(64);assert.throws(()=>check(changed),/task changed/);
  const unbound=structuredClone(review);unbound.records[0].evidence[0].key='tools39:2';assert.throws(()=>check(unbound),/unbound task/);
  const duplicate=structuredClone(review);duplicate.records.push(structuredClone(duplicate.records[0]));assert.throws(()=>check(duplicate),/duplicate review/);
});
test('source and implementation changes require the local evidence to be reconsidered',()=>{
  const changed=structuredClone(inventory),edge=changed.edges.find(e=>e.from===review.records[0].from&&e.to===review.records[0].to);edge.sourceReason+=' changed';
  assert.throws(()=>validateRelationReviews(review,changed,TASKS,BRIDGES,code),/source changed/);
  const codeChanged={...code,'dist/learning/phase5/b17-model.js':'0'.repeat(64)};
  assert.throws(()=>validateRelationReviews(review,inventory,TASKS,BRIDGES,codeChanged),/implementation changed/);
});
