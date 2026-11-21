import {number} from './phase5/b20-model.js';
import {initial, inspect, valid} from './phase5/b22-model.js';
const nextSeed = x => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return x >>> 0; };
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-p22-mapping';
const REVIEWED = Object.freeze([
  {
    "sessionId": "chancesim",
    "index": 0,
    "nodeId": "mt_nzdtOLXWWa",
    "type": "x-p22-mapping",
    "taskHash": "c5882ca9b0b29d3c0d271012ed67a0744fc8255219675da3784e25830236bd87",
    "task": {
      "type": "x-p22-mapping",
      "prompt": "十个等可能数字0—3代表A，其余代表非A。自己选出代表A的数字，再模拟10次。",
      "targetRuns": 10,
      "questions": [
        {
          "label": "10个数字里有几个代表A",
          "value": 4
        },
        {
          "label": "A占全部的几分之几",
          "value": "2/5"
        }
      ]
    },
    "question": "为什么用 0—3 代表 A（占 4/10 = 2/5）并重复模拟到第一次 A 出现，可以估计至少需要 4 次的比例？"
  },
  {
    "sessionId": "chancesim",
    "index": 1,
    "nodeId": "mt_nzdtOLXWWa",
    "type": "x-p22-mapping",
    "taskHash": "5fe5221b0bd7836ffdf52d91315c57852116399ba9e756aa9fbfa93eff652f93",
    "task": {
      "type": "x-p22-mapping",
      "prompt": "一次实验：读数字直到第一次A出现。重复50次，数一数需要至少4个数字的比例。",
      "targetRuns": 50,
      "questions": [
        {
          "label": "至少4次才出现A，表示",
          "value": "three",
          "options": [
            [
              "three",
              "前3次都不是A"
            ],
            [
              "four",
              "前4次都必须是A"
            ]
          ]
        }
      ]
    },
    "question": "为什么用 0—3 代表 A（占 4/10 = 2/5）并重复模拟到第一次 A 出现，可以估计至少需要 4 次的比例？"
  },
  {
    "sessionId": "chancesim",
    "index": 2,
    "nodeId": "mt_nzdtOLXWWa",
    "type": "x-p22-mapping",
    "taskHash": "064aaf69626e56f309a513816ca4c2614cb7dd6aef1fe3cbd21b74848f5eae5d",
    "task": {
      "type": "x-p22-mapping",
      "prompt": "两组各做50次，分别有9次和13次需要至少4次。把记录合起来，再做10次自己的模拟。",
      "targetRuns": 10,
      "questions": [
        {
          "label": "合并后共有多少次",
          "value": 100
        },
        {
          "label": "合并后符合条件几次",
          "value": 22
        },
        {
          "label": "合并比例（可写分数）",
          "value": "11/50"
        },
        {
          "label": "500次与50次比较",
          "value": "usually",
          "options": [
            [
              "usually",
              "通常更稳定，但不是每次必更准"
            ],
            [
              "always",
              "500次必定完全准确"
            ]
          ]
        }
      ],
      "given": [
        9,
        13
      ]
    },
    "question": "为什么用 0—3 代表 A（占 4/10 = 2/5）并重复模拟到第一次 A 出现，可以估计至少需要 4 次的比例？"
  }
]);
export const P083_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) => Object.freeze({sessionId, index, nodeId, type: t, taskHash})));

export function p083ChanceMappingBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p083-chance-mapping', method: null, question: entry.question};
}

export function replayP083ChanceMappingEvidence(task, model, context) {
  try {
    const binding = p083ChanceMappingBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const selected = [], runs = [];
    let random = model.seed, pending = [], failedRuns = 0, lastIssue = '';
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'f', 'd'])) return null;
      lastIssue = '';
      if (ev.a === 'reset' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) { selected.length = 0; runs.length = 0; pending = []; random = model.seed; }
      else if (ev.a === 'toggle' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, ['index']) && /^[0-9]$/.test(ev.d.index)) {
        const idx = Number(ev.d.index), pos = selected.indexOf(idx);
        if (pos >= 0) selected.splice(pos, 1); else selected.push(idx);
      } else if (ev.a === 'run' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) {
        const sortedSel = [...selected].sort((a,b)=>a-b);
        if (!sameEvidence(sortedSel, [0, 1, 2, 3])) { lastIssue = 'bad-sel'; failedRuns++; }
        else if (runs.length < task.targetRuns) {
          let done = 0;
          while (done < 10 && runs.length < task.targetRuns) {
            let found = false;
            for (let c = 0; c < 1000; c++) {
              random = nextSeed(random);
              const d = Math.floor(random / 4294967296 * 10);
              pending.push(d);
              if (d < 4) { found = true; break; }
            }
            if (!found) { lastIssue = 'unfinished'; break; }
            runs.push(pending); pending = []; done++;
          }
        }
      } else return null;
    }
    const hits = runs.filter(r => r.length >= 4).length;
    const exactRate = hits / runs.length;
    if (lastIssue !== '' || !sameEvidence([...selected].sort((a,b)=>a-b), [0,1,2,3]) ||
        runs.length !== task.targetRuns || pending.length !== 0 ||
        !sameEvidence(runs, model.board.runs) || Math.abs(number(model.rate) - exactRate) > 1e-7 ||
        !inspect(task, model).correct) return null;
    return {binding, targetRuns: task.targetRuns, hits, rate: exactRate, failedRuns};
  } catch { return null; }
}

export function submittedP083ChanceMappingEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP083ChanceMappingEvidence(task, model, context);
}
