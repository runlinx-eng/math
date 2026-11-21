import {rational} from './phase5/b16-model.js';
import * as b36 from './phase5/b36-model.js';
import * as b13 from './phase5/b13-model.js';
import * as b22 from './phase5/b22-model.js';
import * as b23 from './phase5/b23-model.js';
import * as b29 from './phase5/b29-model.js';
import * as b34 from './phase5/b34-model.js';
import * as b35 from './phase5/b35-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "productways",
    "index": 3,
    "nodeId": "mt_Lb2ZnMdkYR",
    "type": "x-divreverse",
    "taskHash": "dd7adceab8d086a9b37036548182bc29a35886291fc82715e5fc8565586d24fc",
    "task": {
      "type": "x-divreverse",
      "a": 12,
      "b": 3,
      "prompt": "乘法可以交换，除法也能吗？把12与3换个位置实际看一看。"
    }
  },
  {
    "sessionId": "chanceline",
    "index": 1,
    "nodeId": "mt_t0g2SlP404",
    "type": "x-p22-pick",
    "taskHash": "b2477036bd92b31a300ae9def3db14000335b136c751225d2596268bb08a53e5",
    "task": {
      "type": "x-p22-pick",
      "prompt": "公平骰子掷到6，机会放在0到1之间哪里？先圈结果，再写一个分数。",
      "items": [
        {
          "label": "1",
          "group": "面"
        },
        {
          "label": "2",
          "group": "面"
        },
        {
          "label": "3",
          "group": "面"
        },
        {
          "label": "4",
          "group": "面"
        },
        {
          "label": "5",
          "group": "面"
        },
        {
          "label": "6",
          "group": "面"
        }
      ],
      "winners": [
        5
      ],
      "questions": [
        {
          "label": "1/6在一半的哪一侧",
          "value": "less",
          "options": [
            [
              "less",
              "小于一半"
            ],
            [
              "more",
              "大于一半"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "linemark",
    "index": 0,
    "nodeId": "mt_QysgF57dxh",
    "type": "x-s23-notation",
    "taskHash": "e1a99c9d90fad1741cacd4793a03da424189bc38f91f8d5cf6a915b245fb5fd3",
    "task": {
      "type": "x-s23-notation",
      "prompt": "给图中的线段、以B为顶点的角、平行和垂直关系写出记号。",
      "questions": [
        {
          "label": "∠ABC中间的字母B表示",
          "value": "vertex",
          "options": [
            [
              "vertex",
              "角的顶点"
            ],
            [
              "side",
              "一条完整的边"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "measurecalc",
    "index": 5,
    "nodeId": "mt_6oxQPNLHNv",
    "type": "x-m29-combine",
    "taskHash": "372c9ef8267b4b56f32ae67d0bebc1cd83640f0ff3796578cba80f185e2a47aa",
    "task": {
      "type": "x-m29-combine",
      "prompt": "两袋分别是 500 g 和 350 g。摆到同一起点，较重的多多少？",
      "parts": [
        500,
        350
      ],
      "names": [
        "甲袋",
        "乙袋"
      ],
      "unit": "g",
      "scale": 1,
      "mode": "difference"
    }
  },
  {
    "sessionId": "temperaturechange",
    "index": 4,
    "nodeId": "mt_RVK655t391",
    "type": "x-m29-interval",
    "taskHash": "3d09f371af0f9996a27e9533ab08c686ee171ec1892a4f8bd962581bb0d9e83f",
    "task": {
      "type": "x-m29-interval",
      "prompt": "模拟温度从 −2℃ 降到 −8℃。这次没有跨过零，相差多少度？",
      "start": -2,
      "end": -8,
      "unit": "℃"
    }
  },
  {
    "sessionId": "rules34",
    "index": 3,
    "nodeId": "mt_yXO7lQ9Yn7",
    "type": "x-p34-ambiguity",
    "taskHash": "a05812f073b6d1563a1b167f865f8dec7fbf57674bc4ca105ab0dca66e9f420a",
    "task": {
      "type": "x-p34-ambiguity",
      "prompt": "2、4、6的下一项是什么？先猜，再看看两条机器。",
      "questions": [
        {
          "label": "只看前三项",
          "value": "multiple",
          "kind": "choice",
          "options": [
            [
              "multiple",
              "可能有不止一种规则"
            ],
            [
              "only",
              "下一项只有一种可能"
            ]
          ]
        },
        {
          "label": "规则A的下一项",
          "value": 8,
          "kind": "number"
        },
        {
          "label": "规则B的下一项",
          "value": 10,
          "kind": "number"
        }
      ]
    }
  },
  {
    "sessionId": "bigmissing35",
    "index": 1,
    "nodeId": "mt_XuHmIn2xje",
    "type": "x-a35-try",
    "taskHash": "a2e6dbe63a7c6e10739934e317d6947c8902467263aa6027afcfc52c9f453c1a",
    "task": {
      "type": "x-a35-try",
      "prompt": "原来有一批，拿走125后还剩230。试出原来的数量。",
      "display": "x−125＝230",
      "a": 1,
      "b": -125,
      "right": 230,
      "solution": 355,
      "questions": []
    }
  },
  {
    "sessionId": "systems35",
    "index": 2,
    "nodeId": "mt_mqgu72aCMz",
    "type": "x-a35-plot",
    "taskHash": "f6d13ff0b75eb7de492571685420e70581bb369abebfe449ac69343a441def97",
    "task": {
      "type": "x-a35-plot",
      "prompt": "这两条线平行。试几个位置，看看能不能同时符合。",
      "lines": [
        {
          "m": 1,
          "b": 0
        },
        {
          "m": 1,
          "b": 1
        }
      ],
      "labels": [
        "y＝x",
        "y＝x＋1"
      ],
      "max": 5,
      "step": 1,
      "kind": "parallel",
      "goal": null,
      "example": [
        [
          0,
          0
        ],
        [
          1,
          2
        ]
      ],
      "questions": [
        {
          "label": "两条线的共同点",
          "value": "none",
          "kind": "choice",
          "options": [
            [
              "none",
              "没有共同点"
            ],
            [
              "one",
              "只有一个"
            ],
            [
              "many",
              "有无数个"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "systems35",
    "index": 3,
    "nodeId": "mt_mqgu72aCMz",
    "type": "x-a35-plot",
    "taskHash": "33c03ba3977bea17465bdc18cae7c28275164102d4ba70bac980acb527935300",
    "task": {
      "type": "x-a35-plot",
      "prompt": "两条关系画成同一条线。试两个位置，比较共同点。",
      "lines": [
        {
          "m": 1,
          "b": 0
        },
        {
          "m": 1,
          "b": 0
        }
      ],
      "labels": [
        "y＝x",
        "2y＝2x"
      ],
      "max": 5,
      "step": 1,
      "kind": "coincident",
      "goal": null,
      "example": [
        [
          0,
          0
        ],
        [
          2,
          2
        ]
      ],
      "questions": [
        {
          "label": "两条线的共同点",
          "value": "many",
          "kind": "choice",
          "options": [
            [
              "none",
              "没有共同点"
            ],
            [
              "one",
              "只有一个"
            ],
            [
              "many",
              "有无数个"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "linear36",
    "index": 3,
    "nodeId": "mt_WBdHkc2HTf",
    "type": "x-f36-live",
    "taskHash": "a10de7e4f6b78878f0a870a6b5970b56da0a62ae2365d8598e3a8c68481cf226",
    "task": {
      "type": "x-f36-live",
      "prompt": "把时间调到4。谁的位置更高？谁每次前进得更快？",
      "mode": "speed",
      "initial": {
        "time": 0
      },
      "controls": [
        "time"
      ],
      "required": [
        {
          "time": 4
        }
      ],
      "questions": [
        {
          "label": "时间4时，谁位置更高",
          "value": "green",
          "kind": "choice",
          "options": [
            [
              "purple",
              "紫色"
            ],
            [
              "green",
              "绿色"
            ]
          ]
        },
        {
          "label": "谁每次前进更快",
          "value": "purple",
          "kind": "choice",
          "options": [
            [
              "purple",
              "紫色"
            ],
            [
              "green",
              "绿色"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "proportionGraph37",
    "index": 1,
    "nodeId": "mt_FspV_imUGK",
    "type": "x-f36-live",
    "taskHash": "9573eff7d31d637a50eb70ceb233275ff177fa5c2ac9bfc49b5068d3b0b68eb0",
    "task": {
      "type": "x-f36-live",
      "prompt": "改变每步变化，比较线是否穿过原点。先注意起点不是0。",
      "mode": "linear",
      "initial": {
        "m": 1,
        "c": 1
      },
      "controls": [
        "m"
      ],
      "required": [
        {
          "m": 1
        },
        {
          "m": 2
        },
        {
          "m": -1
        }
      ],
      "questions": [
        {
          "label": "每步变化为负时，从左往右看",
          "value": "down",
          "kind": "choice",
          "options": [
            [
              "down",
              "线向下"
            ],
            [
              "up",
              "线向上"
            ]
          ]
        }
      ]
    }
  }
];
export const P016_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p016ModelAndRuleChecksBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p016-model-and-rule-checks', method:null, question:"用什么操作能分别核对两个解释或两条关系？"};
}
export function replayP016ModelAndRuleChecksEvidence(task, model, context) {
  try {
    const binding = p016ModelAndRuleChecksBinding(task, context);
    const modelForTask = [b36, b13, b22, b23, b29, b34, b35].find(owner => owner.TYPES.has(task?.type));
    if (!modelForTask) return null;
    const {initial,inspect,valid} = modelForTask;
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const fraction = raw => rational(raw.trim().replace(/\s*\/\s*/g,'/'));
    const exact = (raw,n,d=1) => {
      const value = fraction(raw);
      return value && BigInt(value[0])*BigInt(d) === BigInt(n)*BigInt(value[1]);
    };
    const number = raw => {
      const value = fraction(raw);
      return value ? value[0]/value[1] : NaN;
    };
    const ordered = (row, keys) => hasExactKeys(row,keys);
    let board = initial(task).board;
    const type = task.type;
    const first = board.first;
    let issue = false;
    for (const event of model.history) {
      issue = false;
      if (type === 'x-divreverse') {
        if (!ordered(event,['action','data']) ||
            !ordered(event.data,['amount','answer','bucket','cols','cut','index','prediction','result','rows','token']) ||
            [event.data.bucket,event.data.index,event.data.token].some(value=>value!==null)) return null;
        if (event.action === 'b13-reset') board = initial(task).board;
        else if (event.action === 'b13-div-swap' && event.data.answer.trim()) {
          board.firstAnswer ??= event.data.answer;
          board.swaps++;
          issue = !exact(event.data.answer,12,3);
        } else if (event.action === 'b13-div-swap') issue = true;
        else return null;
      } else if (type === 'x-p22-pick' || type === 'x-s23-notation') {
        const {a,d,f} = event;
        if (!ordered(event,['a','d','f'])) return null;
        if (a === 'reset' && ordered(d,[]) && ordered(f,[])) {
          first[type==='x-p22-pick'?'reset-0':'reset'] ??= {};
          board = {...initial(task).board,first};
        } else if (type === 'x-p22-pick' && a === 'toggle' && ordered(f,[]) &&
            ordered(d,['index']) && /^[0-5]$/.test(d.index)) {
          first['toggle-0'] ??= {};
          const index = Number(d.index), old = board.selected.indexOf(index);
          if (old < 0) board.selected.push(index);
          else board.selected.splice(old,1);
        } else if (type === 'x-s23-notation' && a === 'label' && ordered(d,[]) &&
            ordered(f,['segment','angleName','parallelName','perpName'])) {
          first.label ??= f;
          board.saved = f;
        } else return null;
      } else if (type.startsWith('x-m29-')) {
        const {a,i,v} = event;
        if (!ordered(event,['a','i','v'])) return null;
        const interval = type==='x-m29-interval';
        const sequence = interval ? board.moves : board.chosen;
        if (a==='undo' && i==='' && v==='') sequence.pop();
        else if (a==='clear' && i==='' && v==='') sequence.length=0;
        else if (interval && a==='move' && i==='') {
          first.move ??= v;
          const length=number(v), remaining=6-sequence.reduce((sum,part)=>sum+part,0);
          if (Number.isInteger(length) && length>=1 && length<=remaining) sequence.push(length);
          else { board.bad=true; issue=true; }
        } else if (!interval && a==='choose' && v==='' && /^[01]$/.test(i)) {
          if (!sequence.includes(Number(i))) sequence.push(Number(i));
        } else return null;
      } else if (type === 'x-p34-ambiguity') {
        const {a,i,v,w} = event;
        if (!ordered(event,['a','i','v','w']) || w!=='') return null;
        if (a==='predict' && i==='') {
          if (v.trim()) board.prediction ??= v;
        } else if (a==='show' && ['a','b'].includes(i) && v==='') {
          if (board.prediction!==null && !board.shown.includes(i)) board.shown.push(i);
        } else return null;
      } else if (type.startsWith('x-a35-')) {
        const {a,i,v,w,z,k}=event;
        if (!ordered(event,['a','i','v','w','z','k']) || i!=='' || z!=='' || k!=='') return null;
        if (a==='try' && type==='x-a35-try' && w==='') {
          first.try ??= v;
          const x=fraction(v);
          if (!x) { board.bad=true; issue=true; }
          else if (board.trials.length<40) {
            const right=230, numerator=x[0]-125*x[1];
            const left=numerator/x[1], equal=numerator===right*x[1];
            const display=(n,d)=> {
              let a=Math.abs(n),b=d;
              while(b) [a,b]=[b,a%b];
              return d===a ? String(n/a) : `${n/a}/${d/a}`;
            };
            if (!equal) board.bad=true;
            if (Number.isFinite(left)) board.trials.push({x:display(...x),left:display(numerator,x[1]),right:'230',equal});
          }
        } else if (a==='plot' && type==='x-a35-plot') {
          first.point ??= [v,w];
          const x=number(v),y=number(w);
          if (![x,y].every(n=>Number.isInteger(n)&&n>=0&&n<=5)) { board.bad=true; issue=true; }
          else if (board.trials.length<40) board.trials.push({pair:[x,y],on:task.lines.map(line=>y===line.m*x+line.b)});
        } else return null;
      } else {
        const {a,i,v,w,z}=event;
        if (!ordered(event,['a','i','v','w','z']) || v!=='' || w!=='' || z!=='') return null;
        if (a==='change') {
          const match=/^(m|time),(-?1)$/.exec(i);
          if (!match || !task.controls.includes(match[1])) return null;
          const key=match[1], next=board[key]+Number(match[2]);
          if (key==='time' ? next>=0&&next<=7 : next>=-3&&next<=3) board[key]=next;
        } else if (a==='save' && i==='') {
          const view=Object.fromEntries(task.controls.map(key=>[key,board[key]]));
          if (!board.views.some(row=>sameEvidence(row,view))) board.views.push(view);
        } else return null;
      }
    }
    if (issue || !sameEvidence(board,model.board) || !inspect(task,model).correct) return null;
    if (type==='x-divreverse') {
      if (!board.swaps || !exact(board.firstAnswer,12,3) || !exact(model.answer,12,3) || !exact(model.result,3,12)) return null;
      return {binding, forward:4, reverse:[1,4]};
    }
    if (type==='x-p22-pick') {
      if (!sameEvidence(board.selected,[5]) || !exact(model.prob,1,6) || model.kind!=='equal' || model.answers[0]!=='less') return null;
      return {binding, favorable:1, possible:6};
    }
    if (type==='x-s23-notation') {
      if (!board.saved || model.answers[0]!=='vertex') return null;
      const word = text=>text.trim().toUpperCase().replace(/\s/g,'');
      const segment = text=>[...text].sort().join('');
      const relationship=(name,separator)=>word(board.saved[name]).split(separator).map(segment).sort().join(':');
      if (segment(word(board.saved.segment))!=='AB' || !['ABC','CBA'].includes(word(board.saved.angleName).replace(/^∠/,'')) ||
          relationship('parallelName',/∥|\/\//)!=='AB:CD' || relationship('perpName','⊥')!=='AB:BC') return null;
      return {binding, vertex:'B', segment:'AB'};
    }
    if (type.startsWith('x-m29-')) {
      const interval=type==='x-m29-interval';
      const difference=interval ? 6 : 500-350;
      if (interval ? board.moves.reduce((sum,value)=>sum+value,0)!==difference : board.chosen.length!==2) return null;
      if (!exact(model.answer,difference) || model.unit!==(interval?'℃':'g')) return null;
      return {binding, difference, unit:model.unit};
    }
    if (type==='x-p34-ambiguity') {
      if (board.prediction===null || board.shown.length!==2 || model.answers[0]!=='multiple' ||
          !exact(model.answers[1],8) || !exact(model.answers[2],10)) return null;
      return {binding, nextValues:[8,10]};
    }
    if (type==='x-a35-try') {
      if (!board.trials.at(-1)?.equal || !exact(model.value,230+125)) return null;
      return {binding, solution:355, trials:board.trials.length};
    }
    if (type==='x-a35-plot') {
      const common=task.lines[0].b===task.lines[1].b;
      const uniqueCharts=new Set(board.trials.map(row=>row.pair.join(',')));
      if (uniqueCharts.size<2 || model.answers[0]!==(common?'many':'none') ||
          (common ? board.trials.filter(row=>row.on.every(Boolean)).length<2 : board.trials.some(row=>row.on.every(Boolean)))) return null;
      return {binding, intersections:common?'many':'none'};
    }
    if (!task.required.every(want=>board.views.some(view=>sameEvidence(view,want)))) return null;
    if (task.mode==='speed') {
      if (!sameEvidence(model.answers,['green','purple'])) return null;
      return {binding, positionsAtFour:[6*4,4*4+10], rates:[6,4]};
    }
    if (model.answers[0]!=='down' || board.c!==1) return null;
    return {binding, initialPosition:1, slopes:board.views.map(view=>view.m)};

  } catch {
    return null;
  }
}
export function submittedP016ModelAndRuleChecksEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP016ModelAndRuleChecksEvidence(task, model, context) : null;
}
