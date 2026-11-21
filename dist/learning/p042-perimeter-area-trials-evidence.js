import {initial, inspect, valid} from './phase5/b36-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rat, rtext, eq} from './phase5/b36-model.js';

const reviewed = [
  {
    "sessionId": "formula36",
    "index": 0,
    "nodeId": "mt_Jvg8X0N5u0",
    "type": "x-f36-shape",
    "taskHash": "74cc4ecfe01c8f0a94be73e0adce0f1551253436229a1cddcff340110cb17ac2",
    "task": {
      "type": "x-f36-shape",
      "prompt": "先试长5、宽3的长方形，猜外边一圈；再把长改成6，重新猜。",
      "kind": "rectangle",
      "initial": [
        5,
        3
      ],
      "required": [
        [
          5,
          3
        ],
        [
          6,
          3
        ]
      ],
      "questions": [
        {
          "label": "一圈的单位",
          "value": "cm",
          "kind": "choice",
          "options": [
            [
              "cm",
              "厘米"
            ],
            [
              "area",
              "平方厘米"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "formula36",
    "index": 1,
    "nodeId": "mt_Jvg8X0N5u0",
    "type": "x-f36-shape",
    "taskHash": "8be58c500d6013fde82e0564bedcd945ff51480699696eb155a7a11431bc01ab",
    "task": {
      "type": "x-f36-shape",
      "prompt": "先试底6、高4的三角形，猜里面的大小；再把高改成5。",
      "kind": "triangle",
      "initial": [
        6,
        4
      ],
      "required": [
        [
          6,
          4
        ],
        [
          6,
          5
        ]
      ],
      "questions": [
        {
          "label": "里面的单位",
          "value": "area",
          "kind": "choice",
          "options": [
            [
              "cm",
              "厘米"
            ],
            [
              "area",
              "平方厘米"
            ]
          ]
        }
      ]
    }
  }
];
export const P042_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p042PerimeterAreaTrialsBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p042-perimeter-area-trials', method:null, question:"长方形外面一圈和三角形里面的大小，分别怎样算？"};
}
export function replayP042PerimeterAreaTrialsEvidence(task, model, context) {
  try {
    const binding = p042PerimeterAreaTrialsBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const dims = [...task.initial];
    const trials = [];
    let first = null;
    let bad = false;
    let lastCorrect = false;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','i','v','w','z']) || event.w !== '' || event.z !== '') return null;
      if (event.a === 'dim') {
        const change = /^([01]),(-?1)$/.exec(event.i);
        if (!change) return null;
        const axis = Number(change[1]);
        const next = dims[axis] + Number(change[2]);
        if (next >= 1 && next <= 9) dims[axis] = next;
      } else if (event.a === 'trial' && event.i === '') {
        const [length, width] = dims;
        const result = task.kind === 'rectangle' ? [2 * (length + width), 1] : [length * width, 2];
        first ??= {dims:[...dims], answer:event.v};
        const answer = rat(event.v);
        lastCorrect = Boolean(answer && answer[0] * result[1] === result[0] * answer[1]);
        bad ||= !lastCorrect;
        if (answer) trials.push({dims:[...dims], answer:event.v,result:rtext(rat(result)),correct:lastCorrect});
      } else return null;
    }
    const last = trials.at(-1);
    const unit = task.kind === 'rectangle' ? 'cm' : 'area';
    if (!lastCorrect || !last?.correct || !sameEvidence(last.dims,dims) || !eq(last.answer, model.value) ||
        model.answers[0].trim() !== unit || !task.required.every(want => trials.some(trial => trial.correct && sameEvidence(want,trial.dims))) ||
        !sameEvidence({first:{trial:first},bad,dims,trials},model.board) || !inspect(task,model).correct) return null;
    return {binding, trials, unit};

  } catch {
    return null;
  }
}
export function submittedP042PerimeterAreaTrialsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP042PerimeterAreaTrialsEvidence(task, model, context) : null;
}
