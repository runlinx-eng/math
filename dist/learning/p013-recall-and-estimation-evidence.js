import {rational} from './phase5/b16-model.js';
import * as b15 from './phase5/b15-model.js';
import * as b10 from './phase5/b10-model.js';
import * as b21 from './phase5/b21-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "factsfive",
    "index": 1,
    "nodeId": "mt_ghF3Vv6taM",
    "type": "x-recallbench",
    "taskHash": "2845248a3a76f423cc4b9e541d0cef0cd314f75171d18960d43cb91d41444c09",
    "task": {
      "type": "x-recallbench",
      "cases": [
        {
          "a": 2,
          "b": 3,
          "op": "+"
        },
        {
          "a": 5,
          "b": 2,
          "op": "-"
        },
        {
          "a": 3,
          "b": 3,
          "op": "-"
        },
        {
          "a": 4,
          "b": 0,
          "op": "+"
        },
        {
          "a": 4,
          "b": 0,
          "op": "-"
        }
      ],
      "prompt": "试着从刚才的关系里找答案，想不起来可以看看圆片。不计时。"
    }
  },
  {
    "sessionId": "bonds20",
    "index": 2,
    "nodeId": "mt_s2mfRBoTal",
    "type": "x-recallbench",
    "taskHash": "cfccb1679fdea8bf5db7a02c4ce78896a29ea5c6099c3fc2a8b741e43d2c5e92",
    "task": {
      "type": "x-recallbench",
      "cases": [
        {
          "a": 8,
          "b": 5,
          "op": "+"
        },
        {
          "a": 13,
          "b": 5,
          "op": "-"
        },
        {
          "a": 13,
          "b": 8,
          "op": "-"
        },
        {
          "a": 7,
          "b": 9,
          "op": "+"
        },
        {
          "a": 16,
          "b": 9,
          "op": "-"
        }
      ],
      "prompt": "换着看加法和减法，看看能否从已知的伙伴找回来。"
    }
  },
  {
    "sessionId": "factsten",
    "index": 1,
    "nodeId": "mt__we2TDqnJx",
    "type": "x-recallbench",
    "taskHash": "d5af5fb77b9353ce65dd4b9c1311c52b02e8c529c2390958ae323728ddbe76c0",
    "task": {
      "type": "x-recallbench",
      "cases": [
        {
          "a": 6,
          "b": 4,
          "op": "+"
        },
        {
          "a": 10,
          "b": 6,
          "op": "-"
        },
        {
          "a": 4,
          "b": 4,
          "op": "+"
        },
        {
          "a": 8,
          "b": 4,
          "op": "-"
        },
        {
          "a": 9,
          "b": 1,
          "op": "-"
        },
        {
          "a": 7,
          "b": 0,
          "op": "+"
        }
      ],
      "prompt": "试几种十以内的关系。不记得就看看圆片，原来的回答也会留下。"
    }
  },
  {
    "sessionId": "factstwenty",
    "index": 2,
    "nodeId": "mt__t4afSyZRm",
    "type": "x-recallbench",
    "taskHash": "3f2f755165c085df647ea34ca8a179c59118dd4d609d74df3a16d99dea3013f5",
    "task": {
      "type": "x-recallbench",
      "cases": [
        {
          "a": 7,
          "b": 8,
          "op": "+"
        },
        {
          "a": 15,
          "b": 8,
          "op": "-"
        },
        {
          "a": 9,
          "b": 6,
          "op": "+"
        },
        {
          "a": 15,
          "b": 6,
          "op": "-"
        },
        {
          "a": 8,
          "b": 8,
          "op": "+"
        },
        {
          "a": 16,
          "b": 8,
          "op": "-"
        }
      ],
      "prompt": "把同一个整体里的加减穿插着试。这里不计时。"
    }
  },
  {
    "sessionId": "scaleadd",
    "index": 0,
    "nodeId": "mt_3e_PQxwC12",
    "type": "x-recallbench",
    "taskHash": "d50ed456d653a7f443f9096632837781f7bd362fba71ef823fd36f4ad8df07b5",
    "task": {
      "type": "x-recallbench",
      "cases": [
        {
          "a": 7,
          "b": 8,
          "op": "+"
        },
        {
          "a": 15,
          "b": 8,
          "op": "-"
        }
      ],
      "prompt": "先试7+8和15−8，想不起来就看看圆片。"
    }
  },
  {
    "sessionId": "calculatormeaning",
    "index": 0,
    "nodeId": "mt_NmvuwVUFRS",
    "type": "x-estimatepad",
    "taskHash": "381cb4a241ce18401235cae0bd4130606c32ffc16d093f93fcb0b0f9e7d06216",
    "task": {
      "type": "x-estimatepad",
      "a": 47,
      "b": 10,
      "op": "*",
      "prompt": "47×10怎样算顺手？先估个大概，再用你选的方法算，最后核对输入。",
      "calculator": true,
      "method": [
        "mental",
        "written",
        "calculator"
      ]
    }
  },
  {
    "sessionId": "calculatormeaning",
    "index": 1,
    "nodeId": "mt_NmvuwVUFRS",
    "type": "x-estimatepad",
    "taskHash": "43f86184373eb6060cce00798cb5307f6973a922787064618a5bac705ef0a2d5",
    "task": {
      "type": "x-estimatepad",
      "a": 2365,
      "b": 48,
      "op": "*",
      "prompt": "2365×48先估个大概，再用这里的计算器算。输入错了也会留下记录。",
      "calculator": true,
      "method": [
        "written",
        "calculator"
      ]
    }
  },
  {
    "sessionId": "calculatormeaning",
    "index": 2,
    "nodeId": "mt_NmvuwVUFRS",
    "type": "x-estimatepad",
    "taskHash": "bc469daaeb3fe04d28822725b262e38e2e7a686ddecdab27f38d8e223732a06a",
    "task": {
      "type": "x-estimatepad",
      "a": 250,
      "b": 8,
      "op": "/",
      "prompt": "250人，每辆车8座。计算器的小数还要怎样变成能安排全部人的车数？",
      "calculator": true,
      "interpret": "up",
      "context": "每个人都要有座位，车必须是完整的一辆。"
    }
  },
  {
    "sessionId": "calculatormeaning",
    "index": 3,
    "nodeId": "mt_NmvuwVUFRS",
    "type": "x-estimatepad",
    "taskHash": "4c19e85833e3ee6aedb85ef73a3d4fd7406e957629b1cbbe5e2e4215bebcdf3a",
    "task": {
      "type": "x-estimatepad",
      "a": 250,
      "b": 8,
      "op": "/",
      "prompt": "250颗珠子，每盒8颗。只问能装满几盒，不能把没装满的也算一盒。",
      "calculator": true,
      "interpret": "down"
    }
  },
  {
    "sessionId": "calculatormeaning",
    "index": 4,
    "nodeId": "mt_NmvuwVUFRS",
    "type": "x-estimatepad",
    "taskHash": "70da17659d28a9c4c89a7a381638e0cb6708675a7b50156e4deacd98f5f01df0",
    "task": {
      "type": "x-estimatepad",
      "a": 250,
      "b": 8,
      "op": "/",
      "prompt": "250厘米绳平均分8段，每段可以细分。结果应该怎样写？",
      "calculator": true,
      "interpret": "exact"
    }
  },
  {
    "sessionId": "calculatormeaning",
    "index": 5,
    "nodeId": "mt_NmvuwVUFRS",
    "type": "x-estimatepad",
    "taskHash": "68cc6c92510e68e34a54f458114311859e496c98cd0323b08d23380a083f2e31",
    "task": {
      "type": "x-estimatepad",
      "a": 3847,
      "b": 26,
      "op": "*",
      "prompt": "3847×26：选择愿意采用的方法，先估再核对。实际用了怎样的心算或纸笔方法，留在自己的说明里。",
      "calculator": true,
      "method": [
        "mental",
        "written",
        "calculator"
      ]
    }
  },
  {
    "sessionId": "estimatecheck",
    "index": 0,
    "nodeId": "mt_ilPrU0cbtT",
    "type": "x-estimatepad",
    "taskHash": "dbba54c160909f186d58438f7845b8b609553846b2ac8e834a5d481fc9593d02",
    "task": {
      "type": "x-estimatepad",
      "a": 487,
      "b": 23,
      "op": "*",
      "prompt": "先选附近好算的数估一估，再检查给出的1120有没有数量上的问题。",
      "candidate": 1120
    }
  },
  {
    "sessionId": "estimatecheck",
    "index": 1,
    "nodeId": "mt_ilPrU0cbtT",
    "type": "x-estimatepad",
    "taskHash": "159f3237e00fd6da51b9f2cd2f39419647711ad1be6d75a318c910904f08ab8f",
    "task": {
      "type": "x-estimatepad",
      "a": 487,
      "b": 23,
      "op": "*",
      "prompt": "同一道计算，这次给出11201。接近估计，是否就能证明每一位都对？",
      "candidate": 11201
    }
  },
  {
    "sessionId": "estimatecheck",
    "index": 2,
    "nodeId": "mt_ilPrU0cbtT",
    "type": "x-estimatepad",
    "taskHash": "9ee5fd952b9be08ff85b50be9d06ab11ee3750bbe894079d6e554faf1791418f",
    "task": {
      "type": "x-estimatepad",
      "a": 198,
      "b": 49,
      "op": "*",
      "prompt": "广场约有198排、每排约49人。只需要报一个大概人数，先用容易算的数估一估。"
    }
  },
  {
    "sessionId": "decimalestimate",
    "index": 0,
    "nodeId": "mt_3m0pA-aeat",
    "type": "x-estimatepad",
    "taskHash": "1cd3c984e79ac05629d0edf7148447815a81741a2161e97d275d248433b4fcfb",
    "task": {
      "type": "x-estimatepad",
      "a": 4.87,
      "b": 30,
      "op": "*",
      "prompt": "4.87×30的结果被写成14.61。先估再看，小数点有没有走远？",
      "candidate": 14.61
    }
  },
  {
    "sessionId": "decimalestimate",
    "index": 1,
    "nodeId": "mt_3m0pA-aeat",
    "type": "x-estimatepad",
    "taskHash": "953a687b7d3cf56649b99c40ddaa2bbff8822efaa5df86cb917d903820a16e64",
    "task": {
      "type": "x-estimatepad",
      "a": 63.6,
      "b": 20,
      "op": "/",
      "prompt": "63.6÷20被写成31.8。用附近好算的数检查这个结果。",
      "candidate": 31.8
    }
  },
  {
    "sessionId": "decimalestimate",
    "index": 2,
    "nodeId": "mt_3m0pA-aeat",
    "type": "x-estimatepad",
    "taskHash": "eff8e5ef1162505bfb996211d38b27dbd7764f44b624720be6fd2c586897a913",
    "task": {
      "type": "x-estimatepad",
      "a": 2.46,
      "b": 400,
      "op": "*",
      "prompt": "2.46×400被写成984。估个大概，说明为什么仍不能只凭估计保证全对。",
      "candidate": 984
    }
  },
  {
    "sessionId": "estimatepeople",
    "index": 0,
    "nodeId": "mt_fQ9Rw10fss",
    "type": "x-estimate",
    "taskHash": "16d09ad421c9dd6ccecb1a5a608f36fb826ab0d2202bc4588151a7dafb22b773",
    "task": {
      "type": "x-estimate",
      "prompt": "从900人的完整名单随机抽60人，18人步行。把这份比例铺到900人，估计大约几人步行？",
      "mode": "count",
      "N": 900,
      "n": 60,
      "k": 18,
      "questions": []
    }
  },
  {
    "sessionId": "estimatepeople",
    "index": 1,
    "nodeId": "mt_fQ9Rw10fss",
    "type": "x-estimate",
    "taskHash": "9f059acc31b4f23fb0c99f46d939ebc728f642170461e924cd917bc7a00a042f",
    "task": {
      "type": "x-estimate",
      "prompt": "随机抽25人的每周阅读时间，样本平均6.4小时。用它估计全体平均，再说明为什么不能叫精确清点。",
      "mode": "mean",
      "N": 800,
      "n": 25,
      "k": 18,
      "questions": [],
      "mean": 6.4,
      "unit": "小时"
    }
  },
  {
    "sessionId": "estimatepeople",
    "index": 2,
    "nodeId": "mt_fQ9Rw10fss",
    "type": "x-estimate",
    "taskHash": "90a9730e36f26c5d88a9a9387c087a86d0c50a8938e0ee706c448923f9a4ca16",
    "task": {
      "type": "x-estimate",
      "prompt": "若60人全来自同一小组，18人步行，算式还能算，但能放心推广到全体900人吗？",
      "mode": "count",
      "N": 900,
      "n": 60,
      "k": 18,
      "questions": [],
      "validSample": false
    }
  }
];
export const P013_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p013RecallAndEstimationBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p013-recall-and-estimation', method:null, question:"怎样核对小算式、估计与精确计算各能说明什么？"};
}
export function replayP013RecallAndEstimationEvidence(task, model, context) {
  try {
    const binding = p013RecallAndEstimationBinding(task, context);
    const modelForTask = [b15, b10, b21].find(owner => owner.TYPES.has(task?.type));
    if (!modelForTask) return null;
    const {initial,inspect,valid} = modelForTask;
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const fraction=raw=>rational(raw.trim().replace(/\s*\/\s*/g,'/'));
    const exact=(raw,n,d=1)=>{
      const ratio=fraction(raw);
      return ratio && BigInt(ratio[0])*BigInt(d) === BigInt(n)*BigInt(ratio[1]);
    };
    if (task.type==='x-recallbench') {
      const answers=[];
      const help=new Set();
      for (const event of model.history) {
        if (!hasExactKeys(event,['index','answer','help','correct']) || event.index!==answers.length ||
            event.index>=task.cases.length || typeof event.answer!=='string' || typeof event.help!=='boolean' ||
            (help.has(event.index)&&!event.help)) return null;
        const {a,b,op}=task.cases[event.index];
        const wanted=a+(op==='+'?b:-b);
        const right=/^-?\d{1,4}$/.test(event.answer.trim())&&Number(event.answer)===wanted;
        if (right!==event.correct) return null;
        if (event.help) help.add(event.index);
        if (right) answers.push({answer:event.answer,help:event.help});
      }
      if (answers.length!==task.cases.length || model.cursor!==answers.length || model.answer!=='' ||
          !sameEvidence(answers,model.saved) || !sameEvidence([...help],model.help) || !inspect(task,model).correct) return null;
      return {binding, answers, help:[...help]};
    }
    if (task.type==='x-estimate') {
      const fields=['target','population','n','rate','estimate','precision','scope'];
      const count=task.mode==='count';
      const full=count?task.N/task.n:0;
      let board=initial(task).board;
      for (const event of model.history) {
        if (!hasExactKeys(event,['a','d','f']) || !hasExactKeys(event.d,[]) ||
            !hasExactKeys(event.f,event.a==='estimate'?fields:[])) return null;
        board.first[event.a+'-0'] ??= event.f;
        if (event.a==='reset') board={...initial(task).board,first:board.first};
        else if (event.a==='expand'&&count) {
          if (board.parts<full) {
            board.parts++;
            board.total=board.parts*task.k;
          }
        } else if (event.a==='estimate') board.saved=Object.fromEntries(fields.map(key=>[key,event.f[key]]));
        else return null;
      }
      const scope=task.validSample===false?'invalid':'random';
      if (!board.saved || !sameEvidence(board,model.board) || board.parts!==full ||
          model.target!=='population' || model.precision!=='approx' || model.scope!==scope ||
          !exact(model.population,task.N) || !exact(model.n,task.n) ||
          !(count ? exact(model.rate,task.k,task.n)&&exact(model.estimate,task.N*task.k,task.n) : exact(model.estimate,64,10)) ||
          !inspect(task,model).correct) return null;
      return {binding, estimate:count?task.N*task.k/task.n:6.4, scope, parts:board.parts};
    }

    const parseNumber=raw=>/^[+-]?\d{1,10}(?:\.\d{1,8})?$/.test(raw.trim())?Number(raw):null;
    const operation=(a,b)=>task.op==='*'?a*b:a/b;
    const finished=initial(task);
    const fields=Object.keys(finished).filter(key=>!['history','board','issue'].includes(key));
    let board=finished.board;
    let latestIssue=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['action','data']) || !hasExactKeys(event.data,['fields','index','value']) ||
          !hasExactKeys(event.data.fields,fields) || event.data.index!==null || event.data.value!==null) return null;
      latestIssue=false;
      const input=event.data.fields;
      if (event.action==='b15-reset') board=initial(task).board;
      else if (event.action==='b15-estimate') {
        board.first??={left:input.left,right:input.right,estimate:input.estimate};
        const left=parseNumber(input.left),right=parseNumber(input.right);
        const value=operation(left,right);
        if (b15.estimateOK(task,left,right)&&parseNumber(input.estimate)===value) board.estimate={left,right,value};
        else latestIssue=true;
      } else if (event.action==='b15-calculate') {
        if (board.estimate) {
          try {
            board.runs.push({entry:input.entry,value:b15.value(b15.parse(input.entry))});
          } catch {
            board.runs.push({entry:input.entry,value:null});
            latestIssue=true;
          }
        }
      } else return null;
    }
    if (latestIssue || !board.estimate || model.proof!=='not-proof' || !sameEvidence(board,model.board) ||
        !inspect(task,model).correct) return null;
    const accurate=operation(task.a,task.b);
    const plausible=task.candidate>accurate/2 && task.candidate<accurate*1.5;
    if (task.candidate && model.judgment!==(plausible?'plausible':'unreasonable')) return null;
    if (task.calculator) {
      const last=board.runs.at(-1);
      const wanted=task.interpret==='up'?Math.ceil(accurate):task.interpret==='down'?Math.floor(accurate):accurate;
      if (!last || last.value!==accurate || !b15.equivalent(last.entry,`${task.a}${task.op}${task.b}`) ||
          parseNumber(model.answer)!==wanted || (task.interpret&&model.reason!==task.interpret)) return null;
    }
    return {binding, estimate:board.estimate.value, accurate:task.calculator?accurate:null};

  } catch {
    return null;
  }
}
export function submittedP013RecallAndEstimationEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP013RecallAndEstimationEvidence(task, model, context) : null;
}
