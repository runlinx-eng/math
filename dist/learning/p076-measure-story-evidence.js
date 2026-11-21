import {initial, inspect, valid} from './phase5/b19-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-measurestory';
const REVIEWED = Object.freeze([
  {
    "sessionId": "measurestory",
    "index": 1,
    "nodeId": "mt_6gpryAnpoZ",
    "type": "x-measurestory",
    "taskHash": "0f4e2126f9e4da1dd93e106969481217f74e452a4adacf9d6ac831cc43ac7c09",
    "task": {
      "type": "x-measurestory",
      "mode": "context",
      "prompt": "有人只留下“手掌张开有多宽”这句话。把这份测量记录的背景补完整。",
      "choices": [
        {
          "key": "who",
          "label": "测谁",
          "options": [
            [
              "pupils",
              "这28位参与者"
            ],
            [
              "hands",
              "28把尺"
            ],
            [
              "none",
              "对象不重要"
            ]
          ],
          "answer": "pupils"
        },
        {
          "key": "n",
          "label": "几条测量",
          "options": [
            [
              "28",
              "每人一次，共28条"
            ],
            [
              "56",
              "两只手，一定56条"
            ],
            [
              "1",
              "只有一列，所以1条"
            ]
          ],
          "answer": "28"
        },
        {
          "key": "tool",
          "label": "用什么",
          "options": [
            [
              "ruler",
              "尺子"
            ],
            [
              "clock",
              "时钟"
            ],
            [
              "guess",
              "凭眼睛猜"
            ]
          ],
          "answer": "ruler"
        },
        {
          "key": "method",
          "label": "测哪里到哪里",
          "options": [
            [
              "span",
              "同一只手充分张开，拇指尖到小指尖"
            ],
            [
              "palm",
              "只量掌心"
            ],
            [
              "mixed",
              "每人自己决定"
            ]
          ],
          "answer": "span"
        },
        {
          "key": "unit",
          "label": "单位",
          "options": [
            [
              "cm",
              "厘米"
            ],
            [
              "hour",
              "小时"
            ],
            [
              "none",
              "不需要"
            ]
          ],
          "answer": "cm"
        },
        {
          "key": "precision",
          "label": "记录精度",
          "options": [
            [
              "half",
              "取到最接近的0.5厘米"
            ],
            [
              "exact",
              "无限精确"
            ],
            [
              "whole",
              "整米"
            ]
          ],
          "answer": "half"
        }
      ]
    },
    "question": "为什么测量记录必须写清测谁、几条、工具、量和单位？"
  },
  {
    "sessionId": "measurestory",
    "index": 2,
    "nodeId": "mt_6gpryAnpoZ",
    "type": "x-measurestory",
    "taskHash": "9cc95578b3d6aa4769d788000db3424223dd026cdd43c548a21855e8a66f816c",
    "task": {
      "type": "x-measurestory",
      "mode": "round",
      "prompt": "报告的睡觉时刻常堆在21:00、21:30。把这些模拟精确时刻取到最近半小时，看看堆积能不能仅由取整产生。",
      "times": [
        1256,
        1264,
        1275,
        1279,
        1287,
        1293,
        1301
      ]
    },
    "question": "为什么精确时刻取整到最近半小时会产生 21:00/21:30 的堆积，但它只说明“可能如此”？"
  }
]);
export const P076_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) => Object.freeze({sessionId, index, nodeId, type: t, taskHash})));

export function p076MeasureStoryBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p076-measure-story', method: null, question: entry.question};
}

function readClock(raw) {
  const m = String(raw || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h >= 0 && h < 24 && min >= 0 && min < 60 ? h * 60 + min : null;
}
function roundHalfHour(mins) {
  return Math.floor((mins + 15) / 30) * 30;
}

export function replayP076MeasureStoryEvidence(task, model, context) {
  try {
    const binding = p076MeasureStoryBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    if (task.mode === 'context') {
      let saved = false, failed = 0, lastIssue = '';
      for (const ev of model.history) {
        if (!hasExactKeys(ev, ['a', 'd', 'f']) || !hasExactKeys(ev.d, [])) return null;
        lastIssue = '';
        if (ev.a === 'reset') saved = false;
        else if (ev.a === 'plan') {
          const okPlan = task.choices.every((c, i) => ev.f.answers?.[i] === c.answer);
          saved = okPlan; if (!okPlan) { lastIssue = 'bad'; failed++; }
        } else return null;
      }
      if (lastIssue !== '' || !saved || !model.board.saved || !task.choices.every((c, i) => model.answers[i] === c.answer) || !inspect(task, model).correct) return null;
      return {binding, mode: 'context', choicesCount: task.choices.length, failed};
    }
    let started = false, cursor = 0, failed = 0, lastIssue = '';
    const rounded = [];
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'd', 'f']) || !hasExactKeys(ev.d, [])) return null;
      lastIssue = '';
      if (ev.a === 'reset') { started = false; cursor = 0; rounded.length = 0; }
      else if (ev.a === 'start-round') {
        if (['exact', 'rounding', 'unknown'].includes(ev.f.guess)) started = true;
      } else if (ev.a === 'round') {
        if (!started || cursor >= task.times.length) return null;
        const got = readClock(ev.f.roundAnswer), want = roundHalfHour(task.times[cursor]);
        if (got !== want) { lastIssue = 'bad-round'; failed++; }
        else { rounded.push(got); cursor++; }
      } else return null;
    }
    if (lastIssue !== '' || !started || cursor !== task.times.length || !sameEvidence(rounded, model.board.rounded) ||
        model.conclusion !== 'possible' || !inspect(task, model).correct) return null;
    return {binding, mode: 'round', rounded, failed};
  } catch { return null; }
}

export function submittedP076MeasureStoryEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP076MeasureStoryEvidence(task, model, context);
}
