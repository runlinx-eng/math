import {initial, inspect, valid} from './phase5/b10-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
const reviewed = [
  {
    "sessionId": "factsfive",
    "index": 0,
    "nodeId": "mt_ghF3Vv6taM",
    "type": "x-factfamily",
    "taskHash": "97695cd4554b6cab767090f7117dd8c077194a2c459ed1b251ab67f238c8ea91",
    "task": {
      "type": "x-factfamily",
      "a": 2,
      "b": 3,
      "prompt": "把2、3、5连成一家：合起来，再分别拿走一部分。"
    }
  },
  {
    "sessionId": "bonds20",
    "index": 0,
    "nodeId": "mt_s2mfRBoTal",
    "type": "x-factfamily",
    "taskHash": "45516b4f1d9d76c026bbffb04dd276e755831a8285f4d4ecd345d45b9f9f6f79",
    "task": {
      "type": "x-factfamily",
      "a": 8,
      "b": 5,
      "prompt": "用8与5合成整体，再倒着拆出这两部分，写齐四句话。"
    }
  },
  {
    "sessionId": "bridge20",
    "index": 2,
    "nodeId": "mt_m1W6nTQJ2b",
    "type": "x-factfamily",
    "taskHash": "154c6c129579d0657b7a40cb22ba5677b08cc0d925a6447a630eabb35b57f40c",
    "task": {
      "type": "x-factfamily",
      "a": 8,
      "b": 4,
      "prompt": "8+4=12。把同一个整体分别拆开，写出相关减法。"
    }
  },
  {
    "sessionId": "factsten",
    "index": 0,
    "nodeId": "mt__we2TDqnJx",
    "type": "x-factfamily",
    "taskHash": "1af2a731b72c08cc036052c602ced405fa2da29947c7e93b85e5e8a38210d5f9",
    "task": {
      "type": "x-factfamily",
      "a": 4,
      "b": 3,
      "prompt": "4与3合成7，再从7中找回两部分。"
    }
  },
  {
    "sessionId": "factstwenty",
    "index": 1,
    "nodeId": "mt__t4afSyZRm",
    "type": "x-factfamily",
    "taskHash": "4fa8c08b018e75fc1901348b2c3d6b90c50bef357575fab9ebe16333bf0d8028",
    "task": {
      "type": "x-factfamily",
      "a": 7,
      "b": 8,
      "prompt": "7、8、15能互相帮忙。做出四个方向的关系。"
    }
  },
  {
    "sessionId": "undoadd",
    "index": 1,
    "nodeId": "mt_ehGS_uVSJv",
    "type": "x-factfamily",
    "taskHash": "a9ec752be5d23986965d83ae5167a65e0e7fa3a752f4c63843361c1f0f974fca",
    "task": {
      "type": "x-factfamily",
      "a": 15,
      "b": 7,
      "prompt": "15与7合成22。亲自倒着取走一部分，检查能否回到原来的另一部分。"
    }
  },
  {
    "sessionId": "undoadd",
    "index": 2,
    "nodeId": "mt_ehGS_uVSJv",
    "type": "x-factfamily",
    "taskHash": "1be3332b43f6c7ce74b2412536e601811c7be67d238eb715b165d21029ed0942",
    "task": {
      "type": "x-factfamily",
      "a": 5,
      "b": 9,
      "prompt": "□+9=14。把找到的5放回去，再写出正着与倒着的关系。"
    }
  },
  {
    "sessionId": "sense38",
    "index": 2,
    "nodeId": "mt_WkKkb7W9Qd",
    "type": "x-factfamily",
    "taskHash": "1af2a731b72c08cc036052c602ced405fa2da29947c7e93b85e5e8a38210d5f9",
    "task": {
      "type": "x-factfamily",
      "a": 4,
      "b": 3,
      "prompt": "4与3合成7，再从7中找回两部分。"
    }
  }
];
export const P009B_SOURCES = Object.freeze(reviewed.map(({task,...source})=>Object.freeze(source)));
export function p009bAddSubtractFamilyBinding(task,context) {
  if (!isEvidenceContext(context)) return null;
  const row = reviewed.find(entry=>entry.sessionId===context.sessionId && entry.index===context.index);
  if (!row || !sameEvidence(row.task,task) || !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p009b-add-subtract-family',method:null,question:"两部分怎样合成整体，再从整体找回任一部分？"};
}
export function replayP009BAddSubtractFamilyEvidence(task,model,context) {
  try {
    const binding=p009bAddSubtractFamilyBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const {a,b}=task, whole=a+b;
    const expected={add:[a,b,'+',whole],swap:[b,a,'+',whole],
      'take-a':[whole,a,'-',b],'take-b':[whole,b,'-',a]};
    const saved=new Map();
    let mode='', rejected=0;
    const normalize=raw=>raw.replace(/\s/g,'').replace(/＋/g,'+').replace(/[−–－]/g,'-').replace(/＝/g,'=');
    for (const event of model.history) {
      if (event.action==='move'&&hasExactKeys(event,['action','mode'])&&Object.hasOwn(expected,event.mode)) {
        mode=event.mode;
        continue;
      }
      if (!mode||!hasExactKeys(event,['mode','eq'])||event.mode!==mode||typeof event.eq!=='string') return null;
      const [left,right,op,result]=expected[mode];
      const exact=normalize(event.eq);
      if (exact===`${left}${op}${right}=${result}`||exact===`${result}=${left}${op}${right}`) {
        saved.delete(mode);
        saved.set(mode,{mode,eq:event.eq});
      } else rejected++;
    }
    if (mode!==model.mode||saved.size!==4||!sameEvidence([...saved.values()],model.saved)||!inspect(task,model).correct) return null;
    return {binding,parts:[a,b],whole,modes:[...saved.keys()],rejected};
  } catch {
    return null;
  }
}
export function submittedP009BAddSubtractFamilyEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP009BAddSubtractFamilyEvidence(task,model,context) : null;
}
