import test from 'node:test';
import assert from 'node:assert/strict';
import {example, valid, inspect, total, plausible} from '../dist/learning/phase5/b11-model.js';

test('place exchanges conserve exact integer units across varied sizes and decimal displays', () => {
  let seed = 271828;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  for (let i = 0; i < 150; i++) {
    const a = random() % 1000000, b = random() % 1000000;
    for (const op of ['+', '-']) {
      const values = op === '+' ? [a, b] : [Math.max(a, b), Math.min(a, b)];
      const t = {type: 'x-placecalc', values, op, scale: i % 2 ? 100 : 1};
      const m = example(t);
      assert.ok(valid(t, JSON.parse(JSON.stringify(m))));
      assert.ok(inspect(t, m).correct);
      assert.equal(total(m.counts), op === '+' ? a + b : Math.abs(a - b));
      assert.ok(m.counts.every(n => n >= 0 && n < 10));
    }
  }
});

test('rounding feasibility always includes the true sum and difference, including zero and ties', () => {
  const numbers = [0, 1, 4, 5, 9, 10, 49, 50, 99, 100, 499, 500, 999, 1000, 47832, 23156];
  for (const a of numbers) for (const b of numbers) for (const u of [10, 100, 1000]) {
    assert.ok(plausible({a, b, op: '+'}, u, a + b));
    assert.ok(plausible({a, b, op: '-'}, u, a - b));
  }
});
