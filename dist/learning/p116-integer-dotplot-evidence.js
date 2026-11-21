import {fields, initial, inspect, number, valid} from './phase5/b20-model.js';
import {
  hasExactKeys,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'dotrecords';
const nodeId = 'mt_JRzXQl9M7c';
const type = 'x-dotdraw';

const reviewed = new Map([
  [0, {
    taskHash: '83b39dbc6097e844eae70a5c3540e4796e8b2adc77af4b0b30e86a7c2e74f797',
    task: {
      "type": "x-dotdraw",
      "prompt": "20人各有一个月读书记录。逐条放点：四个3要叠在3上，没人读7本也要保留7的位置。",
      "values": [
        0,
        1,
        2,
        3,
        3,
        3,
        3,
        4,
        5,
        5,
        5,
        5,
        5,
        5,
        6,
        8,
        9,
        10,
        11,
        12
      ],
      "questions": [
        {
          "label": "总共记录几人",
          "value": 20
        },
        {
          "label": "读3本的有几人",
          "value": 4
        },
        {
          "label": "7这个位置为什么空",
          "value": [
            "gap"
          ],
          "options": [
            [
              "gap",
              "没有人记录7本，刻度仍在"
            ],
            [
              "remove",
              "7这个数不存在"
            ]
          ]
        }
      ],
      "d": 1,
      "min": 0,
      "max": 12,
      "unit": "本"
    }
  }],
  [2, {
    taskHash: 'd97c93f555545c8e11931bb88872b2a5980be361758ab47a3b6413ef661e890f',
    task: {
      "type": "x-dotdraw",
      "prompt": "换一组记录，数值6没有出现，3只出现两次。不要沿用上一张图的形状。",
      "values": [
        1,
        2,
        2,
        3,
        3,
        5,
        5,
        5,
        7,
        8
      ],
      "questions": [
        {
          "label": "总共几人",
          "value": 10
        },
        {
          "label": "最常见的本数",
          "value": 5
        }
      ],
      "d": 1,
      "min": 0,
      "max": 8,
      "unit": "本"
    }
  }]
]);

export const P116_SOURCES = Object.freeze([...reviewed].map(([index, {taskHash}]) =>
  Object.freeze({sessionId, index, nodeId, type, taskHash})
));

export function p116IntegerDotplotBinding(task, context) {
  const source = reviewed.get(context?.index);
  if (context?.sessionId !== sessionId || !source ||
      !sameEvidence(task, source.task) || !matchesNativeEvidenceTask(task, context, {nodeId, type})) {
    return null;
  }
  return {
    nodeId,
    kind: 'p116-integer-dotplot',
    method: null,
    question: '横轴的数值和这个位置上叠了几个点，各表示什么？'
  };
}

function exactInteger(raw) {
  const value = raw.trim();
  const integer = value.match(/^(-?\d+)(?:\.0+)?$/);
  if (integer) return BigInt(integer[1]);

  const fraction = value.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const numerator = BigInt(fraction[1]);
    const denominator = BigInt(fraction[2]);
    return denominator > 0n && numerator % denominator === 0n ? numerator / denominator : null;
  }

  const mixed = value.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (!mixed) return null;
  const numerator = BigInt(mixed[2]);
  const denominator = BigInt(mixed[3]);
  if (denominator === 0n || numerator % denominator !== 0n) return null;
  const sign = mixed[1].startsWith('-') ? -1n : 1n;
  return BigInt(mixed[1]) + sign * (numerator / denominator);
}

export function replayP116IntegerDotplotEvidence(task, model, context) {
  try {
    const binding = p116IntegerDotplotBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) {
      return null;
    }

    const fieldNames = Object.keys(fields(task));
    const placed = Array(task.values.length).fill(null);
    const placements = [];
    let cursor = 0;

    for (const [eventIndex, event] of model.history.entries()) {
      if (!hasExactKeys(event, ['a', 'd', 'f']) || !hasExactKeys(event.f, fieldNames)) return null;
      if (event.a === 'row') {
        if (!hasExactKeys(event.d, ['index']) || !/^(0|[1-9]\d*)$/.test(event.d.index)) return null;
        cursor = Number(event.d.index);
        if (!Number.isSafeInteger(cursor) || cursor >= placed.length) return null;
        continue;
      }
      if (event.a !== 'dot' || !hasExactKeys(event.d, [])) return null;

      const approximate = number(event.f.value);
      const rounded = Math.round(approximate);
      const originalPlaced = rounded >= task.min && rounded <= task.max && Math.abs(approximate - rounded) < 1e-8;
      if (!originalPlaced) {
        placements.push({eventIndex, recordIndex: cursor, accepted: false});
        continue;
      }

      // The original may round a near-integer onto a tick. Only an exact
      // recorded value establishes mathematical placement.
      if (exactInteger(event.f.value) !== BigInt(rounded)) return null;
      const value = rounded;
      placements.push({
        eventIndex,
        recordIndex: cursor,
        accepted: true,
        from: placed[cursor],
        to: value
      });
      placed[cursor] = value;
      const empty = placed.indexOf(null);
      if (empty !== -1) cursor = empty;
    }

    if (!sameEvidence(placed, task.values) || !sameEvidence(placed, model.board.placed) ||
        cursor !== model.board.cursor || !inspect(task, model).correct) {
      return null;
    }

    const frequencies = Array.from({length: task.max - task.min + 1}, (_, i) => ({
      value: task.min + i,
      count: 0
    }));
    for (const value of placed) frequencies[value - task.min].count++;
    const highestCount = Math.max(...frequencies.map(row => row.count));
    const modes = frequencies.filter(row => row.count === highestCount);
    const zeros = frequencies.filter(row => row.count === 0).map(row => row.value);
    const countOfThree = frequencies[3 - task.min].count;

    // The reported frequencies are calculated from the reconstructed plot.
    const [countAnswer, secondAnswer, gapAnswer] = model.answers;
    if (exactInteger(countAnswer) !== BigInt(placed.length)) return null;
    if (context.index === 0) {
      if (exactInteger(secondAnswer) !== BigInt(countOfThree) || !zeros.includes(7) || gapAnswer !== 'gap') {
        return null;
      }
    } else if (modes.length !== 1 || exactInteger(secondAnswer) !== BigInt(modes[0].value) || !zeros.includes(6)) {
      return null;
    }

    return {
      kind: binding.kind,
      nodeId: binding.nodeId,
      sessionId,
      index: context.index,
      recordCount: placed.length,
      frequencies,
      zeroFrequencyTicks: zeros,
      modes: modes.map(row => row.value),
      observablePlacements: placements,
      freeExplanationAssessed: false,
      learnerMasteryAssessed: false
    };
  } catch {
    return null;
  }
}

export function submittedP116IntegerDotplotEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP116IntegerDotplotEvidence(task, model, context);
}
