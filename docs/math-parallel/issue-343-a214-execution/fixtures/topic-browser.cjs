'use strict';
module.exports = async ({entry}) => {
  const family = process.env.A214_TOPIC;
  const evidence = await entry('dist/learning/a214-' + family + '-evidence.js');
  const comparison = (a, b) => a > b ? 'higher' : a < b ? 'lower' : 'same';
  function target(source, wrong, correct) {
    return {source, submitted: evidence.submitted, wrong, correct};
  }
  const relative = (a, b) => a > b ? '>' : a < b ? '<' : '=';
  let make, prerequisite;
  switch (family) {
    case 'fraction-line': {
      make = source => target(source, async (ui, t) => {
        await ui.field('parts', t.d);
        for (let i = 0; i < t.n; i++) await ui.act('jump');
        await ui.field('n', t.n);
        await ui.field('d', t.end === 0.1 ? 100 : t.d);
        await ui.field('unitDen', t.end === 0.1 ? 10 : t.d + 1);
      }, async (ui, t) => { await ui.field('unitDen', t.end === 0.1 ? 100 : t.d); });
      prerequisite = async (ui, t) => {
        if (t.type === 'x-fgroups') {
          const groupSize = t.count / t.groups;
          for (let g = 0; g < t.groups; g++) {
            await ui.act('group-select', {index: g});
            for (let i = g * groupSize; i < (g + 1) * groupSize; i++) await ui.act('group-token', {index: i});
          }
          await ui.act('take-group', {index: 0});
          await ui.field('answer', groupSize);
        } else if (t.type === 'x-fraction') {
          await ui.field('den', t.d);
          for (let i = 0; i < t.n; i++) await ui.act('fraction-cell', {index: i});
          await ui.field('n', t.n);
          await ui.field('d', t.d);
        } else {
          await ui.field('parts', 10);
          for (let i = 3; i < 12; i++) await ui.act('count-hundred');
          await ui.field('den', 100);
          await ui.field('final', 12);
        }
      };
      break;
    }
    case 'scaling': {
      const direction = t => t.n < t.d ? 'shorter' : 'longer';
      make = source => target(source, async (ui, t) => {
        await ui.field('n', t.n);
        await ui.field('d', t.d);
        await ui.field('prediction', t.n < t.d ? 'longer' : 'shorter');
        await ui.act('scale-try');
        await ui.field('reason', t.n < t.d ? 'below' : 'above');
      }, async (ui, t) => {
        await ui.field('prediction', direction(t));
        await ui.act('scale-try');
      });
      break;
    }
    case 'distance-zero': {
      make = source => target(source, async (ui, t) => {
        for (const [index, value] of t.values.entries()) {
          const key = 'positions.' + index;
          if (value === 0) await ui.field(key, 25);
          await ui.field(key, value * 100);
          await ui.act('distance-trace', {index});
          await ui.field('answers.' + index, index === 0 ? value : Math.abs(value));
        }
        if (t.compare) {
          await ui.field('numberRelation', relative(t.values[0], t.values[1]));
          await ui.field('distanceRelation', relative(Math.abs(t.values[0]), Math.abs(t.values[1])));
        }
      }, async (ui, t) => { await ui.field('answers.0', Math.abs(t.values[0])); });
      break;
    }
    case 'equal-balance': {
      make = source => target(source, async (ui, t) => {
        for (const [side, count] of [['left', t.l], ['right', t.r]]) {
          for (let i = 0; i < count; i++) await ui.act('balance-add', {side, delta: 1});
        }
        await ui.field('guess', 'right');
        await ui.act('balance-release');
        await ui.field('symbol', 'equal');
      }, async ui => {
        await ui.field('guess', 'level');
        await ui.act('balance-release');
      });
      break;
    }
    case 'standard-form': {
      make = source => target(source, async ui => {
        for (const index of [1, 0, 2]) await ui.act('wide-order', {index});
        for (const [index, value] of ['720000', '5800000', '0.00072'].entries()) await ui.field('answers.' + index, value);
      }, async ui => {
        for (const index of [1, 0, 2, 2, 0, 1]) await ui.act('wide-order', {index});
      });
      const b08 = await entry('dist/learning/phase5/b08-model.js');
      prerequisite = async (ui, t) => {
        const ready = b08.example(t);
        await ui.field('guess', ready.guess);
        await ui.act('wide-predict');
        for (const delta of ready.trace) await ui.act('wide-move', {delta});
        await ui.field('answer', ready.answer);
        if (t.mode === 'scientific') await ui.field('exponent', ready.exponent);
        else {
          await ui.field('factor', ready.factor);
          await ui.field('direction', ready.direction);
        }
      };
      break;
    }
    case 'parity-pairs': {
      async function pair(ui, t) {
        for (let index = 0; index + 1 < t.n; index += 2) {
          await ui.act('pv-pair', {index});
          await ui.act('pv-pair', {index: index + 1});
        }
      }
      async function fields(ui, t) {
        const pairs = Math.floor(t.n / 2);
        await ui.field('pairsCount', pairs);
        await ui.field('leftover', t.n % 2);
        if (t.equation) {
          for (let i = 0; i < pairs; i++) await ui.field('counts.' + i, (i + 1) * 2);
          await ui.field('a', pairs);
          await ui.field('b', pairs);
        }
      }
      const kind = t => t.n % 2 ? 'odd' : 'even';
      make = source => target(source, async (ui, t) => {
        await pair(ui, t);
        await fields(ui, t);
        await ui.field('kind', kind(t) === 'odd' ? 'even' : 'odd');
      }, async (ui, t) => { await ui.field('kind', kind(t)); });
      prerequisite = async (ui, t) => {
        await fields(ui, t);
        await ui.field('kind', kind(t));
      };
      break;
    }
    case 'paired-counts': {
      make = source => target(source, async (ui, t) => {
        for (let index = 0; index < Math.min(t.a, t.b); index++) {
          await ui.act('pair-a', {index});
          await ui.act('pair-b', {index});
        }
        await ui.field('a', t.a);
        await ui.field('b', t.b);
        if (t.c) {
          const counts = [t.a, t.b, t.c];
          await ui.field('most', counts.indexOf(Math.max(...counts)));
          await ui.field('least', counts.indexOf(Math.min(...counts)));
        }
        await ui.field('relation', t.a === t.b ? 'fewer' : 'equal');
      }, async (ui, t) => {
        await ui.field('relation', t.a > t.b ? 'more' : t.a < t.b ? 'fewer' : 'equal');
      });
      break;
    }
    case 'chance-draws': {
      make = source => {
        let outcome;
        return target(source, async (ui, t) => {
          const expected = Math.floor(t.count / 3);
          let firstColor = 0;
          await ui.field('guess', expected);
          for (let i = 0; i < t.count; i++) {
            await ui.act('experiment-draw');
            const label = await ui.read('#work .x-draw-result');
            const index = t.labels.indexOf(label);
            if (index < 0) throw new Error('Unknown original draw: ' + label);
            firstColor += Number(index === 0);
            await ui.act('experiment-tally', {index, delta: 1});
          }
          outcome = comparison(firstColor, expected);
          await ui.field('comparison', outcome === 'same' ? 'higher' : 'same');
        }, async ui => { await ui.field('comparison', outcome); });
      };
      break;
    }
    case 'chance-spinner': {
      make = source => target(source, async (ui, t) => {
        for (let index = 0; index < t.sectors; index++) {
          const color = t.target === 'equal' ? index % t.colors : index === 0 ? 0 : 1;
          await ui.act('spinner-color', {index: color});
          await ui.act('spinner-sector', {index});
        }
        await ui.field('prediction', t.target === 'equal' ? 'unequal' : 'equal');
        await ui.field('why', 'area');
        await ui.act('spinner-run');
      }, async (ui, t) => {
        await ui.field('prediction', t.target);
        await ui.act('spinner-run');
      });
      break;
    }
    case 'chance-simulation': {
      make = source => target(source, async ui => {
        for (const size of ['10', '100', '1000']) {
          await ui.field('sample', size);
          for (let round = 0; round < 5; round++) await ui.act('simulate');
        }
        await ui.field('trend', 'usually');
        await ui.field('guarantee', 'yes');
      }, async ui => { await ui.field('guarantee', 'no'); });
      break;
    }
    case 'count-from-start': {
      const from = t => t.op === '+' ? Math.max(t.a, t.b) : t.a;
      make = source => target(source, async (ui, t) => {
        await ui.field('start', from(t));
        await ui.field('next', from(t));
        await ui.act('steps-next');
      }, async (ui, t) => {
        const count = t.op === '+' ? Math.min(t.a, t.b) : t.b;
        const direction = t.op === '+' ? 1 : -1;
        await ui.act('steps-undo');
        for (let i = 1; i <= count; i++) {
          await ui.field('next', from(t) + direction * i);
          await ui.act('steps-next');
        }
        await ui.field('equation', t.a + t.op + t.b + '=' + (from(t) + direction * count));
      });
      prerequisite = async (ui, t) => {
        for (const [group, n] of [['left', t.a], ['right', t.b]]) {
          for (let i = 0; i < n; i++) await ui.act('story-counter', {group, delta: 1});
        }
        const answer = t.a + t.b;
        await ui.field('guess', answer);
        await ui.field('op', '+');
        await ui.act('story-do');
        await ui.field('equation', t.a + '+' + t.b + '=' + answer);
        if (t.swap) {
          await ui.act('story-swap');
          await ui.field('otherEquation', t.b + '+' + t.a + '=' + answer);
        }
      };
      break;
    }
    case 'sorting-counts': {
      make = source => target(source, async (ui, t) => {
        const assignment = t.items.map(item => item[t.rule]);
        const counts = t.labels.map((_, i) => assignment.filter(category => category === i).length);
        for (let category = 0; category < counts.length; category++) {
          await ui.act('sort-bin', {index: category});
          for (const [id, want] of assignment.entries()) {
            if (category === (id === 0 ? (want + 1) % counts.length : want)) await ui.act('sort-item', {index: id});
          }
          await ui.field('counts.' + category, counts[category]);
        }
        await ui.field('most', counts.indexOf(Math.max(...counts)));
        await ui.field('fewest', counts.indexOf(Math.min(...counts)));
        if (t.ordered) {
          const order = counts.map((_, i) => i).sort((a, b) => counts[b] - counts[a]);
          for (const index of order) await ui.act('sort-order', {index});
        }
      }, async (ui, t) => {
        await ui.act('sort-bin', {index: t.items[0][t.rule]});
        await ui.act('sort-item', {index: 0});
      });
      break;
    }
    case 'parity-argument': {
      make = source => target(source, async ui => {
        await ui.act('join-pairs');
        await ui.field('a', 3);
        await ui.field('b', 4);
        await ui.act('join-pairs');
        for (const value of ['paired', 'join', 'none', 'even']) await ui.act('proof-step', {value});
        await ui.field('counterA', 2);
        await ui.field('counterB', 4);
        await ui.act('counter-build');
      }, async ui => {
        await ui.field('counterB', 3);
        await ui.act('counter-build');
      });
      prerequisite = async (ui, t) => {
        await ui.act('join-units');
        await ui.act('exchange');
        await ui.field('total', 45);
        if (t.error) await ui.field('reason', 'exchange');
      };
      break;
    }
    case 'discrete-bundles': {
      make = source => target(source, async (ui, t) => {
        for (let index = t.n - 1; index >= t.n - t.size; index--) await ui.act('bundle-pick', {index});
        await ui.act('bundle-wrap');
        const groups = Math.floor(t.n / t.size);
        for (let i = 1; i < groups; i++) await ui.act('bundle-repeat');
        await ui.field('groupsCount', groups);
        await ui.field('remainder', t.n % t.size);
        await ui.field('total', t.n - 1);
        if (t.reason) await ui.field('why', 'units');
      }, async (ui, t) => {
        await ui.field('total', t.n);
      });
      break;
    }
    case 'decimal-representations': {
      make = source => target(source, async (ui, t) => {
        await ui.field('ones', Math.floor(t.cents / 100));
        const remainder = t.cents % 100;
        for (let i = 0; i < Math.floor(remainder / 10); i++) await ui.act('dec-row');
        for (let index = Math.floor(remainder / 10) * 10; index < remainder; index++) await ui.act('dec-cell', {index});
        await ui.field('digits.0', Math.floor(t.cents / 100));
        await ui.field('digits.1', Math.floor(remainder / 10));
        await ui.field('digits.2', remainder % 10);
        await ui.field('decimal', (t.cents / 100).toFixed(2));
        await ui.field('fraction', t.cents + '/100');
        await ui.field('percent', remainder);
        if (t.cents === remainder) await ui.field('percent', remainder - 1);
      }, async (ui, t) => {
        await ui.field('percent', t.cents);
      });
      break;
    }
    case 'pond-estimate': {
      const exactTiles = [1, 2, 3, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 19, 20, 21, 22, 27];
      make = source => target(source, async ui => {
        for (const index of [0, ...exactTiles.slice(1)]) await ui.act('tile', {index});
        await ui.field('total', exactTiles.length);
        await ui.field('unit', 'cm²');
      }, async ui => {
        await ui.act('tile', {index: 0});
        await ui.act('tile', {index: exactTiles[0]});
      });
      prerequisite = async (ui, t) => {
        const h = t.draw ? t.targetArea / t.w : t.h;
        if (t.draw) await ui.field('h', h);
        await ui.field('total', t.w * h);
        await ui.field('unit', t.unit + '²');
        await ui.field('perimeter', (t.w + h) * 2);
        await ui.field('borderUnit', t.unit);
      };
      break;
    }
    case 'integer-card-axis': {
      const b07 = await entry('dist/learning/phase5/b07-model.js');
      make = source => target(source, async (ui, t) => {
        const order = t.values.map((_, i) => i).sort((a, b) => t.values[a] - t.values[b]);
        for (const index of order) await ui.act('pv-order', {index});
        for (const [index, n] of t.values.entries()) await ui.field('positions.' + index, index === 0 ? n - 1 : n);
      }, async (ui, t) => {
        await ui.field('positions.0', t.values[0]);
      });
      async function add(ui, units, side) {
        for (const [index, n] of units.slice(0, 3).entries()) {
          for (let i = 0; i < n; i++) await ui.act('pv-add', {index, delta: 1, side});
        }
      }
      prerequisite = async (ui, t) => {
        if (t.type === 'x-countboard') {
          for (const [index, value] of t.holes.entries()) await ui.field('values.' + index, value);
          return;
        }
        const example = b07.example(t);
        if (t.type === 'x-pvcompare') {
          await add(ui, example.a, 'a');
          await add(ui, example.b, 'b');
          await ui.field('relation', example.relation);
          await ui.field('first', example.first);
          return;
        }
        await add(ui, t.firstEnd || example.u, '');
        if (t.forms) {
          await ui.act('pv-save');
          await ui.act('pv-form', {form: t.forms[1]});
          await add(ui, example.u, '');
          await ui.act('pv-save');
        }
        await ui.field('answer', t.n);
        if (t.expanded) for (const [index, value] of example.parts.entries()) await ui.field('parts.' + index, value);
        if (t.why) await ui.field('why', t.why);
      };
      break;
    }
    default: throw new Error('No fixture for ' + family);
  }
  return {targets: evidence.SOURCES.map(make), prerequisite};
};
