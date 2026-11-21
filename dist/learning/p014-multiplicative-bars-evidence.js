import {initial, inspect, valid} from './phase5/b16-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';
import * as bars from './phase5/b15-model.js';

const reviewed = [
  {
    "sessionId": "scaleandpair",
    "index": 0,
    "nodeId": "mt_EmR5n58jZt",
    "type": "x-comparebars",
    "taskHash": "6fcdc089615021160a8a439dc5fd3f93d2c4ee3aa92974c9409ae167cb0ecedc",
    "task": {
      "type": "x-comparebars",
      "part": 8,
      "factor": 3,
      "prompt": "红带8厘米，蓝带是它的3倍。再搭一条只比红带多3厘米的带子作比较。",
      "unknown": "result",
      "equations": [
        "8*3=n",
        "3*8=n"
      ]
    }
  },
  {
    "sessionId": "scaleandpair",
    "index": 2,
    "nodeId": "mt_EmR5n58jZt",
    "type": "x-comparebars",
    "taskHash": "0eb27cee4bfae5e6b5a0d276ff9ecea566387437af1e6ab75ae2b18faba385af",
    "task": {
      "type": "x-comparebars",
      "part": 6,
      "factor": 3,
      "prompt": "一条带子18厘米，是原带子的3倍。原来的一份是多少？",
      "unknown": "part",
      "equations": [
        "3*n=18",
        "n*3=18",
        "18/3=n"
      ]
    }
  },
  {
    "sessionId": "combineproducts",
    "index": 1,
    "nodeId": "mt_AR-K72OIIO",
    "type": "x-comparebars",
    "taskHash": "c2efb3052679097c5ac7dcab6b0acc9500a26356c3f1544840654ee4950482ae",
    "task": {
      "type": "x-comparebars",
      "part": 15,
      "factor": 3,
      "prompt": "楼高15米，塔是楼的3倍。另搭一条只高出3米的线比较。",
      "unknown": "result",
      "equations": [
        "15*3=n",
        "3*15=n"
      ]
    }
  },
  {
    "sessionId": "timesmeaning",
    "index": 0,
    "nodeId": "mt_U4cIBXVug4",
    "type": "x-comparebars",
    "taskHash": "d5debee6beb6f4713e6e9de7561e03f1bdae8fe914f667df845a3f872e46773c",
    "task": {
      "type": "x-comparebars",
      "part": 4,
      "factor": 4,
      "prompt": "原来4颗，另一份是它的4倍。再比较只比原来多4颗。",
      "unknown": "result",
      "equations": [
        "4*4=n",
        "4*4=n"
      ]
    }
  },
  {
    "sessionId": "timesmeaning",
    "index": 1,
    "nodeId": "mt_U4cIBXVug4",
    "type": "x-comparebars",
    "taskHash": "0fbca22397b679c9b313e2dceb31b46db90b636f07acd551d69cc8cca2c882d0",
    "task": {
      "type": "x-comparebars",
      "part": 8,
      "factor": 3,
      "prompt": "汤姆8张贴纸，莎拉是他的3倍。用n表示莎拉的数量，写出关系。",
      "unknown": "result",
      "equations": [
        "8*3=n",
        "3*8=n"
      ]
    }
  },
  {
    "sessionId": "timesmeaning",
    "index": 2,
    "nodeId": "mt_U4cIBXVug4",
    "type": "x-comparebars",
    "taskHash": "ea511ade7370688b284f31cde9bb37d3a1111ad75b3993d816d4d18956fb6de5",
    "task": {
      "type": "x-comparebars",
      "part": 7,
      "factor": 5,
      "prompt": "35张是7张的几倍？图里哪条作一份，要说清楚。",
      "unknown": "factor",
      "equations": [
        "7*n=35",
        "n*7=35",
        "35/7=n"
      ]
    }
  },
  {
    "sessionId": "timesproblems",
    "index": 0,
    "nodeId": "mt_6-j1NO2ZUH",
    "type": "x-comparebars",
    "taskHash": "b4b017bc13f03909a48fcf0469ddbd8111b3b681665e5e1d31900d4002de2ba6",
    "task": {
      "type": "x-comparebars",
      "part": 7,
      "factor": 3,
      "prompt": "红带7厘米，蓝带是红带的3倍，蓝带多长？",
      "unknown": "result",
      "equations": [
        "7*3=n",
        "3*7=n"
      ]
    }
  },
  {
    "sessionId": "timesproblems",
    "index": 1,
    "nodeId": "mt_6-j1NO2ZUH",
    "type": "x-comparebars",
    "taskHash": "0ca9305ac5d8b4a4ddfd2f89ab5315190ff3ab2cf6bf53fccce10e83d518b0b4",
    "task": {
      "type": "x-comparebars",
      "part": 9,
      "factor": 4,
      "prompt": "大盒36颗，是小盒的4倍。小盒有几颗？",
      "unknown": "part",
      "equations": [
        "4*n=36",
        "n*4=36",
        "36/4=n"
      ]
    }
  },
  {
    "sessionId": "timesproblems",
    "index": 2,
    "nodeId": "mt_6-j1NO2ZUH",
    "type": "x-comparebars",
    "taskHash": "dc7ac5308bd45d8df446e0607d69b682d4bfec98b67a03d2c95f5e84b580a0e3",
    "task": {
      "type": "x-comparebars",
      "part": 6,
      "factor": 4,
      "prompt": "24颗与6颗，前者相当于后者的几份？",
      "unknown": "factor",
      "equations": [
        "6*n=24",
        "n*6=24",
        "24/6=n"
      ]
    }
  },
  {
    "sessionId": "timesproblems",
    "index": 3,
    "nodeId": "mt_6-j1NO2ZUH",
    "type": "x-comparebars",
    "taskHash": "5d7c7a1f1512ffe4ad9d178297b8c87d42d211fb989b6b9596dc49878ab6c82a",
    "task": {
      "type": "x-comparebars",
      "part": 6,
      "factor": 5,
      "prompt": "原来6颗。“多5颗”和“是5倍”分别怎样接？",
      "unknown": "result",
      "equations": [
        "6*5=n",
        "5*6=n"
      ]
    }
  },
  {
    "sessionId": "modelrecipe",
    "index": 1,
    "nodeId": "mt_K3R0yaHVcx",
    "type": "x-portionbar",
    "taskHash": "ab8c1b0f97a35bdff4309b1597e67c2ab3f4d119fe536094a261327fb857b981",
    "task": {
      "type": "x-portionbar",
      "total": 500,
      "d": 4,
      "n": 3,
      "unit": "g",
      "prompt": "一份食谱用500克面粉，只做它的3/4。先画出分与取，再把结果带回克。",
      "equations": [
        "500/4*3=375",
        "3/4*500=375",
        "500*(3/4)=375"
      ]
    }
  },
  {
    "sessionId": "modelrecipe",
    "index": 2,
    "nodeId": "mt_K3R0yaHVcx",
    "type": "x-portionbar",
    "taskHash": "2f407fa0cf688f57cc1efbad45e97736cad1ad2c47b4f9c8d5bda6932e4b9b40",
    "task": {
      "type": "x-portionbar",
      "total": 100,
      "d": 4,
      "n": 3,
      "unit": "cm",
      "prompt": "整条1米，也就是100厘米。取它的3/4，用厘米记录长度。",
      "equations": [
        "100/4*3=75",
        "3/4*100=75",
        "100*(3/4)=75"
      ]
    }
  },
  {
    "sessionId": "viewlinks",
    "index": 0,
    "nodeId": "mt_CUmjcE7W6c",
    "type": "x-comparebars",
    "taskHash": "5976ff3115557d7a84448f874a140046a411930a1831933c8150d896bc45ae2b",
    "task": {
      "type": "x-comparebars",
      "part": 4,
      "factor": 3,
      "prompt": "4人份食谱扩大到3份。搭出条形，再用n记需要准备的人份。",
      "unknown": "result",
      "equations": [
        "4*3=n",
        "3*4=n"
      ]
    }
  },
  {
    "sessionId": "storyfraction",
    "index": 1,
    "nodeId": "mt_dXq9VWm31W",
    "type": "x-portionbar",
    "taskHash": "53466853f49921e2c3222164fef31cac096a9e47403adfd6fa274669c17b777d",
    "task": {
      "type": "x-portionbar",
      "total": 120,
      "d": 4,
      "n": 3,
      "unit": "cm",
      "prompt": "120厘米的带子取3/4，用条形把整个与要取的部分说清楚。",
      "equations": [
        "120/4*3=90",
        "3/4*120=90",
        "120*(3/4)=90"
      ]
    }
  },
  {
    "sessionId": "fractionmeasure",
    "index": 0,
    "nodeId": "mt_wB-GBDkoNr",
    "type": "x-portionbar",
    "taskHash": "1a6ddc8c7f1470462862048ede3605059684460892dd26960210df2d928ee054",
    "task": {
      "type": "x-portionbar",
      "total": 320,
      "d": 4,
      "n": 1,
      "unit": "fen",
      "prompt": "3.20元是320分，平均分四份取一份；用分记录拿到的量。",
      "equations": [
        "320/4*1=80",
        "320*(1/4)=80"
      ]
    }
  },
  {
    "sessionId": "fractionmeasure",
    "index": 2,
    "nodeId": "mt_wB-GBDkoNr",
    "type": "x-portionbar",
    "taskHash": "37123f55c6119904ef1d205dc72238aea6ef92c3ae31e00fbdce28fe618eb83b",
    "task": {
      "type": "x-portionbar",
      "total": 1000,
      "d": 10,
      "n": 3,
      "unit": "g",
      "prompt": "1千克就是1000克，取3/10，用克记录。",
      "equations": [
        "1000/10*3=300",
        "1000*(3/10)=300"
      ]
    }
  },
  {
    "sessionId": "structurechoices",
    "index": 2,
    "nodeId": "mt_hlGKg5M7qJ",
    "type": "x-portionbar",
    "taskHash": "9544f07d620908737c109a7909ca588c41c9306cfff440a9be3cad5a03b56250",
    "task": {
      "type": "x-portionbar",
      "total": 80,
      "d": 4,
      "n": 3,
      "unit": "yuan",
      "prompt": "75%与3/4是同一个量。80元取3/4，先搭图再写自己的计算关系。",
      "equations": [
        "80/4*3=60",
        "80*(3/4)=60"
      ]
    }
  },
  {
    "sessionId": "structurechoices",
    "index": 3,
    "nodeId": "mt_hlGKg5M7qJ",
    "type": "x-portionbar",
    "taskHash": "424a90e8df957ed56830e72be829d9dfefc7fda700f09f8e063369c17e050dcb",
    "task": {
      "type": "x-portionbar",
      "total": 80,
      "d": 8,
      "n": 1,
      "unit": "yuan",
      "prompt": "12.5%与1/8一样多。同样80元，这次选八等份中的一份。",
      "equations": [
        "80/8*1=10",
        "80*(1/8)=10"
      ]
    }
  }
];
export const P014_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p014MultiplicativeBarsBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p014-multiplicative-bars', method:null, question:"比较多几和几倍时各接什么？取整体的几份要按什么单位记录？"};
}
export function replayP014MultiplicativeBarsEvidence(task, model, context) {
  try {
    const binding = p014MultiplicativeBarsBinding(task, context);
    if (binding && task.type === 'x-comparebars') return compareEvidence(task,model,binding);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const fields = Object.keys(initial(task)).filter(key => !['history','board','issue'].includes(key));
    const equal = (text,n,d=1) => {
      const ratio = rational(text.trim().replace(/\s*\/\s*/g,'/'));
      return ratio && BigInt(ratio[0])*BigInt(d) === BigInt(n)*BigInt(ratio[1]);
    };
    let parts = 1, built = false, issue = false;
    let taken = [];
    for (const event of model.history) {
      if (!hasExactKeys(event,['action','data']) || !hasExactKeys(event.data.fields,fields) ||
          !hasExactKeys(event.data,event.action==='take'?['index','fields']:['fields'])) return null;
      issue = false;
      const {index,fields:input} = event.data;
      if (event.action === 'bar') {
        const count = /^\d+$/.test(input.parts.trim()) ? Number(input.parts) : NaN;
        if (count < 1 || count > 12 || !Number.isSafeInteger(count)) issue = true;
        else {
          parts = count;
          taken = [];
          built = true;
        }
      } else if (event.action === 'take' && /^\d+$/.test(index) && Number(index) < parts) {
        const id = Number(index);
        const prior = taken.indexOf(id);
        if (prior === -1) taken.push(id);
        else taken.splice(prior,1);
      } else if (event.action === 'reset') {
        parts = 1;
        taken = [];
        built = false;
      } else return null;
    }
    if (issue || !built || parts !== task.d || taken.length !== task.n ||
        !sameEvidence({parts,taken,built},model.board) || !equal(model.parts,parts) ||
        !equal(model.per,task.total,parts) || !equal(model.answer,task.total*taken.length,parts) ||
        model.unit !== task.unit || !inspect(task,model).correct) return null;
    return {binding, parts, taken, amount:task.total*taken.length/parts, unit:task.unit};

  } catch {
    return null;
  }
}
export function submittedP014MultiplicativeBarsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP014MultiplicativeBarsEvidence(task, model, context) : null;
}

