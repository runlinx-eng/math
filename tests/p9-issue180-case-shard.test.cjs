'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { selectDiagnosticCases } = require('./helpers/p9-issue180-case-shard.cjs');

const sequence = [
  {id:'onesbridge',index:0}, {id:'onesbridge',index:1},
  {id:'tensmove',index:3}, {id:'decadetake',index:2},
  {id:'twodigitpair',index:0}, {id:'twodigitpair',index:1},
  ...Array.from({length:21}, (_,i)=>({id:'later',index:i}))
];

test('default diagnostic opt-out preserves exact original order and object identity', () => {
  assert.strictEqual(selectDiagnosticCases(sequence), sequence);
  assert.strictEqual(selectDiagnosticCases(sequence,''), sequence);
});
test('two partitions are disjoint and reconstruct the original workload in order', () => {
  const left=selectDiagnosticCases(sequence,'0'),right=selectDiagnosticCases(sequence,'1');
  assert.equal(left.length+right.length,sequence.length);
  assert.deepEqual(new Set([...left,...right]).size,sequence.length);
  assert.deepEqual(sequence.filter((_,i)=>i%2===0),left);
  assert.deepEqual(sequence.filter((_,i)=>i%2===1),right);
  assert.deepEqual(left.filter(x=>x.id==='twodigitpair').map(x=>x.index),[0]);
  assert.deepEqual(right.filter(x=>x.id==='twodigitpair').map(x=>x.index),[1]);
});
test('invalid shards cannot silently skip mathematical tests', () => {
  for (const bad of ['2','even','0,1','-1']) {
    assert.throws(()=>selectDiagnosticCases(sequence,bad),/must be unset, 0, or 1/);
  }
  assert.throws(()=>selectDiagnosticCases([],''),/nonempty/);
});
