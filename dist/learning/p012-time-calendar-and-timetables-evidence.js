import {rational} from './phase5/b16-model.js';
import * as b32 from './phase5/b32-model.js';
import * as b20 from './phase5/b20-model.js';
import * as b29 from './phase5/b29-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "timetable",
    "index": 0,
    "nodeId": "mt_Cqm8iy48UI",
    "type": "x-timetable",
    "taskHash": "4768a2a3eb1ca89efc9af381ed3da15997d4b72da4ddabff65775207f490a909",
    "task": {
      "type": "x-timetable",
      "mode": "read",
      "prompt": "要在公园站乘B班车。先找到对应的行和列，再把出发时刻留下。",
      "rows": [
        "起点站",
        "公园站",
        "图书馆站"
      ],
      "cols": [
        "A班",
        "B班",
        "C班"
      ],
      "grid": [
        [
          "09:10",
          "10:10",
          "11:10"
        ],
        [
          "09:25",
          "10:25",
          "11:25"
        ],
        [
          "09:45",
          "10:45",
          "11:45"
        ]
      ],
      "target": [
        1,
        1
      ],
      "questions": [
        {
          "label": "B班在公园站几点出发",
          "value": "10:25"
        }
      ]
    }
  },
  {
    "sessionId": "timetable",
    "index": 2,
    "nodeId": "mt_Cqm8iy48UI",
    "type": "x-timetable",
    "taskHash": "141a5692e30a320d2e8d4b583c2aadc853abb494a28c99e56f3fc1579465f0f4",
    "task": {
      "type": "x-timetable",
      "mode": "journey",
      "prompt": "10:50出发，11:20到。向前走分钟，跨过11:00，再算经过多久。",
      "start": 650,
      "end": 680,
      "questions": [
        {
          "label": "共经过多少分钟",
          "value": 30
        },
        {
          "label": "其中整小时数",
          "value": 0
        },
        {
          "label": "余下多少分钟",
          "value": 30
        }
      ]
    }
  },
  {
    "sessionId": "timetable",
    "index": 3,
    "nodeId": "mt_Cqm8iy48UI",
    "type": "x-timetable",
    "taskHash": "cbf3df3dd836d5a1aa401cd39023dae994ee745731c612e4a56098a86cf53fbf",
    "task": {
      "type": "x-timetable",
      "mode": "journey",
      "prompt": "另一趟列车10:50出发、13:13到。可以用不同大小的步子走，但每小时都是60分钟。",
      "start": 650,
      "end": 793,
      "questions": [
        {
          "label": "共经过多少分钟",
          "value": 143
        },
        {
          "label": "其中整小时数",
          "value": 2
        },
        {
          "label": "余下多少分钟",
          "value": 23
        }
      ]
    }
  },
  {
    "sessionId": "practicalmeasure",
    "index": 2,
    "nodeId": "mt_5HV4mbgSGH",
    "type": "x-m29-clock",
    "taskHash": "359e0ccc1dac1d91938573bf9d5f792e982ca64268e267be8214ad8324ede1ac",
    "task": {
      "type": "x-m29-clock",
      "prompt": "09:20 出发，路上走 1 小时 45 分钟。自己分段向前走，几点到达？",
      "start": 560,
      "duration": 105
    }
  },
  {
    "sessionId": "eventorder",
    "index": 0,
    "nodeId": "mt_-vvVxpOHG2",
    "type": "x-t32-order",
    "taskHash": "a06dfde4c6e4511a31d647e098d9544b062fee091985523fa6b69a600f54cd6c",
    "task": {
      "type": "x-t32-order",
      "prompt": "把早上的三件事按故事发生的顺序排好。",
      "items": [
        {
          "label": "早餐",
          "value": 2
        },
        {
          "label": "起床",
          "value": 1
        },
        {
          "label": "出门",
          "value": 3
        }
      ],
      "questions": []
    }
  },
  {
    "sessionId": "weekmonth",
    "index": 2,
    "nodeId": "mt_bj1YCgNWUx",
    "type": "x-t32-units",
    "taskHash": "7b83984d0003c5eff02b97fe4cec70befd0f18177aa12a3f1039e8363beadaca",
    "task": {
      "type": "x-t32-units",
      "prompt": "把一年中的12个月放进来。",
      "parts": [
        {
          "label": "1月"
        },
        {
          "label": "2月"
        },
        {
          "label": "3月"
        },
        {
          "label": "4月"
        },
        {
          "label": "5月"
        },
        {
          "label": "6月"
        },
        {
          "label": "7月"
        },
        {
          "label": "8月"
        },
        {
          "label": "9月"
        },
        {
          "label": "10月"
        },
        {
          "label": "11月"
        },
        {
          "label": "12月"
        }
      ],
      "questions": [
        {
          "label": "一年有几个月",
          "value": 12,
          "kind": "number"
        },
        {
          "label": "一周有几天",
          "value": 7,
          "kind": "number"
        }
      ]
    }
  },
  {
    "sessionId": "calendarfacts",
    "index": 1,
    "nodeId": "mt_EXlmTURK_o",
    "type": "x-t32-units",
    "taskHash": "d1b0ee036acf3aa56ebe9c4e228dd7a62d9383af23fc7773cce8dd48450a7546",
    "task": {
      "type": "x-t32-units",
      "prompt": "查看平年各月的天数。",
      "parts": [
        {
          "label": "1月31天"
        },
        {
          "label": "2月28天"
        },
        {
          "label": "3月31天"
        },
        {
          "label": "4月30天"
        },
        {
          "label": "5月31天"
        },
        {
          "label": "6月30天"
        },
        {
          "label": "7月31天"
        },
        {
          "label": "8月31天"
        },
        {
          "label": "9月30天"
        },
        {
          "label": "10月31天"
        },
        {
          "label": "11月30天"
        },
        {
          "label": "12月31天"
        }
      ],
      "questions": [
        {
          "label": "4月有多少天",
          "value": 30,
          "kind": "number"
        },
        {
          "label": "平年2月有多少天",
          "value": 28,
          "kind": "number"
        }
      ]
    }
  },
  {
    "sessionId": "calendarfacts",
    "index": 2,
    "nodeId": "mt_EXlmTURK_o",
    "type": "x-t32-calendar",
    "taskHash": "390f8a2b5586fb42b0e9aca8c10a64b7b9ec70fb8f6223fe97905f2e5ba68a74",
    "task": {
      "type": "x-t32-calendar",
      "prompt": "在2024年2月找到29日，比较平年和闰年。",
      "months": [
        [
          2024,
          2
        ]
      ],
      "dates": [
        "2024-02-29"
      ],
      "questions": [
        {
          "label": "2024年有多少天",
          "value": 366,
          "kind": "number"
        },
        {
          "label": "1900年是",
          "value": "common",
          "kind": "choice",
          "options": [
            [
              "common",
              "平年"
            ],
            [
              "leap",
              "闰年"
            ]
          ]
        },
        {
          "label": "2000年是",
          "value": "leap",
          "kind": "choice",
          "options": [
            [
              "common",
              "平年"
            ],
            [
              "leap",
              "闰年"
            ]
          ]
        }
      ]
    }
  }
];
export const P012_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p012TimeCalendarAndTimetablesBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p012-time-calendar-and-timetables', method:null, question:"按行列查时间、按分钟走到终点，或用日历检查一天的日期。"};
}
export function replayP012TimeCalendarAndTimetablesEvidence(task, model, context) {
  try {
    const binding = p012TimeCalendarAndTimetablesBinding(task, context);
    const modelForTask = [b32, b20, b29].find(owner => owner.TYPES.has(task?.type));
    if (!modelForTask) return null;
    const {initial,inspect,valid} = modelForTask;
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const integer = raw => /^\d+$/.test(raw.trim()) ? Number(raw) : NaN;
    const type = task.type;
    let board = initial(task).board;
    const modelFields = Object.keys(initial(task)).filter(key => !['board','history','issue'].includes(key));
    const sum = values => values.reduce((total,value)=>total+value,0);
    let issue=false;
    for (const event of model.history) {
      issue=false;
      if (type==='x-timetable') {
        const {a,d,f}=event;
        if (!hasExactKeys(event,['a','d','f']) || !hasExactKeys(d,[]) || !hasExactKeys(f,modelFields)) return null;
        if (a==='reset') {
          board={...initial(task).board,first:board.first};
          continue;
        }
        board.first[a+'-0'] ??= f;
        if (task.mode==='read' && a==='cell') {
          const row=integer(f.row),col=integer(f.col);
          if (row>=0&&row<task.rows.length&&col>=0&&col<task.cols.length) board.cell=[row,col];
        } else if (task.mode==='journey' && a==='jump') {
          const jump=integer(f.jump);
          if (jump>=1&&jump<=task.end-board.time) {
            board.time+=jump;
            board.hops.push(jump);
          } else issue=true;
        } else return null;
        continue;
      }
      const {a,i,v}=event;
      if (!hasExactKeys(event,['a','i','v'])) return null;
      if (type==='x-m29-clock') {
        if (i!=='') return null;
        if (a==='move') {
          board.first.move ??= v;
          const jump=integer(v);
          if (jump>=1&&jump<=task.duration-sum(board.moves)) board.moves.push(jump);
          else {board.bad=true;issue=true;}
        } else if (a==='undo' && v==='') board.moves.pop();
        else if (a==='clear' && v==='') board.moves.length=0;
        else return null;
      } else if (type==='x-t32-order') {
        if (v!=='') return null;
        if (a==='clear'&&i==='') board.order.length=0;
        else if (a==='order' && /^[0-2]$/.test(i) && !board.order.includes(Number(i))) {
          board.order.push(Number(i));
          if (board.order.length===3) {
            board.first.order ??= [...board.order];
            if (!sameEvidence(board.order,[1,0,2])) board.bad=true;
          }
        } else return null;
      } else if (type==='x-t32-units') {
        if (a!=='unit'||v!==''||!/^\d+$/.test(i)||Number(i)>=task.parts.length) return null;
        const index=Number(i),old=board.selected.indexOf(index);
        if (old<0) board.selected.push(index);
        else board.selected.splice(old,1);
        board.selected.sort((a,b)=>a-b);
      } else if (type==='x-t32-calendar') {
        if (v!=='') return null;
        if (a==='page'&&i==='0') board.page=0;
        else if (a==='day' && /^2024-02-(?:0[1-9]|1\d|2\d)$/.test(i)) {
          const old=board.selected.indexOf(i);
          if (old>=0) board.selected.splice(old,1);
          else if (!board.selected.length) board.selected.push(i);
        } else return null;
      } else return null;
    }
    if (issue || !sameEvidence(board,model.board) || !inspect(task,model).correct) return null;
    if (type==='x-timetable') {
      if (task.mode==='read') {
        if (!sameEvidence(board.cell,[1,1]) || model.answers[0].trim()!=='10:25') return null;
        return {binding, row:1, column:1, departure:'10:25'};
      }
      const elapsed=task.end-task.start;
      if (board.time!==task.end||sum(board.hops)!==elapsed||
          !sameEvidence(model.answers.map(integer),[elapsed,Math.floor(elapsed/60),elapsed%60])) return null;
      return {binding, elapsed, hops:board.hops};
    }
    if (type==='x-m29-clock') {
      const arrival=560+105;
      const clock=`${Math.floor(arrival/60)}:${String(arrival%60).padStart(2,'0')}`;
      if (sum(board.moves)!==105||model.answer!==clock) return null;
      return {binding, arrival:clock, hops:board.moves};
    }
    if (type==='x-t32-order') return sameEvidence(board.order,[1,0,2]) ? {binding, order:board.order} : null;
    if (type==='x-t32-units') {
      const answers=context.sessionId==='weekmonth'?[12,7]:[30,28];
      if (board.selected.length!==12||!sameEvidence(model.answers.map(integer),answers)) return null;
      return {binding, parts:board.selected};
    }
    const leap=year=>year%4===0&&(year%100!==0||year%400===0);
    if (!sameEvidence(board.selected,['2024-02-29']) ||
        integer(model.answers[0])!==365+Number(leap(2024)) ||
        model.answers[1]!== (leap(1900)?'leap':'common') ||
        model.answers[2]!== (leap(2000)?'leap':'common')) return null;
    return {binding, day:'2024-02-29', yearLength:366};

  } catch {
    return null;
  }
}
export function submittedP012TimeCalendarAndTimetablesEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP012TimeCalendarAndTimetablesEvidence(task, model, context) : null;
}