function compareEvidence(task, model, binding) {
  const original = bars.initial(task);
  if (!hasExactKeys(model,Object.keys(original)) || !bars.valid(task,model) || model.issue !== '' ||
      !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
  const fields = Object.keys(original).filter(key => !['history','board','issue'].includes(key));
  let built = null;
  let issue = false;
  const number = raw => {
    const value = rational(raw.trim());
    return value ? value[0]/value[1] : NaN;
  };
  for (const event of model.history) {
    if (!hasExactKeys(event,['action','data']) || !hasExactKeys(event.data,['fields','index','value']) ||
        !hasExactKeys(event.data.fields,fields) || event.data.index !== null || event.data.value !== null) return null;
    issue = false;
    if (event.action === 'b15-reset') {
      built = null;
    } else if (event.action === 'b15-bars') {
      const {count,part,extra} = event.data.fields;
      const values = [number(count),number(part),number(extra)];
      if (!values.every(Number.isInteger) || values[0]<1 || values[0]>12 ||
          values[1]<1 || values[1]>36 || values[2]<0 || values[2]>12) issue = true;
      else built = {count:values[0],part:values[1],extra:values[2]};
    } else return null;
  }
  const {part,factor,unknown} = task;
  const multiplied = part*factor, added = part+factor;
  const answer = unknown === 'part' ? multiplied/factor : unknown === 'factor' ? multiplied/part : multiplied;
  if (issue || !sameEvidence(built,{count:factor,part,extra:factor}) || !sameEvidence({built},model.board) ||
      number(model.count) !== factor || number(model.part) !== part || number(model.extra) !== factor ||
      number(model.answer) !== answer || number(model.addAnswer) !== added || !bars.inspect(task,model).correct) return null;
  return {binding, multiplied, added, answer};
}
