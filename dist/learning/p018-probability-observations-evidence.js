import {initial, inspect, valid} from './phase5/b22-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';

const reviewed = [
  {
    "sessionId": "trialcompare",
    "index": 0,
    "nodeId": "mt_-bMnJcPJy8",
    "type": "x-p22-experiment",
    "taskHash": "d3c7dde85aefe762392b8c52e54a8708786867fd3bccd83cdd9abeda230de7b9",
    "task": {
      "type": "x-p22-experiment",
      "prompt": "公平骰子先试60次，再继续到600次。六个面每次等机会；比较六出现的比例与1/6。",
      "labels": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6"
      ],
      "weights": [
        1,
        1,
        1,
        1,
        1,
        1
      ],
      "targets": [
        60,
        600
      ],
      "event": 5,
      "questions": [
        {
          "label": "600次时，六的预期次数",
          "value": "mean",
          "options": [
            [
              "mean",
              "约100次，实际可以不同"
            ],
            [
              "exact",
              "必须恰好100次"
            ]
          ]
        },
        {
          "label": "次数增多时",
          "value": "usually",
          "options": [
            [
              "usually",
              "比例通常更稳定，不保证每一步更近"
            ],
            [
              "always",
              "每次都会更近"
            ]
          ]
        }
      ],
      "theory": "1/6",
      "expected": 100
    }
  },
  {
    "sessionId": "trialcompare",
    "index": 1,
    "nodeId": "mt_-bMnJcPJy8",
    "type": "x-p22-experiment",
    "taskHash": "209b5dba1bf2c06a2065b822c1d622353c3aedafb85b9472878717935326fb66",
    "task": {
      "type": "x-p22-experiment",
      "prompt": "公平硬币先试10次，再继续到100次。先猜，保留真实正反记录。",
      "labels": [
        "正面",
        "反面"
      ],
      "weights": [
        1,
        1
      ],
      "targets": [
        10,
        100
      ],
      "event": 0,
      "questions": [
        {
          "label": "上次正面多，下一次",
          "value": "half",
          "options": [
            [
              "half",
              "仍是一半机会，不会自动补偿"
            ],
            [
              "due",
              "反面一定更容易"
            ]
          ]
        }
      ],
      "theory": "1/2"
    }
  },
  {
    "sessionId": "trialestimate",
    "index": 0,
    "nodeId": "mt_sHJqh6UUya",
    "type": "x-p22-experiment",
    "taskHash": "75f84ef5610192aa1cbe02132773874ca3274be6cae257f7539992438e7e30c6",
    "task": {
      "type": "x-p22-experiment",
      "prompt": "一个模拟装置的内部规则暂时藏起来。先试10次，再继续到100次，用实际记录估计亮灯机会。",
      "labels": [
        "亮灯",
        "不亮"
      ],
      "weights": [
        3,
        7
      ],
      "targets": [
        10,
        100
      ],
      "event": 0,
      "questions": [
        {
          "label": "用这次结果算出的比例是",
          "value": "estimate",
          "options": [
            [
              "estimate",
              "带不确定的估计"
            ],
            [
              "exact",
              "真实机会的精确证明"
            ]
          ]
        }
      ],
      "hidden": true
    }
  },
  {
    "sessionId": "trialestimate",
    "index": 1,
    "nodeId": "mt_sHJqh6UUya",
    "type": "x-p22-experiment",
    "taskHash": "55a77e9e1fd36f8c0bd2d081f5fd4528f3a6d2ff3905119dd10b0c0fb710be4f",
    "task": {
      "type": "x-p22-experiment",
      "prompt": "再换一个模拟硬币：先试20次，再继续到100次。用实际正面次数除以总次数。",
      "labels": [
        "正面",
        "反面"
      ],
      "weights": [
        1,
        1
      ],
      "targets": [
        20,
        100
      ],
      "event": 0,
      "questions": [
        {
          "label": "实验结果与1/2不同",
          "value": "chance",
          "options": [
            [
              "chance",
              "可能是随机波动"
            ],
            [
              "error",
              "必然有一次记错"
            ]
          ]
        }
      ],
      "theory": "1/2"
    }
  },
  {
    "sessionId": "trialestimate",
    "index": 2,
    "nodeId": "mt_sHJqh6UUya",
    "type": "x-p22-experiment",
    "taskHash": "1feebf0ad8725ec937462870113e762072060332bed7efb2bd2622033324fdff",
    "task": {
      "type": "x-p22-experiment",
      "prompt": "换一个三色模拟装置，先试20次，再继续到100次。看目标颜色的比例怎样变化。",
      "labels": [
        "蓝",
        "红",
        "黄"
      ],
      "weights": [
        2,
        3,
        5
      ],
      "targets": [
        20,
        100
      ],
      "event": 0,
      "questions": [
        {
          "label": "更多试验通常",
          "value": "reliable",
          "options": [
            [
              "reliable",
              "使估计更稳定，但仍有波动"
            ],
            [
              "fixed",
              "保证每次都刚好相同"
            ]
          ]
        }
      ],
      "hidden": true
    }
  },
  {
    "sessionId": "chanceindependent",
    "index": 0,
    "nodeId": "mt_dlg6i-Lw0I",
    "type": "x-p22-experiment",
    "taskHash": "02fc7b73f97cdaf4b16fe82d84ac34c30090ee228f9c8cb8e6204507c35e53d7",
    "task": {
      "type": "x-p22-experiment",
      "prompt": "设想公平硬币刚刚连续三次正面；再试10次，看规则有没有改变。",
      "labels": [
        "正面",
        "反面"
      ],
      "weights": [
        1,
        1
      ],
      "targets": [
        10
      ],
      "event": 0,
      "questions": [
        {
          "label": "下一次正面的机会",
          "value": "1/2"
        },
        {
          "label": "前面连续正面后",
          "value": "same",
          "options": [
            [
              "same",
              "下一次机会仍是一半"
            ],
            [
              "due",
              "反面必然更容易"
            ]
          ]
        }
      ],
      "theory": "1/2"
    }
  },
  {
    "sessionId": "chanceindependent",
    "index": 1,
    "nodeId": "mt_dlg6i-Lw0I",
    "type": "x-p22-draw",
    "taskHash": "110a7be80cd410b1b133863bb2899d92641c6ac578cedaf4737c740007829712",
    "task": {
      "type": "x-p22-draw",
      "prompt": "袋里3红2蓝。先假设第一次拿到红，分别试放回和不放回，再看下一次抽红的机会。",
      "questions": [
        {
          "label": "放回后抽红",
          "value": "3/5"
        },
        {
          "label": "不放回后抽红",
          "value": "1/2"
        },
        {
          "label": "不放回改变了",
          "value": "contents",
          "options": [
            [
              "contents",
              "袋里的组成和下一次机会"
            ],
            [
              "luck",
              "只是手气"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "chancetree",
    "index": 1,
    "nodeId": "mt_GDtFU5fyUv",
    "type": "x-p22-branch",
    "taskHash": "787621d1b0aad3665d6c3c52f69974b12db2a0dc2a6abb3ea6435b5ab5d70d6a",
    "task": {
      "type": "x-p22-branch",
      "prompt": "3红2蓝，连续拿两颗不放回。为每条路径填上前后两次机会，搭出四条分支。",
      "counts": [
        3,
        2
      ],
      "replace": false,
      "target": 0,
      "questions": [
        {
          "label": "第二次为什么变化",
          "value": "remain",
          "options": [
            [
              "remain",
              "第一颗没有放回，剩余组成改变"
            ],
            [
              "same",
              "总数仍是5"
            ]
          ]
        }
      ]
    }
  }
];
export const P018_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p018ProbabilityObservationsBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p018-probability-observations', method:null, question:"模拟频率和理论概率有什么关系？放回与不放回分别怎样改变下一次机会？"};
}
export function replayP018ProbabilityObservationsEvidence(task, model, context) {
  try {
    const binding = p018ProbabilityObservationsBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const experiment = task.type === 'x-p22-experiment';
    const draws = task.type === 'x-p22-draw';
    const exact = (raw,n,d=1) => {
      const ratio = rational(raw.trim().replace(/\s*\/\s*/g,'/'));
      return ratio && BigInt(ratio[0])*BigInt(d) === BigInt(n)*BigInt(ratio[1]);
    };
    const makeTrials = count => {
      let state = BigInt(model.seed);
      const full = task.weights.reduce((a,b) => a+b,0);
      const boundaries = [];
      for (const weight of task.weights) boundaries.push((boundaries.at(-1)??0) + weight);
      const mask = (1n << 32n)-1n;
      return Array.from({length:count}, () => {
        state ^= (state << 13n) & mask;
        state ^= state >> 17n;
        state ^= (state << 5n) & mask;
        const location = state * BigInt(full);
        return boundaries.findIndex(bound => location < (BigInt(bound) << 32n));
      });
    };
    const branchFractions = index => {
      const first = index < 2 ? 0 : 1, second = index % 2;
      return [task.counts[first], task.counts[second] - (first === second ? 1 : 0)];
    };
    let board = initial(task,model.seed).board;
    let issue = false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])) return null;
      const {a,d,f} = event;
      issue = false;
      const fields = {start:['guess'],choose:['first'],observe:['choice'],branch:['first','second']}[a] ?? [];
      if (!hasExactKeys(d,a==='branch'?['index']:[]) || !hasExactKeys(f,fields)) return null;
      board.first[a+'-0'] ??= f;
      if (a === 'reset') {
        board = {...initial(task,model.seed).board,first:board.first};
      } else if (experiment && a === 'start' && ['more','less','equal','unknown'].includes(f.guess)) {
        board.started = true;
      } else if (experiment && a === 'run') {
        if (board.started && board.checkpoints.length < task.targets.length) {
          const n = task.targets[board.checkpoints.length];
          board.draws = makeTrials(n);
          board.checkpoints.push(n);
        }
      } else if (draws && a === 'choose' && ['red','blue'].includes(f.first)) {
        board.firstColor = f.first;
      } else if (draws && a === 'observe' && board.firstColor && ['return','keep'].includes(f.choice)) {
        const first = board.firstColor, mode = f.choice;
        if (!board.observed.some(row => row.first===first && row.mode===mode)) {
          board.observed.push({first,mode,red:3-Number(mode==='keep'&&first==='red'),blue:2-Number(mode==='keep'&&first==='blue')});
        }
      } else if (!experiment && !draws && a === 'branch' && /^[0-3]$/.test(d.index)) {
        const index = Number(d.index);
        const [first, second] = branchFractions(index);
        if (!exact(f.first,first,5) || !exact(f.second,second,4)) {
          issue = true;
        } else {
          const prior = board.paths.findIndex(row => row.index === index);
          board.paths[prior < 0 ? board.paths.length : prior] = {index,first:f.first,second:f.second};
        }
      } else return null;
    }
    if (issue || !sameEvidence(board,model.board) || !inspect(task,model).correct) return null;
    if (experiment) {
      const total = task.targets.at(-1);
      const occurrences = board.draws.filter(value => value === task.event).length;
      if (board.checkpoints.length !== task.targets.length || !exact(model.rate,occurrences,total)) return null;
      if (context.sessionId === 'trialcompare') {
        if (context.index === 0 && (!exact(model.expected,600/6) || !sameEvidence(model.answers,['mean','usually']))) return null;
        if (context.index === 1 && model.answers[0] !== 'half') return null;
      } else if (context.sessionId === 'trialestimate') {
        if (model.answers[0] !== ['estimate','chance','reliable'][context.index]) return null;
      } else if (!exact(model.answers[0],1,2) || model.answers[1] !== 'same') return null;
      return {binding, simulated:true, occurrences, total, checkpoints:board.checkpoints};
    }
    if (draws) {
      if (!board.observed.some(row => row.first==='red'&&row.mode==='return') ||
          !board.observed.some(row => row.first==='red'&&row.mode==='keep') ||
          !exact(model.answers[0],3,5) || !exact(model.answers[1],2,4) || model.answers[2] !== 'contents') return null;
      return {binding, withReplacement:[3,5], withoutReplacement:[2,4]};
    }
    const [first,second] = branchFractions(task.target);
    if (board.paths.length !== 4 || !exact(model.prob,first*second,20) || model.answers[0] !== 'remain') return null;
    return {binding, paths:board.paths, target:[first*second,20]};

  } catch {
    return null;
  }
}
export function submittedP018ProbabilityObservationsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP018ProbabilityObservationsEvidence(task, model, context) : null;
}
