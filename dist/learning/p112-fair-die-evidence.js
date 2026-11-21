import {initial, inspect, valid} from './phase5/b22-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const type = 'x-p22-pick';
const faces = [1, 2, 3, 4, 5, 6];
const items = faces.map(face => ({label:String(face), group:'面'}));
const isEven = face => face % 2 === 0;
const isPrime = face => [2, 3, 5].includes(face);

const reviewed = [
  {
    sessionId:'chancefraction', index:0, nodeId:'mt_-c4Ca_nBzX',
    taskHash:'0120ea2b348f164863df0ddcc00a953b1428af844ff3f38f957e7f351a19f7bc',
    prompt:'公平骰子有六个面。圈出“掷到6”的结果，再写占全部的几分之几。',
    includes:face => face === 6,
    questions:[{label:'一共几个等可能的面', value:6}]
  },
  {
    sessionId:'chancecalc', index:1, nodeId:'mt_Zt30Gxi-qp',
    taskHash:'7b249cfe540f1bf9ced161bb3832e32178bfc8392f566ccdce76b1aae201910e',
    prompt:'公平骰子只掷一次。圈出偶数结果，再写它占全部的几分之几。',
    includes:isEven,
    questions:[{label:'有几个偶数面', value:3}]
  },
  {
    sessionId:'chancescale', index:1, nodeId:'mt_vmQJAtAFuy',
    taskHash:'4f89d62e283c67ff87637842c2a2fd8534c21ab00579eb083d4f723143fbe201',
    prompt:'公平六面骰掷到3：每个面等可能，圈出这一面并写概率。',
    includes:face => face === 3,
    questions:[{label:'每个面机会', value:'equal', options:[['equal','公平骰各面机会一样'],['any','每个数字都可随意指定']]}]
  },
  {
    sessionId:'chancenone', index:1, nodeId:'mt_3fwYu7imd4',
    taskHash:'ec71f5ae7a820f2558b9915173d54b7162f8e1b0ef200716d20cc7a7a1d73d6c',
    prompt:'公平骰子“不是3”：圈出所有符合的面，再写它们占全部的几分之几。',
    includes:face => face !== 3,
    questions:[{label:'3的机会', value:'1/6'}, {label:'1减去1/6', value:'5/6'}]
  },
  {
    sessionId:'chancecomplement', index:1, nodeId:'mt_XfyqXLqzpx',
    taskHash:'e101c5dbcbe32abeb832d41ed87132396e27fed47c1dfbdffe98b12ca1b27ea9',
    prompt:'公平骰子“不是6”。圈出符合的面，再用1减1/6核对。',
    includes:face => face !== 6,
    questions:[{label:'1减1/6', value:'5/6'}]
  },
  {
    sessionId:'chancecomplement', index:2, nodeId:'mt_XfyqXLqzpx',
    taskHash:'62f3a37782b3d5a65171d8d79f3f8dc71d98f8a4e42bb2c1a954540f260d0385',
    prompt:'骰子上的偶数是2、4、6，质数是2、3、5。“偶数或质数”圈出哪些面？',
    includes:face => isEven(face) || isPrime(face),
    questions:[
      {label:'两个条件共有的数', value:2},
      {label:'符合至少一个条件的机会', value:'5/6'},
      {label:'两个“都会发生”的说法怎样数重叠', value:'once', options:[['once','重叠结果只算一次'],['twice','属于两边就算两次']]}
    ]
  }
];

const sources = new Map(reviewed.map(source => {
  const {sessionId, index, prompt, includes, questions} = source;
  const winners = faces.flatMap((face, i) => includes(face) ? [i] : []);
  return [sessionId + ':' + index, {...source, task:{type, prompt, items, winners, questions}}];
}));

export const P112_SOURCES = Object.freeze(reviewed.map(({sessionId, index, nodeId, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type, taskHash})
));

function reviewedSource(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = sources.get(context.sessionId + ':' + context.index);
  return source && sameEvidence(task, source.task) &&
    matchesNativeEvidenceTask(task, context, {type, nodeId:source.nodeId}) ? source : null;
}

export function p112FairDieBinding(task, context) {
  const source = reviewedSource(task, context);
  return source && {
    nodeId:source.nodeId,
    kind:'p112-fair-die',
    method:null,
    question:'哪些面符合条件？它们占六个等可能结果的几分之几？'
  };
}

// Use the original input forms but verify equality of numbers exactly.
// A rounded decimal accepted by the lesson tolerance is insufficient here.
function matchesNumber(raw, numerator, denominator = 1) {
  const text = raw.trim();
  const fraction = /^(-?\d+)(?:\s+(\d+))?\/(\d+)$/.exec(text);
  let top, bottom;
  if (fraction) {
    const [, leading, part, divisor] = fraction;
    top = BigInt(leading);
    bottom = BigInt(divisor);
    if (part !== undefined) {
      top = top * bottom + (leading.startsWith('-') ? -1n : 1n) * BigInt(part);
    }
  } else {
    const decimal = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
    if (!decimal) return false;
    const [, sign, integer, digits = ''] = decimal;
    top = BigInt(sign + integer + digits);
    bottom = 10n ** BigInt(digits.length);
  }
  return bottom > 0n && top * BigInt(denominator) === bottom * BigInt(numerator);
}

function matchesAnswer(raw, question) {
  if (question.options) return raw === question.value;
  const [top, bottom] = String(question.value).split('/');
  return matchesNumber(raw, top, bottom);
}

export function replayP112FairDieEvidence(task, model, context) {
  try {
    const source = reviewedSource(task, context);
    if (!source || !hasExactKeys(model, Object.keys(initial(task, 1))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const selected = new Set();
    const toggles = [];
    for (const event of model.history) {
      // These six original boards have only individual face buttons.
      if (!hasExactKeys(event, ['a','d','f']) || event.a !== 'toggle' ||
          !hasExactKeys(event.d, ['index']) || !hasExactKeys(event.f, []) ||
          typeof event.d.index !== 'string' || !/^[0-5]$/.test(event.d.index)) return null;
      const face = faces[Number(event.d.index)];
      const added = !selected.delete(face);
      if (added) selected.add(face);
      toggles.push({face, selected:added});
    }
    const favorable = faces.filter(source.includes);
    const chosen = faces.filter(face => selected.has(face));
    if (!sameEvidence(chosen, favorable) ||
        !sameEvidence(model.board.selected, [...selected].map(face => face - 1)) ||
        model.kind !== 'equal' || !matchesNumber(model.prob, favorable.length, faces.length) ||
        !source.questions.every((question, i) => matchesAnswer(model.answers[i], question)) ||
        !inspect(task, model).correct) return null;

    return {
      kind:'p112-fair-die',
      nodeId:source.nodeId,
      sessionId:context.sessionId,
      index:context.index,
      sampleSpace:[...faces],
      selectedFaces:chosen,
      favorableCount:favorable.length,
      sampleCount:faces.length,
      toggles,
      actualRollAssessed:false,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP112FairDieEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP112FairDieEvidence(task, model, context);
}
