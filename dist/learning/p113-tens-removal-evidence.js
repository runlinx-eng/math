import {digits, initial, inspect, number, rowOffset, valid, width} from './phase5/b11-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const type = 'x-placecalc';
const tensColumn = 1;
const reviewed = new Map([
  ['decadetake:0', {
    sessionId: 'decadetake',
    index: 0,
    nodeId: 'mt_HJTuIGHvcR',
    taskHash: '532850ef4f8a177ca9c8fd336629c91ea80b3f3dd050006009d9659d568291c9',
    task: {
      "type": "x-placecalc",
      "values": [
        70,
        30
      ],
      "op": "-",
      "prompt": "7捆拿走3捆。把剩下的读成实际数量。"
    }
  }],
  ['decadetake:1', {
    sessionId: 'decadetake',
    index: 1,
    nodeId: 'mt_HJTuIGHvcR',
    taskHash: '449d5cc1834e0c393291807ee3cb40f39f3dccd2cd29fb0a26288b726725f7fa',
    task: {
      "type": "x-placecalc",
      "values": [
        80,
        50
      ],
      "op": "-",
      "prompt": "8捆拿走5捆，亲手移走。"
    }
  }],
  ['tenslarge:1', {
    sessionId: 'tenslarge',
    index: 1,
    nodeId: 'mt_aHQ9kNt3is',
    taskHash: '8faead9b18d54d2893d7910d9be5065c0a9280aa9d083f214e38bbed0b2d706b',
    task: {
      "type": "x-placecalc",
      "values": [
        462,
        30
      ],
      "op": "-",
      "prompt": "462拿走3捆。"
    }
  }],
  ['general34:1', {
    sessionId: 'general34',
    index: 1,
    nodeId: 'mt_fZTn0W_iZR',
    taskHash: '11e5277a57a182ea024695cc3be0b346ad784a9c0918558b100005a678fb6c57',
    task: {
      "type": "x-placecalc",
      "values": [
        82,
        10
      ],
      "op": "-",
      "prompt": "82拿走一捆十，观察十位与个位怎样变化。"
    }
  }]
]);

export const P113_SOURCES = Object.freeze([...reviewed.values()].map(({sessionId,index,nodeId,taskHash}) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p113TensRemovalBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = reviewed.get(context.sessionId + ':' + context.index);
  if (!source || !sameEvidence(task, source.task) ||
      !matchesNativeEvidenceTask(task, context, {type,nodeId:source.nodeId})) {
    return null;
  }
  return {
    nodeId: source.nodeId,
    kind: 'p113-tens-removal',
    method: null,
    question: '这次从十位拿走了几份？其他数位的量各是多少？'
  };
}

const total = counts => counts.reduce((sum,value,index)=>sum + BigInt(value) * 10n ** BigInt(index), 0n);

export function replayP113TensRemovalEvidence(task, model, context) {
  try {
    const binding = p113TensRemovalBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        !model.started || model.issue !== '' || model.history.length < 2 ||
        Object.keys(model.history).length !== model.history.length) {
      return null;
    }

    const columns = width(task);
    const start = digits(task.values[0], columns);
    const requested = digits(task.values[1], columns);
    const expectedAlignment = task.values.map((_,index)=>String(rowOffset(task,index)));
    const needed = requested[tensColumn];
    if (needed <= 0 || start[tensColumn] < needed || total(requested) !== BigInt(needed) * 10n) {
      return null;
    }

    const alignmentAttempts = [];
    const counts = [...start];
    const remaining = [...requested];
    let correctAlignment = null;
    let removal = null;

    for (const [eventIndex,event] of model.history.entries()) {
      if (event?.action === 'b11-place-start') {
        if (correctAlignment || !hasExactKeys(event, ['action','guess','align']) ||
            number(event.guess) === null || !Array.isArray(event.align) ||
            event.align.length !== expectedAlignment.length ||
            Object.keys(event.align).length !== event.align.length ||
            !event.align.every(value => typeof value === 'string' &&
              (value === '' || (/^(0|[1-9]\d*)$/.test(value) && Number(value) < columns)))) {
          return null;
        }
        const accepted = sameEvidence(event.align, expectedAlignment);
        alignmentAttempts.push({eventIndex, guess:event.guess, align:[...event.align], accepted});
        if (accepted) correctAlignment = event;
        continue;
      }

      // All four tasks have sufficient tens without exchanging any units.
      if (!correctAlignment || removal || event?.action !== 'b11-remove' ||
          !hasExactKeys(event, ['action','index','before','needed']) ||
          event.index !== tensColumn || event.needed !== needed || !sameEvidence(event.before, counts)) {
        return null;
      }
      const before = [...counts];
      counts[tensColumn] -= needed;
      remaining[tensColumn] = 0;
      removal = {eventIndex, column:tensColumn, unit:10, unitsRemoved:needed, before, after:[...counts]};
    }

    const result = BigInt(task.values[0]) - BigInt(task.values[1]);
    const answer = number(model.answer);
    if (!removal || model.first !== alignmentAttempts[0].guess || model.guess !== correctAlignment.guess ||
        !sameEvidence(model.align, expectedAlignment) || !sameEvidence(model.counts, counts) ||
        !sameEvidence(model.remaining, remaining) || !remaining.every(value=>value === 0) ||
        total(start) !== BigInt(task.values[0]) || total(counts) !== result ||
        answer === null || BigInt(answer) !== result || !inspect(task, model).correct) {
      return null;
    }
    return {
      kind: binding.kind,
      nodeId: binding.nodeId,
      sessionId: context.sessionId,
      index: context.index,
      startTotal: task.values[0],
      removedTotal: needed * 10,
      endTotal: Number(result),
      alignmentAttempts,
      removal,
      exchangeCount: 0,
      individualBundleClicksAssessed: false,
      initialGuessCorrectnessAssessed: false,
      learnerMasteryAssessed: false
    };
  } catch {
    return null;
  }
}

export function submittedP113TensRemovalEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP113TensRemovalEvidence(task, model, context);
}
