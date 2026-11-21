import {rational as inputFraction} from './phase5/b16-model.js';
import {equal, rational} from './phase5/b09-math.js';
import {fields, initial, inspect, number, valid} from './phase5/b21-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'meandistance';
const nodeId = 'mt_ZfpeI1CFyP';
const type = 'x-meandistance';
const kind = 'p110-mean-distance';
const sources = [
  {
    taskHash:'37f2f65d088bc3ec57745d4844a59913905e0ead04b18aba492716f238147ea3',
    task:{
      type,
      prompt:'五株植物高4、6、8、9、13厘米。把每一点到平均位置的距离逐条搭出来。',
      values:[4,6,8,9,13],
      unit:'厘米',
      questions:[]
    }
  },
  {
    taskHash:'fc82754258b970d35d67162f853dead36e307801ad7ded0922fa92a86ea9cf98',
    task:{
      type,
      prompt:'这次共同位置是10厘米。逐条量距离，看看平均距离3厘米是什么意思。',
      values:[4,10,13,13],
      unit:'厘米',
      questions:[{
        label:'平均距离3厘米表示',
        value:['distance'],
        options:[
          ['distance','每株到平均高度的距离，平均是3厘米'],
          ['height','每株都高3厘米'],
          ['same','每株离平均高度恰好3厘米']
        ]
      }]
    }
  }
];

export const P110_SOURCES = Object.freeze(sources.map(({taskHash}, index) =>
  Object.freeze({sessionId, index, nodeId, type, taskHash})
));

export function p110MeanDistanceBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task, sources[context.index]?.task) ||
      !matchesNativeEvidenceTask(task, context, {type,nodeId})) return null;
  return {nodeId, kind, method:null, question:'每份数据离平均位置多远？把这些距离再平均，结果是多少？'};
}

const sum = values => values.reduce((total, value) => total + value, 0);
const equalsInput = (raw, expected) => equal(inputFraction(raw), expected);
const eventFields = {anchor:['anchor'], distance:['distance'], row:[]};

export function replayP110MeanDistanceEvidence(task, model, context) {
  try {
    const binding = p110MeanDistanceBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const {values,unit} = task;
    const count = values.length;
    const center = sum(values) / count;
    const expected = values.map(value => Math.abs(value - center));
    const distanceTotal = sum(expected);
    const average = rational(distanceTotal,count);
    const legacyFields = Object.keys(fields(task));
    const saved = values.map(() => null);
    const events = [];
    let anchored = false, cursor = 0;

    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event, ['a','d','f']) || !Object.hasOwn(eventFields,event.a) ||
          (!hasExactKeys(event.f, eventFields[event.a]) && !hasExactKeys(event.f, legacyFields))) return null;
      if (event.a === 'row') {
        if (!anchored || !hasExactKeys(event.d, ['index']) ||
            !/^[0-4]$/.test(event.d.index) || Number(event.d.index) >= count) return null;
        cursor = Number(event.d.index);
        events.push({index, action:'row', row:cursor});
        continue;
      }
      if (!hasExactKeys(event.d, [])) return null;
      if (event.a === 'anchor') {
        if (anchored) return null;
        const raw = event.f.anchor;
        const parsed = number(raw);
        const accepted = Math.abs(parsed - center) < 1e-7;
        if (accepted && !equalsInput(raw,[center,1])) return null;
        anchored = accepted;
        events.push({index, action:'anchor', raw, accepted});
        continue;
      }
      if (!anchored) return null;
      const raw = event.f.distance;
      const distance = number(raw);
      const recorded = Number.isFinite(distance) && distance >= 0 && distance <= 1000;
      events.push({index, action:'distance', row:cursor, raw, recorded});
      if (recorded) {
        saved[cursor] = {index, raw, distance};
        const next = saved.indexOf(null);
        if (next >= 0) cursor = next;
      }
    }

    if (!anchored || model.board.anchor !== center || model.board.cursor !== cursor ||
        saved.some((item,i) => !item || item.distance !== expected[i] || !equalsInput(item.raw,[expected[i],1])) ||
        !sameEvidence(model.board.distances,expected) || !equalsInput(model.value,average) ||
        !task.questions.every((question,i) => question.value.includes(model.answers[i])) ||
        !inspect(task, model).correct) return null;

    return {
      kind, nodeId, sessionId, index:context.index, unit, center,
      count,
      rows:saved.map((entry,i) => ({row:i, value:values[i], distance:entry.distance, eventIndex:entry.index})),
      distanceTotal,
      meanDistance:{numerator:average[0], denominator:average[1]},
      events,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP110MeanDistanceEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP110MeanDistanceEvidence(task, model, context);
}
